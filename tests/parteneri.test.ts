import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { document, invitation, oldHouse, partnerConsent, person, relationship, tree, treeMember, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteAccount, exportMyData } from "@/lib/account";
import { buildGraph } from "@/lib/kinship";
import { canOpenDocument } from "@/lib/lada-db";
import { loadHouses } from "@/lib/old-house";
import {
  PARTNER_TEXT_VERSION, partnerCsv, partnerExport, partnerHistory, partnerState, partnerUrl, readUnsubscribeToken, setPartnerConsent,
  signupPartnerFromCookie, unsubscribeToken,
} from "@/lib/partners";

const ORIGIN = "https://cartea-neamului.test";
const SECRET = "cheie-de-proba-pentru-teste-0123456789";
const at = (d: string) => new Date(`2026-11-${d}T10:00:00Z`);
const emails = async (db: Db) => (await partnerExport(db, ORIGIN, "propmanage", SECRET)).map((r) => r.email);

describe("acordul pentru beneficiile de la PropManage", () => {
  let db: Db;
  let treeId: string;

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    // Ana își face cont și bifează. Ion și-a făcut cont fără bifă. Mara e o rudă invitată de Ana în arbore, cu cont, fără bifă.
    await db.insert(user).values([
      { id: "ana", name: "Ana Pop", email: "ana@test.ro" }, { id: "ion", name: "Ion Pop", email: "ion@test.ro" },
      { id: "mara", name: "Mara Pop", email: "mara@test.ro" }, { id: "demo", name: "Demo", email: "demo@cartea-neamului.ro" },
    ]);
    [{ id: treeId }] = await db.insert(tree).values({ name: "Neamul Pop", ownerId: "ana" }).returning({ id: tree.id });
    await db.insert(treeMember).values([{ treeId, userId: "ana", role: "owner" }, { treeId, userId: "mara", role: "contributor", invitedBy: "ana" }]);
    await db.insert(invitation).values([
      { treeId, tokenHash: "h-mara", createdBy: "ana", acceptedBy: "mara", expiresAt: at("30") },
      { treeId, tokenHash: "h-neacceptata", createdBy: "ana", expiresAt: at("30") },
    ]);
    // Oameni din arbore, fără cont (bunica, satul ei), și fișa Marei.
    await db.insert(person).values([
      { treeId, givenName: "Floarea", surname: "Pop", living: true, birthPlace: "Sâncraiu" },
      { treeId, givenName: "Mara", surname: "Pop", living: true, claimedByUserId: "mara" },
    ]);
    await setPartnerConsent(db, "ana", true, { source: "cont-nou", locale: "ro", now: at("01") });
  });

  it("fără bifă nu apari în export", async () => {
    expect(await emails(db)).toEqual(["ana@test.ro"]);
    expect((await partnerState(db, "ion")).granted).toBe(false);
  });

  it("rudele invitate și oamenii din arbore nu apar niciodată, chiar dacă cel care i-a invitat a bifat", async () => {
    const all = await partnerExport(db, ORIGIN, "propmanage", SECRET);
    expect(all.map((r) => r.email)).not.toContain("mara@test.ro");
    // Doar emailul, data și legătura de dezabonare: nici numele, nici arborele, nici satul.
    expect(Object.keys(all[0]).sort()).toEqual(["email", "since", "unsubscribe"]);
    const csv = partnerCsv(all);
    for (const word of ["Ana", "Pop", "Floarea", "Sâncraiu", "Mara", "Neamul"]) expect(csv).not.toContain(word);
  });

  it("contul de probă nu-și poate da acordul și nu apare", async () => {
    expect((await setPartnerConsent(db, "demo", true, { source: "datele-mele" })).changed).toBe(false);
    await db.insert(partnerConsent).values({ userId: "demo", partner: "propmanage", granted: true, grantedAt: at("02"), textVersion: "x", source: "cont-nou" });
    expect(await emails(db)).not.toContain("demo@cartea-neamului.ro");
  });

  it("retragerea te scoate din export imediat, iar istoricul rămâne", async () => {
    await setPartnerConsent(db, "ion", true, { source: "datele-mele", locale: "de", now: at("03") });
    expect(await emails(db)).toEqual(["ana@test.ro", "ion@test.ro"]);
    await setPartnerConsent(db, "ion", false, { source: "datele-mele", now: at("04") });
    expect(await emails(db)).toEqual(["ana@test.ro"]);
    const h = await partnerHistory(db, "ion");
    expect(h.map((r) => [r.granted, r.source])).toEqual([[true, "datele-mele"], [false, "datele-mele"]]);
    expect(h[0].revokedAt?.toISOString()).toBe(at("04").toISOString()); // perioada acordului se vede pe rândul lui
    expect(h[0].locale).toBe("de");
    expect(h.every((r) => r.textVersion === PARTNER_TEXT_VERSION)).toBe(true);
    // Același răspuns de două ori nu scrie încă un rând.
    expect((await setPartnerConsent(db, "ion", false, { source: "datele-mele" })).changed).toBe(false);
    expect(await partnerHistory(db, "ion")).toHaveLength(2);
  });

  it("legătura de dezabonare e semnată și nu poate fi schimbată pe alt cont", () => {
    const tok = unsubscribeToken("ana", "propmanage", SECRET);
    expect(readUnsubscribeToken(tok, SECRET)).toEqual({ userId: "ana", partner: "propmanage" });
    expect(readUnsubscribeToken(tok, "alta-cheie-0123456789")).toBeNull();
    const [p, , sig] = tok.split(".");
    expect(readUnsubscribeToken(`${p}.${Buffer.from("ion").toString("base64url")}.${sig}`, SECRET)).toBeNull();
    expect(readUnsubscribeToken("propmanage.YW5h", SECRET)).toBeNull();
    expect(readUnsubscribeToken(undefined, SECRET)).toBeNull();
  });

  it("dezabonarea din email retrage acordul și scoate adresa din export", async () => {
    const [row] = (await partnerExport(db, ORIGIN, "propmanage", SECRET)).filter((r) => r.email === "ana@test.ro");
    const t = readUnsubscribeToken(new URL(row.unsubscribe).searchParams.get("t"), SECRET);
    expect(t?.userId).toBe("ana");
    await setPartnerConsent(db, t!.userId, false, { source: "dezabonare", partner: t!.partner, now: at("05") });
    expect(await emails(db)).toEqual([]);
    expect((await partnerState(db, "ana")).source).toBe("dezabonare");
  });

  it("cookie-ul bifei de la crearea contului și linkurile cu UTM", () => {
    expect(signupPartnerFromCookie("limba=ro; cn-parteneri=propmanage")).toBe("propmanage");
    expect(signupPartnerFromCookie("cn-parteneri=altcineva")).toBeNull();
    expect(signupPartnerFromCookie("limba=ro")).toBeNull();
    const u = new URL(partnerUrl("casa-batraneasca"));
    expect(u.hostname).toBe("propmanage.ro");
    expect(u.searchParams.get("utm_source")).toBe("cartea-neamului");
    expect([...u.searchParams.keys()].every((k) => k.startsWith("utm_"))).toBe(true);
  });

  it("acordul pleacă în „Descarcă datele mele” și se șterge odată cu contul", async () => {
    const mine = await exportMyData(db, "ion", ORIGIN);
    expect(mine?.acorduriParteneri.map((a) => a.dat)).toEqual([true, false]);
    await deleteAccount(db, "ion", { scrub: false });
    expect(await db.select().from(partnerConsent).where(eq(partnerConsent.userId, "ion"))).toHaveLength(0);
  });
});

describe("casa bătrânească", () => {
  let db: Db;
  let treeId: string;
  const P: Record<string, string> = {};

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "ana", name: "Ana", email: "ana@t.ro" }, { id: "dan", name: "Dan", email: "dan@t.ro" }, { id: "rudă", name: "Rudă", email: "r@t.ro" }]);
    [{ id: treeId }] = await db.insert(tree).values({ name: "Neamul", ownerId: "ana", chatMaxDegree: 1 }).returning({ id: tree.id });
    for (const [k, v] of [["bunic", {}], ["ana", { claimedByUserId: "ana" }], ["dan", { claimedByUserId: "dan" }], ["ruda", { claimedByUserId: "rudă" }]] as const) {
      [{ id: P[k] }] = await db.insert(person).values({ treeId, givenName: k, surname: "X", ...v }).returning({ id: person.id });
    }
    // Ana și Dan sunt copiii bunicului (gradul 1); ruda nu are nicio legătură de sânge cu el.
    await db.insert(relationship).values([
      { treeId, type: "parent_child", personA: P.bunic, personB: P.ana },
      { treeId, type: "parent_child", personA: P.bunic, personB: P.dan },
    ]);
  });

  it("se vede după regulile amintirilor, iar pozele ei le deschide doar cine o vede", async () => {
    const [d] = await db.insert(document).values({ treeId, kind: "photo", title: "casa", uploadedBy: "ana" }).returning({ id: document.id });
    await db.insert(oldHouse).values({ treeId, personId: P.bunic, authorId: "ana", place: "Sâncraiu", photoIds: [d.id], visibility: "close", maxDegree: 1 });
    const people = await db.select({ id: person.id, sex: person.sex }).from(person);
    const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship);
    const g = buildGraph(people, rels);
    const see = async (userId: string, personId: string) => (await loadHouses(db, treeId, P.bunic, { userId, personId }, g, 1, null)).length;
    expect(await see("dan", P.dan)).toBe(1); // copilul bunicului, gradul 1
    expect(await see("rudă", P.ruda)).toBe(0); // fără legătură de sânge
    expect(await canOpenDocument(db, d.id, treeId, "ana", "dan")).toBe(true);
    expect(await canOpenDocument(db, d.id, treeId, "ana", "rudă")).toBe(false);
    await db.update(oldHouse).set({ visibility: "private" });
    expect(await see("dan", P.dan)).toBe(0);
    expect(await see("ana", P.ana)).toBe(1); // autoarea o vede mereu
  });

  it("pleacă odată cu contul autorului, cu pozele puse doar la ea", async () => {
    await deleteAccount(db, "ana", { scrub: false });
    expect(await db.select().from(oldHouse)).toHaveLength(0);
    expect(await db.select().from(document)).toHaveLength(0);
  });
});

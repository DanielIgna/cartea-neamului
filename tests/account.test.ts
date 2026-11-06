import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import {
  consent, document, documentLink, invitation, memory, memoryQuestion, memoryReply, message, person, relationship, session, tree, treeMember, user,
} from "@/db/schema";
import { deleteAccount, deletionPlan, exportMyData, withdrawFaith } from "@/lib/account";
import { consentState, hasConsent, recordConsent } from "@/lib/consent";
import { dropMemories } from "@/lib/lada-db";

let db: Db;
const T = { a: "", b: "", c: "" };
const P: Record<string, string> = {};
const D: Record<string, string> = {};
const M: Record<string, string> = {};

const doc = async (key: string, treeId: string, kind: "photo" | "audio", by: string, album?: string) => {
  const [d] = await db.insert(document).values({ treeId, kind, title: key, fileKey: `arbori/${key}`, uploadedBy: by }).returning();
  if (album) await db.insert(documentLink).values({ documentId: d.id, personId: album });
  return d.id;
};

beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  for (const u of ["daniel", "maria", "ion"]) await db.insert(user).values({ id: u, name: u[0].toUpperCase() + u.slice(1), email: `${u}@test.ro` });
  await db.insert(session).values({ id: "s1", userId: "daniel", token: "tok-secret-daniel", expiresAt: new Date(Date.now() + 864e5), ipAddress: "10.0.0.1", userAgent: "Firefox" });

  // A: arborele lui Daniel, cu Maria (editor) și Ion (vizitator, invitat de Daniel). B: doar al lui. C: al Mariei, cu Daniel contributor.
  [{ id: T.a }] = await db.insert(tree).values({ name: "Neamul Igna", ownerId: "daniel" }).returning({ id: tree.id });
  [{ id: T.b }] = await db.insert(tree).values({ name: "Ciorna mea", ownerId: "daniel" }).returning({ id: tree.id });
  [{ id: T.c }] = await db.insert(tree).values({ name: "Neamul Mariei", ownerId: "maria" }).returning({ id: tree.id });
  const t0 = new Date("2026-01-01T10:00:00Z"), t1 = new Date("2026-02-01T10:00:00Z"), t2 = new Date("2026-03-01T10:00:00Z");
  await db.insert(treeMember).values([
    { treeId: T.a, userId: "daniel", role: "owner", joinedAt: t0 },
    { treeId: T.a, userId: "ion", role: "viewer", invitedBy: "daniel", joinedAt: t1 },
    { treeId: T.a, userId: "maria", role: "editor", invitedBy: "daniel", joinedAt: t2 },
    { treeId: T.b, userId: "daniel", role: "owner" },
    { treeId: T.c, userId: "maria", role: "owner" },
    { treeId: T.c, userId: "daniel", role: "contributor", invitedBy: "maria" },
  ]);
  await db.insert(invitation).values([
    { treeId: T.a, tokenHash: "h1", createdBy: "daniel", acceptedBy: "ion", expiresAt: t2 },
    { treeId: T.c, tokenHash: "h2", createdBy: "maria", acceptedBy: "daniel", expiresAt: t2 },
  ]);

  const add = async (key: string, treeId: string, v: Partial<typeof person.$inferInsert>) => {
    const [p] = await db.insert(person).values({ treeId, givenName: key, surname: "Igna", ...v }).returning({ id: person.id });
    P[key] = p.id;
  };
  await add("Daniel", T.a, { sex: "M", living: true, claimedByUserId: "daniel", birthDateText: "12.03.1970", birthPlace: "Huedin", residencePlace: "Cluj-Napoca", occupation: "Inginer", biography: "Fiul lui Avram." });
  await add("Avram", T.a, { sex: "M", birthDateText: "1938", deathDateText: "2010" });
  await add("Bunica", T.a, { sex: "F", living: true });
  await add("Maria", T.a, { sex: "F", living: true, claimedByUserId: "maria" });
  await add("Schita", T.b, { sex: "M" });
  await add("MariaC", T.c, { sex: "F", living: true, claimedByUserId: "maria" });
  await db.insert(relationship).values({ treeId: T.a, type: "parent_child", personA: P.Avram, personB: P.Daniel });

  D.album = await doc("album.jpg", T.a, "photo", "daniel", P.Daniel);
  D.glas = await doc("glas.webm", T.a, "audio", "daniel");
  D.credintaGlas = await doc("credinta.webm", T.a, "audio", "daniel");
  D.bunicaGlas = await doc("bunica.webm", T.a, "audio", "daniel");
  D.mariaGlas = await doc("maria-credinta.webm", T.a, "audio", "maria");
  D.schita = await doc("schita.jpg", T.b, "photo", "daniel", P.Schita);
  await db.update(person).set({ photoDocumentId: D.album }).where(eq(person.id, P.Daniel));

  const mem = async (key: string, v: Partial<typeof memory.$inferInsert> & { personId: string }) => {
    const [m] = await db.insert(memory).values({ treeId: T.a, body: key, ...v }).returning({ id: memory.id });
    M[key] = m.id;
  };
  await mem("copilaria", { personId: P.Daniel, authorId: "daniel", chapter: "copilaria", audioDocumentId: D.glas, photoDocumentId: D.album });
  await mem("credinta", { personId: P.Daniel, authorId: "daniel", chapter: "credinta", audioDocumentId: D.credintaGlas });
  await mem("de-la-maria", { personId: P.Daniel, authorId: "maria", helper: true, chapter: "munca" });
  await mem("bunica", { personId: P.Bunica, authorId: "daniel", helper: true, chapter: "obiceiuri", audioDocumentId: D.bunicaGlas });
  await mem("a-mariei", { personId: P.Maria, authorId: "maria", chapter: "dragostea" });
  await mem("credinta-maria", { personId: P.Maria, authorId: "maria", chapter: "credinta", audioDocumentId: D.mariaGlas });
  await db.insert(memoryReply).values({ memoryId: M["a-mariei"], authorId: "daniel", body: "Și eu îmi amintesc." });
  await db.insert(memoryQuestion).values([
    { treeId: T.a, personId: P.Maria, askedBy: "daniel", text: "Cum era la nuntă?" },
    { treeId: T.a, personId: P.Maria, askedBy: "daniel", text: "Cum v-ați cunoscut?", memoryId: M["a-mariei"] },
  ]);
  await db.insert(message).values([
    { treeId: T.a, fromUserId: "daniel", toUserId: "maria", body: "Bună, Maria!" },
    { treeId: T.a, fromUserId: "maria", toUserId: "daniel", body: "Bună, Daniel!" },
  ]);
  await recordConsent(db, "daniel", "terms", true, t0);
  await recordConsent(db, "daniel", "faith", true, t1);
  await recordConsent(db, "maria", "faith", true, t1);
});

describe("acordurile", () => {
  it("ține minte ultima alegere, cu versiunea textului", async () => {
    expect(await hasConsent(db, "ion", "faith")).toBe(false);
    await recordConsent(db, "ion", "faith", true, new Date("2026-05-01T10:00:00Z"));
    expect(await hasConsent(db, "ion", "faith")).toBe(true);
    await recordConsent(db, "ion", "faith", false, new Date("2026-05-02T10:00:00Z"));
    const s = await consentState(db, "ion", "faith");
    expect(s.granted).toBe(false);
    expect(s.at?.toISOString()).toBe("2026-05-02T10:00:00.000Z");
    const rows = await db.select().from(consent).where(eq(consent.userId, "ion"));
    expect(rows.every((r) => r.textVersion === "2026-11-06")).toBe(true);
  });
});

describe("ștergerea amintirilor", () => {
  it("pleacă glasul pus doar la amintire; poza din album și glasul folosit și în altă parte rămân", async () => {
    const [x] = await db.insert(memory).values({ treeId: T.a, personId: P.Bunica, authorId: "daniel", helper: true, body: "x", audioDocumentId: D.bunicaGlas, photoDocumentId: D.album })
      .returning({ id: memory.id });
    // Glasul bunicii e folosit și de amintirea „bunica”, poza e în album: niciun fișier nu pleacă.
    expect(await dropMemories(db, [x.id])).toEqual([]);
    expect((await db.select().from(document).where(eq(document.id, D.bunicaGlas))).length).toBe(1);
    expect((await db.select().from(document).where(eq(document.id, D.album))).length).toBe(1);
  });
});

describe("„Datele mele”: descărcarea", () => {
  it("cuprinde contul, fișa, amintirile, mesajele și acordurile, fără parole sau jetoane", async () => {
    const data = (await exportMyData(db, "daniel", "https://exemplu.ro"))!;
    expect(data.cont.email).toBe("daniel@test.ro");
    expect(data.fisaMea[0]).toMatchObject({ arbore: "Neamul Igna", prenume: "Daniel", nascut: "12.03.1970", locuieste: "Cluj-Napoca" });
    expect(data.arbori.map((t) => t.nume).sort()).toEqual(["Ciorna mea", "Neamul Igna", "Neamul Mariei"]);
    expect(data.arbori[0].gedcom).toMatch(/^https:\/\/exemplu\.ro\/api\/arbore\/.+\/gedcom\?living=1$/);
    const texts = data.amintiri.map((m) => m.text);
    expect(texts).toEqual(expect.arrayContaining(["copilaria", "credinta", "de-la-maria", "bunica"]));
    expect(texts).not.toContain("a-mariei");
    expect(data.amintiri.find((m) => m.text === "copilaria")).toMatchObject({ capitol: "Copilăria", glas: `https://exemplu.ro/api/document/${D.glas}` });
    expect(data.amintiri.find((m) => m.text === "de-la-maria")?.inregistrata).toContain("o rudă");
    expect(data.mesaje.map((m) => `${m.de}→${m.catre}`)).toEqual(["eu→Maria", "Maria→eu"]);
    expect(data.siEuImiAmintesc).toHaveLength(1);
    expect(data.intrebariPuse).toHaveLength(2);
    expect(data.acorduri.map((a) => a.pentru)).toEqual(["Termenii și Politica de confidențialitate", "Capitolul „Credința”"]);
    expect(data.sesiuni[0]).toMatchObject({ ip: "10.0.0.1", browser: "Firefox" });
    const raw = JSON.stringify(data);
    expect(raw).not.toContain("tok-secret-daniel");
    expect(raw).not.toMatch(/password|parola"/i);
  });
});

describe("retragerea acordului pentru „Credința”", () => {
  it("șterge răspunsurile din capitol, cu glasul lor, și scrie retragerea", async () => {
    const r = await withdrawFaith(db, "maria", new Date("2026-06-01T10:00:00Z"));
    expect(r.removed).toBe(1);
    expect(r.fileKeys).toEqual(["arbori/maria-credinta.webm"]);
    expect((await db.select().from(memory).where(eq(memory.id, M["credinta-maria"]))).length).toBe(0);
    expect((await db.select().from(memory).where(eq(memory.id, M["a-mariei"]))).length).toBe(1);
    expect(await hasConsent(db, "maria", "faith")).toBe(false);
  });
});

describe("ștergerea contului", () => {
  it("arată înainte ce se întâmplă cu fiecare arbore și câte lucruri pleacă", async () => {
    const plan = await deletionPlan(db, "daniel");
    const a = plan.owned.find((t) => t.name === "Neamul Igna")!, b = plan.owned.find((t) => t.name === "Ciorna mea")!;
    // Moștenitorul: cel cu dreptul cel mai mare (editoarea Maria), nu cel intrat primul (vizitatorul Ion).
    expect(a.heir).toEqual({ userId: "maria", name: "Maria", role: "editor" });
    expect(b).toMatchObject({ heir: null, people: 1 });
    expect(plan.member).toEqual([{ id: T.c, name: "Neamul Mariei", role: "contributor" }]);
    expect(plan.claimed.map((c) => c.name)).toEqual(["Daniel Igna"]);
    expect(plan).toMatchObject({ memories: 3, faith: 1, replies: 1, messages: 2 });
  });

  it("șterge ce e al lui, dă arborele familiei mai departe și golește fișa, fără să rupă arborele", async () => {
    const { fileKeys, deletedTrees } = await deleteAccount(db, "daniel", { scrub: true });
    expect(deletedTrees).toBe(1);
    expect(fileKeys.sort()).toEqual(["arbori/credinta.webm", "arbori/glas.webm", "arbori/schita.jpg"]);

    expect(await db.select().from(user).where(eq(user.id, "daniel"))).toEqual([]);
    expect(await db.select().from(session).where(eq(session.userId, "daniel"))).toEqual([]);
    expect(await db.select().from(tree).where(eq(tree.id, T.b))).toEqual([]);
    const [a] = await db.select().from(tree).where(eq(tree.id, T.a));
    expect(a.ownerId).toBe("maria");
    const [mariaRole] = await db.select({ role: treeMember.role }).from(treeMember).where(and(eq(treeMember.treeId, T.a), eq(treeMember.userId, "maria")));
    expect(mariaRole.role).toBe("owner");
    const [ion] = await db.select().from(treeMember).where(and(eq(treeMember.treeId, T.a), eq(treeMember.userId, "ion")));
    expect(ion.invitedBy).toBeNull();
    expect(await db.select().from(treeMember).where(eq(treeMember.treeId, T.c))).toHaveLength(1);

    // Fișa rămâne, cu numele și legăturile, dar fără datele lui și fără legătura cu contul.
    const [d] = await db.select().from(person).where(eq(person.id, P.Daniel));
    expect(d).toMatchObject({ givenName: "Daniel", claimedByUserId: null, birthDateText: null, birthPlace: null, residencePlace: null, occupation: null, biography: null, photoDocumentId: null });
    expect(await db.select().from(relationship).where(eq(relationship.personB, P.Daniel))).toHaveLength(1);

    // Lada lui e goală; povestea bunicii, înregistrată de el, rămâne a ei; amintirea Mariei rămâne, fără rândul lui.
    expect(await db.select().from(memory).where(eq(memory.personId, P.Daniel))).toEqual([]);
    const [bunica] = await db.select().from(memory).where(eq(memory.id, M.bunica));
    expect(bunica.authorId).toBeNull();
    expect(await db.select().from(memory).where(eq(memory.id, M["a-mariei"]))).toHaveLength(1);
    expect(await db.select().from(memoryReply).where(eq(memoryReply.memoryId, M["a-mariei"]))).toEqual([]);
    const questions = await db.select().from(memoryQuestion).where(eq(memoryQuestion.personId, P.Maria));
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ text: "Cum v-ați cunoscut?", askedBy: null });

    expect(await db.select().from(message)).toEqual([]);
    expect((await db.select().from(invitation)).map((i) => `${i.createdBy ?? "-"} → ${i.acceptedBy ?? "-"}`).sort()).toEqual(["- → ion", "maria → -"]);
    expect(await db.select().from(consent).where(eq(consent.userId, "daniel"))).toEqual([]);
    // Poza din album rămâne a familiei; glasul pus doar la amintirile lui a plecat.
    expect(await db.select().from(document).where(eq(document.id, D.album))).toHaveLength(1);
    expect(await db.select().from(document).where(eq(document.id, D.glas))).toEqual([]);
  });
});

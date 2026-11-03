import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { person, placeContact, tree, treeMember, treePlace, user } from "@/db/schema";
import { loadTreeMap } from "@/lib/map-data";
import { canMessage } from "@/lib/chat";
import { DEMO_EMAIL } from "@/lib/demo";
import { answerContact, askContact, DEMO_NO, myLinks, pendingContacts, placeMatches, refreshTreePlaces, setTreeDiscoverable, shortName } from "@/lib/shared-places";

let db: Db;
const T: Record<string, string> = {};
const ion = { id: "u-ion", email: "ion@test.ro" }, maria = { id: "u-maria", email: "maria@test.ro" }, demo = { id: "u-demo", email: DEMO_EMAIL };

type P = Partial<typeof person.$inferInsert>;
async function makeTree(key: string, name: string, owner: string, people: P[], members: string[] = []) {
  const [t] = await db.insert(tree).values({ name, ownerId: owner }).returning();
  T[key] = t.id;
  await db.insert(treeMember).values({ treeId: t.id, userId: owner, role: "owner" });
  for (const m of members) await db.insert(treeMember).values({ treeId: t.id, userId: m, role: "contributor" });
  for (const p of people) await db.insert(person).values({ treeId: t.id, givenName: "", surname: "", ...p });
}
const rows = (key: string) => db.select().from(treePlace).where(eq(treePlace.treeId, T[key]));

/**
 * Neamul Igna (Huedin și Domoșu) și neamul Pop (Sâncraiu, Horlacea, mort în Huedin): au un oraș în comun și o comună în comun.
 * Un al treilea neam din Huedin nu vrea să fie găsit, iar contul de probă nu poate fi găsit deloc.
 */
beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  for (const [id, name, email] of [["u-ion", "Ion Igna", ion.email], ["u-maria", "Maria Pop", maria.email], ["u-ana", "Ana Rus", "ana@test.ro"], ["u-dan", "Dan Igna", "dan@test.ro"], ["u-demo", "Andrei Pop (demo)", DEMO_EMAIL]]) {
    await db.insert(user).values({ id, name, email });
  }
  await makeTree("igna", "Neamul Igna din Huedin", "u-ion", [
    { givenName: "Gavril", surname: "Igna", birthDateText: "1890", birthPlace: "Huedin", deathDateText: "1960", deathPlace: "Huedin" },
    { givenName: "Maria", surname: "Igna", birthSurname: "Moldovan", birthDateText: "1900", birthPlace: "sat Domoșu, com. Sâncraiu, jud. Cluj", deathDateText: "1970", deathPlace: "Huedin" },
    { givenName: "Daniel", surname: "Igna", living: true, birthDateText: "1980", birthPlace: "Huedin", residencePlace: "Cluj-Napoca" },
    { givenName: "Iosefina", surname: "Igna", discreet: true, birthDateText: "1930", birthPlace: "Bicălatu", deathDateText: "1990" },
  ], ["u-dan"]);
  await makeTree("pop", "Neamul Pop din Sâncraiu", "u-maria", [
    { givenName: "Ion", surname: "Pop", birthDateText: "1880", birthPlace: "Sâncraiu, jud. Cluj", deathDateText: "1950", deathPlace: "Huedin" },
    { givenName: "Ana", surname: "Pop", birthSurname: "Igna", birthDateText: "1885", birthPlace: "Horlacea", deathDateText: "1955", deathPlace: "Horlacea" },
    { givenName: "Vasile", surname: "Pop", living: true, birthDateText: "1975", birthPlace: "Huedin" },
  ]);
  await makeTree("rus", "Neamul Rus", "u-ana", [{ givenName: "Petru", surname: "Rus", birthDateText: "1900", birthPlace: "Huedin", deathDateText: "1980" }]);
  await makeTree("demo", "Neamul Pop din Ieud", "u-demo", [{ givenName: "Toader", surname: "Pop", birthDateText: "1890", birthPlace: "Huedin", deathDateText: "1950" }]);
});

describe("din aceleași locuri", () => {
  it("arată altor neamuri doar satele celor decedați, fără cei în viață și fără cei discreți", async () => {
    const { shared } = await loadTreeMap(db, T.igna);
    const by = Object.fromEntries(shared.map((s) => [s.name, s]));
    expect(Object.keys(by).sort()).toEqual(["Domoșu", "Huedin"]);
    expect(by.Huedin).toMatchObject({ placeId: "RO:55455", people: 2, fromYear: 1890, toYear: 1970, area: "CJ:huedin" });
    expect(by.Huedin.surnames.split(", ").sort()).toEqual(["Igna", "Moldovan"]);
    expect(by.Domoșu).toMatchObject({ people: 1, area: "CJ:sancraiu" });
    expect(shortName("Maria Pop")).toBe("Maria P.");
    expect(shortName("Andrei Pop (demo)")).toBe("Andrei P.");
  });

  it("nimic nu se vede până nu aleg amândouă neamurile să poată fi găsite", async () => {
    expect(await rows("igna")).toHaveLength(0);
    await setTreeDiscoverable(db, T.igna, true);
    expect((await rows("igna")).length).toBe(2);
    expect(await placeMatches(db, T.igna, ion.id)).toEqual([]);
    await setTreeDiscoverable(db, T.pop, true);
    await setTreeDiscoverable(db, T.demo, true); // contul de probă nu apare nici dacă cineva l-ar porni din bază
    expect(await placeMatches(db, T.rus, "u-ana")).toEqual([]); // cine nu își arată neamul nu vede nimic
  });

  it("găsește neamul Pop: același oraș (Huedin) și aceeași comună (Sâncraiu)", async () => {
    const m = await placeMatches(db, T.igna, ion.id);
    expect(m.map((x) => x.treeName)).toEqual(["Neamul Pop din Sâncraiu"]);
    expect(m[0].owner).toBe("Maria P.");
    const places = Object.fromEntries(m[0].places.map((p) => [p.name, p]));
    expect(places.Huedin).toMatchObject({ same: true, people: 1, years: "1880–1950", surnames: "Pop" });
    expect(places.Sâncraiu).toMatchObject({ same: false, mine: ["Domoșu"] });
    expect(places.Horlacea).toMatchObject({ same: false, mine: ["Domoșu"], surnames: "Pop, Igna" });
    expect(m[0].places[0].name).toBe("Huedin"); // același loc întâi
    expect(m[0].contact).toBeNull();
    // Și un alt membru al neamului Igna vede la fel; Maria vede neamul Igna.
    expect((await placeMatches(db, T.igna, "u-dan")).map((x) => x.treeId)).toEqual([T.pop]);
    expect((await placeMatches(db, T.pop, maria.id)).map((x) => x.treeName)).toEqual(["Neamul Igna din Huedin"]);
  });

  it("cere legătura o singură dată; proprietarul acceptă, apoi își pot scrie", async () => {
    const huedin = "RO:55455";
    expect(await askContact(db, demo, { fromTreeId: T.demo, toTreeId: T.pop, placeId: huedin, note: null })).toEqual({ error: DEMO_NO });
    expect((await askContact(db, ion, { fromTreeId: T.igna, toTreeId: T.rus, placeId: huedin, note: null })).error).toBeTruthy();
    expect((await askContact(db, ion, { fromTreeId: T.pop, toTreeId: T.igna, placeId: huedin, note: null })).error).toBe("Nu ești în acest arbore.");
    expect((await askContact(db, ion, { fromTreeId: T.igna, toTreeId: T.pop, placeId: "RO:1", note: null })).error).toBe("Neamurile voastre nu mai au acest loc în comun.");
    expect(await askContact(db, ion, { fromTreeId: T.igna, toTreeId: T.pop, placeId: huedin, note: "Bunicul meu e din Huedin." })).toEqual({ ok: true });
    expect((await askContact(db, ion, { fromTreeId: T.igna, toTreeId: T.pop, placeId: huedin, note: null })).error).toBe("Ai trimis deja cererea. Așteaptă răspunsul.");

    expect((await placeMatches(db, T.igna, ion.id))[0].contact).toEqual({ status: "pending", outgoing: true, href: null });
    expect((await placeMatches(db, T.pop, maria.id))[0].contact).toMatchObject({ status: "pending", outgoing: false, href: "/mesaje" });
    expect(await pendingContacts(db, maria.id)).toBe(1);
    const [out] = await myLinks(db, ion.id);
    expect(out).toMatchObject({ incoming: false, status: "pending", name: "Maria P.", treeName: "Neamul Pop din Sâncraiu", place: "Huedin" });
    const [inc] = await myLinks(db, maria.id);
    expect(inc).toMatchObject({ incoming: true, name: "Ion Igna", treeName: "Neamul Igna din Huedin", note: "Bunicul meu e din Huedin." });

    const before = await canMessage(db, T.pop, ion.id, maria.id);
    expect(before.ok).toBe(false);
    expect(await answerContact(db, ion.id, inc.id, true)).toEqual({ error: "Cererea nu mai există." }); // doar proprietarul răspunde
    expect(await answerContact(db, maria.id, inc.id, true)).toEqual({ ok: true });
    expect(await pendingContacts(db, maria.id)).toBe(0);

    const a = await canMessage(db, T.pop, ion.id, maria.id), b = await canMessage(db, T.pop, maria.id, ion.id);
    expect(a.ok && a.contact.via).toEqual({ place: "Huedin", treeName: "Neamul Pop din Sâncraiu" });
    expect(b.ok && b.contact.via).toEqual({ place: "Huedin", treeName: "Neamul Igna din Huedin" });
    expect((await canMessage(db, T.igna, ion.id, maria.id)).ok).toBe(false); // conversația stă în arborele Mariei
    expect((await placeMatches(db, T.igna, ion.id))[0].contact).toEqual({ status: "accepted", outgoing: true, href: `/mesaje/${T.pop}/${maria.id}` });
    expect((await myLinks(db, ion.id))[0].name).toBe("Maria Pop");

    expect(await answerContact(db, maria.id, inc.id, false)).toEqual({ ok: true }); // „Încheie legătura”
    const ended = await canMessage(db, T.pop, ion.id, maria.id);
    expect(!ended.ok && ended.reason).toBe("Legătura dintre neamurile voastre s-a încheiat.");
    expect((await askContact(db, ion, { fromTreeId: T.igna, toTreeId: T.pop, placeId: huedin, note: null })).error).toBe("Proprietarul acestui neam nu a acceptat legătura.");
    expect(await db.select().from(placeContact)).toHaveLength(1);
  });

  it("satele se recalculează după schimbări, iar oprit, neamul dispare din liste", async () => {
    await db.insert(person).values({ treeId: T.igna, givenName: "Toma", surname: "Igna", birthDateText: "1850", birthPlace: "Horlacea", deathDateText: "1920" });
    expect(await refreshTreePlaces(db, T.igna)).toBe(true);
    expect(await refreshTreePlaces(db, T.igna)).toBe(false); // nimic nou, nimic rescris
    const horlacea = (await placeMatches(db, T.igna, ion.id))[0].places.find((p) => p.name === "Horlacea");
    expect(horlacea).toMatchObject({ same: true });
    await setTreeDiscoverable(db, T.pop, false);
    expect(await rows("pop")).toHaveLength(0);
    expect(await placeMatches(db, T.igna, ion.id)).toEqual([]);
    expect(await refreshTreePlaces(db, T.pop)).toBe(false); // oprit: nu păstrează nimic
    expect(await rows("pop")).toHaveLength(0);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship, document, documentLink } from "@/db/schema";
import { mergeInto, mergedFields } from "@/lib/merge";
import { buildGraph } from "@/lib/kinship";
import { likelyDuplicates } from "@/lib/family";

/** Bunica Onița trecută de două ori lângă Gavril: o dată ca mama a 8 copii, încă o dată ca mama altor 3. */
let db: Db, treeId: string;
const ids: Record<string, string> = {};

beforeAll(async () => {
  process.env.PGLITE_DIR = "memory";
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Dubluri" }).returning();
  treeId = t.id;
  const add = async (key: string, v: Partial<typeof person.$inferInsert>) => { ids[key] = (await db.insert(person).values({ treeId, givenName: key, ...v }).returning())[0].id; };
  await add("gavril", { givenName: "Gavril", surname: "Igna", sex: "M", birthDateText: "1905" });
  await add("onita1", { givenName: "Onița", surname: "Igna", sex: "F" });
  await add("onita2", { givenName: "Oniţa", surname: "", sex: "F", birthDateText: "1910", birthPlace: "Huedin", notes: "Trecută din fișa lui Toma." });
  for (let i = 1; i <= 11; i++) await add(`c${i}`, { givenName: `Copil${i}`, surname: "Igna", sex: "M", birthDateText: String(1930 + i) });
  const rel = (type: "parent_child" | "partnership", a: string, b: string, startText?: string) => db.insert(relationship).values({ treeId, type, personA: ids[a], personB: ids[b], startText });
  await rel("partnership", "gavril", "onita1");
  await rel("partnership", "onita2", "gavril", "1929");
  for (let i = 1; i <= 11; i++) { await rel("parent_child", "gavril", `c${i}`); await rel("parent_child", i <= 8 ? "onita1" : "onita2", `c${i}`); }
  const [doc] = await db.insert(document).values({ treeId, kind: "photo", title: "Onița la nuntă" }).returning();
  await db.insert(documentLink).values({ documentId: doc.id, personId: ids.onita2 });
  await db.update(tree).set({ rootPersonId: ids.onita2 }).where(eq(tree.id, treeId));
});

async function graph() {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  return { people, g: buildGraph(people, rels) };
}

describe("o persoană trecută de două ori", () => {
  it("e găsită: aceeași Onița (cu sau fără diacritice), legată de același Gavril; se păstrează fișa cu mai mulți copii", async () => {
    const { people, g } = await graph();
    const view = Object.fromEntries(people.map((p) => [p.id, { ...p, birthYear: p.birthDateText ? Number(p.birthDateText) : null }]));
    expect(likelyDuplicates(g, view)).toEqual([{ keep: ids.onita1, drop: ids.onita2, via: ids.gavril }]);
  });

  it("se unește într-o singură fișă, cu toți cei 11 copii, o singură căsătorie și datele din amândouă", async () => {
    await mergeInto(db, treeId, ids.onita1, ids.onita2);
    const { people, g } = await graph();
    expect(people.find((p) => p.id === ids.onita2)).toBeUndefined();
    const onita = people.find((p) => p.id === ids.onita1)!;
    expect(onita).toMatchObject({ birthDateText: "1910", birthPlace: "Huedin", notes: "Trecută din fișa lui Toma.", surname: "Igna" });
    expect(g.children.get(ids.onita1)?.length).toBe(11);
    expect(g.partners.get(ids.gavril)).toEqual([ids.onita1]);
    const marriage = await db.select().from(relationship).where(and(eq(relationship.type, "partnership"), eq(relationship.treeId, treeId)));
    expect(marriage).toHaveLength(1);
    expect(marriage[0].startText).toBe("1929");
    expect((await db.select().from(documentLink).where(eq(documentLink.personId, ids.onita1)))).toHaveLength(1);
    expect((await db.select({ root: tree.rootPersonId }).from(tree).where(eq(tree.id, treeId)))[0].root).toBe(ids.onita1);
    const view = Object.fromEntries(people.map((p) => [p.id, { ...p, birthYear: null }]));
    expect(likelyDuplicates(g, view)).toEqual([]);
  });
});

describe("nu sunt dubluri", () => {
  it("bunicul și nepotul cu același nume, părinții fără nume puși automat, un bărbat și o femeie", () => {
    const g = buildGraph([{ id: "ion1", sex: "M" }, { id: "ana", sex: "F" }, { id: "petru", sex: "M" }, { id: "ion2", sex: "M" }, { id: "t1", sex: "M" }, { id: "t2", sex: "M" }, { id: "x", sex: "F" }],
      [{ type: "partnership", a: "ion1", b: "ana" }, { type: "parent_child", a: "ion1", b: "petru" }, { type: "parent_child", a: "ana", b: "petru" }, { type: "parent_child", a: "petru", b: "ion2" },
       { type: "partnership", a: "t1", b: "x" }, { type: "partnership", a: "t2", b: "x" }]);
    const p = (id: string, givenName: string, sex: "M" | "F") => ({ id, givenName, surname: "Igna", birthSurname: null, sex, birthYear: null });
    expect(likelyDuplicates(g, { ion1: p("ion1", "Ion", "M"), ion2: p("ion2", "Ion", "M"), ana: p("ana", "Ana", "F"), petru: p("petru", "Petru", "M"),
      t1: p("t1", "Tată necunoscut", "M"), t2: p("t2", "Tată necunoscut", "M"), x: p("x", "Ion", "F") })).toEqual([]);
  });
});

/**
 * Mama trecută de două ori: o dată soția lui Avram (Floarea Igna, născută Todea, fără părinți), încă o dată fiica lui Ion Todea
 * (Floarea Todea, trecută cu frații ei, fără soț și copii). Spița Todea nu ajungea la ea până nu se unesc fișele.
 */
describe("aceeași femeie, o dată soție și o dată fiică", () => {
  const p = (id: string, givenName: string, surname: string, sex: "M" | "F", birthSurname: string | null = null, birthYear: number | null = null) =>
    ({ id, givenName, surname, birthSurname, sex, birthYear });
  const base = {
    avram: p("avram", "Avram", "Igna", "M"), daniel: p("daniel", "Ioan Daniel", "Igna", "M"), tn: p("tn", "Tată necunoscut", "Todea", "M"),
    ion: p("ion", "Ion", "Todea", "M"), maria: p("maria", "Maria", "Todea", "F"), ana: p("ana", "Ana", "Todea", "F"),
  };
  const rels = [
    { type: "partnership" as const, a: "avram", b: "f1" }, { type: "parent_child" as const, a: "avram", b: "daniel" }, { type: "parent_child" as const, a: "f1", b: "daniel" },
    { type: "parent_child" as const, a: "ion", b: "f2" }, { type: "parent_child" as const, a: "maria", b: "f2" },
    { type: "parent_child" as const, a: "ion", b: "ana" }, { type: "parent_child" as const, a: "maria", b: "ana" },
  ];
  const ids = ["avram", "daniel", "tn", "ion", "maria", "ana", "f1", "f2"];
  const graphOf = (extra: { type: "parent_child" | "partnership"; a: string; b: string }[] = []) =>
    buildGraph(ids.map((id) => ({ id, sex: id === "f1" || id === "f2" || id === "maria" || id === "ana" ? "F" as const : "M" as const })), [...rels, ...extra]);

  it("o găsește după numele de fată, chiar dacă soția are un „Tată necunoscut” pus când i s-au adăugat frații", () => {
    const people = { ...base, f1: p("f1", "Floarea", "Igna", "F", "Todea"), f2: p("f2", "Floarea", "Todea", "F") };
    expect(likelyDuplicates(graphOf(), people)).toEqual([{ keep: "f1", drop: "f2", born: "ion" }]);
    expect(likelyDuplicates(graphOf([{ type: "parent_child", a: "tn", b: "f1" }]), people)).toEqual([{ keep: "f1", drop: "f2", born: "ion" }]);
  });
  it("sau după același nume și același an al nașterii (de pildă un bărbat trecut o dată ca soț, o dată ca fiu)", () => {
    const people = { ...base, f1: p("f1", "Floarea", "Todea", "F", null, 1940), f2: p("f2", "Floarea", "Todea", "F", null, 1941) };
    expect(likelyDuplicates(graphOf(), people)).toEqual([{ keep: "f1", drop: "f2", born: "ion" }]);
    const far = { ...base, f1: p("f1", "Floarea", "Todea", "F", null, 1940), f2: p("f2", "Floarea", "Todea", "F", null, 1943) };
    expect(likelyDuplicates(graphOf(), far)).toEqual([]);
  });
  it("nu le leagă fără nume de fată și fără ani, nici când fiica are și ea soț", () => {
    expect(likelyDuplicates(graphOf(), { ...base, f1: p("f1", "Floarea", "Igna", "F"), f2: p("f2", "Floarea", "Todea", "F") })).toEqual([]);
    const people = { ...base, f1: p("f1", "Floarea", "Igna", "F", "Todea"), f2: p("f2", "Floarea", "Todea", "F") };
    expect(likelyDuplicates(graphOf([{ type: "partnership", a: "f2", b: "tn" }]), people)).toEqual([]);
  });
});

describe("„Tată necunoscut” unit cu tatăl adevărat", () => {
  it("rămâne numele omului, fără nota pusă automat, oricare fișă se păstrează", () => {
    const row = (v: Partial<typeof person.$inferSelect>) => ({ givenName: "", surname: "", birthSurname: null, notes: null, discreet: false, ...v }) as typeof person.$inferSelect;
    const ph = row({ givenName: "Tată necunoscut", surname: "Igna", notes: "Adăugat automat ca să-i lege pe frații lui Floarea. Completează numele când îl afli." });
    const ion = row({ givenName: "Ion", surname: "Todea", notes: "Pădurar." });
    expect(mergedFields(ion, ph)).toMatchObject({ givenName: "Ion", surname: "Todea", notes: "Pădurar." });
    expect(mergedFields(ph, ion)).toMatchObject({ givenName: "Ion", surname: "Todea", notes: "Pădurar." });
  });

  it("îi trec toți copiii și căsătoria, iar locul gol dispare", async () => {
    const [t] = await db.insert(tree).values({ name: "Loc gol" }).returning();
    const add = async (givenName: string, sex: "M" | "F", surname = "Todea", notes?: string) =>
      (await db.insert(person).values({ treeId: t.id, givenName, surname, sex, notes }).returning())[0].id;
    const tn = await add("Tată necunoscut", "M", "Todea", "Adăugat automat ca să-i lege pe frații lui Floarea."), ion = await add("Ion", "M");
    const maria = await add("Maria", "F"), floarea = await add("Floarea", "F", "Igna"), vasile = await add("Vasile", "M"), ana = await add("Ana", "F");
    const rel = (type: "parent_child" | "partnership", a: string, b: string) => db.insert(relationship).values({ treeId: t.id, type, personA: a, personB: b });
    for (const c of [floarea, vasile]) { await rel("parent_child", tn, c); await rel("parent_child", maria, c); }
    await rel("parent_child", ion, ana); await rel("parent_child", maria, ana);
    await rel("partnership", tn, maria); await rel("partnership", ion, maria);
    const r = await mergeInto(db, t.id, ion, tn);
    expect(r.name).toBe("Ion Todea");
    const people = await db.select().from(person).where(eq(person.treeId, t.id));
    expect(people.find((x) => x.id === tn)).toBeUndefined();
    expect(people.find((x) => x.id === ion)).toMatchObject({ givenName: "Ion", surname: "Todea", notes: null });
    const rs = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, t.id));
    const g = buildGraph(people, rs);
    expect([...(g.children.get(ion) ?? [])].sort()).toEqual([ana, floarea, vasile].sort());
    expect(g.partners.get(maria)).toEqual([ion]);
  });
});

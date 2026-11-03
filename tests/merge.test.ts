import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship, document, documentLink } from "@/db/schema";
import { mergeInto } from "@/lib/merge";
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

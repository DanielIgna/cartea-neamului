import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { person, raisedBy, relationship, tree } from "@/db/schema";
import { buildGraph } from "@/lib/kinship";
import { carerCandidates, raisedIn, raisedLinks, setRaised } from "@/lib/raised";
import { mergeInto } from "@/lib/merge";

/**
 * Familia lui Avram: Mariana (cu Iosefina) și Lenuța (cu Valeria), amândouă mamele discrete; apoi Floarea, soția lui de până la final,
 * mama lui Ioan Daniel și a lui Nicolae Radu, care le-a crescut și pe fete.
 */
let db: Db, treeId: string;
const P: Record<string, string> = {};

beforeAll(async () => {
  process.env.PGLITE_DIR = "memory";
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Neamul Igna" }).returning();
  treeId = t.id;
  const add = async (k: string, v: Partial<typeof person.$inferInsert>) => { P[k] = (await db.insert(person).values({ treeId, givenName: k, surname: "Igna", ...v }).returning())[0].id; };
  await add("gavril", { givenName: "Gavril", sex: "M" });
  await add("onita", { givenName: "Onița", sex: "F" });
  await add("avram", { givenName: "Avram", sex: "M" });
  await add("toma", { givenName: "Toma", sex: "M" });
  await add("iosefina", { givenName: "Iosefina", surname: "", sex: "F", discreet: true });
  await add("valeria", { givenName: "Valeria", surname: "", sex: "F", discreet: true });
  await add("floarea", { givenName: "Floarea", sex: "F" });
  await add("mariana", { givenName: "Mariana", surname: "Moldovan", sex: "F" });
  await add("lenuta", { givenName: "Lenuța", surname: "Negrea", sex: "F" });
  await add("daniel", { givenName: "Ioan Daniel", sex: "M" });
  await add("nepot", { givenName: "Andrei", surname: "Moldovan", sex: "M" });
  const rel = (type: "parent_child" | "partnership", a: string, b: string) => db.insert(relationship).values({ treeId, type, personA: P[a], personB: P[b] });
  for (const c of ["avram", "toma"]) { await rel("parent_child", "gavril", c); await rel("parent_child", "onita", c); }
  await rel("partnership", "gavril", "onita");
  for (const w of ["iosefina", "valeria", "floarea"]) await rel("partnership", "avram", w);
  for (const [c, m] of [["mariana", "iosefina"], ["lenuta", "valeria"], ["daniel", "floarea"]]) { await rel("parent_child", "avram", c); await rel("parent_child", m, c); }
  await rel("parent_child", "mariana", "nepot");
});

async function graph() {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  return { g: buildGraph(people, rels), discreet: new Set(people.filter((p) => p.discreet).map((p) => p.id)) };
}

describe("cine a crescut-o", () => {
  it("propune întâi mama vitregă (nu și celelalte foste soții, discrete), apoi bunicii și unchii", async () => {
    const { g, discreet } = await graph();
    const c = carerCandidates(g, P.mariana, (id) => !discreet.has(id));
    expect(c.step).toEqual([P.floarea]);
    expect(c.grand.sort()).toEqual([P.gavril, P.onita].sort());
    expect(c.aunts).toEqual([P.toma]);
  });

  it("nu leagă pe cineva de el însuși, de propriul părinte sau de urmașul lui", async () => {
    expect((await setRaised(db, treeId, P.mariana, P.mariana, true, null)).error).toBeTruthy();
    expect((await setRaised(db, treeId, P.mariana, P.avram, true, null)).error).toMatch(/deja părinte/);
    expect((await setRaised(db, treeId, P.mariana, P.nepot, true, null)).error).toMatch(/urmașul/);
    expect(await raisedIn(db, treeId)).toEqual([]);
  });

  it("Floarea le-a crescut pe Mariana și pe Lenuța: apare la amândouă, iar la ea, fetele", async () => {
    expect(await setRaised(db, treeId, P.mariana, P.floarea, true, null)).toEqual({ ok: true });
    expect(await setRaised(db, treeId, P.lenuta, P.floarea, true, null)).toEqual({ ok: true });
    expect(await setRaised(db, treeId, P.lenuta, P.floarea, true, null)).toEqual({ ok: true }); // a doua oară nu se dublează
    const raised = await raisedIn(db, treeId);
    expect(raised).toHaveLength(2);
    const { g } = await graph();
    expect(raisedLinks(g, raised, P.mariana)).toEqual({ carers: [P.floarea], raised: [] });
    expect(raisedLinks(g, raised, P.floarea)).toEqual({ carers: [], raised: [P.mariana, P.lenuta] });
    // Valeria rămâne doar mama Lenuței; legătura nu schimbă părinții.
    expect(g.parents.get(P.lenuta)?.sort()).toEqual([P.avram, P.valeria].sort());
  });

  it("se poate scoate, iar la unirea a două fișe legătura trece la cea păstrată", async () => {
    expect(await setRaised(db, treeId, P.lenuta, P.floarea, false, null)).toEqual({ ok: true });
    expect((await raisedIn(db, treeId)).map((r) => r.child)).toEqual([P.mariana]);
    // Floarea trecută a doua oară: legătura de pe dublă se mută pe fișa păstrată.
    const [dup] = await db.insert(person).values({ treeId, givenName: "Floarea", surname: "Igna", sex: "F" }).returning();
    await setRaised(db, treeId, P.lenuta, dup.id, true, null);
    await mergeInto(db, treeId, P.floarea, dup.id);
    const after = await db.select().from(raisedBy).where(eq(raisedBy.treeId, treeId));
    expect(after.map((r) => [r.childId, r.carerId]).sort()).toEqual([[P.lenuta, P.floarea], [P.mariana, P.floarea]].sort());
  });
});

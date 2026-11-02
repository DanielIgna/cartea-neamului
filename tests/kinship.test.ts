import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship } from "@/db/schema";
import { importGedcom } from "@/lib/gedcom-db";
import { writeGedcom } from "@/lib/gedcom";
import { demoGedcom, DEMO, DEMO_EXTRAS } from "@/lib/demo-data";
import { syncDemo } from "@/lib/demo-sync";
import { buildGraph, family, kinship, bloodLabel, romanDegree, relativesByDegree, oldestAncestor, ancestorsOf, type Graph } from "@/lib/kinship";

let db: Db, treeId: string, g: Graph, id: (x: string) => string;

beforeAll(async () => {
  process.env.PGLITE_DIR = "memory";
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Test rudenie" }).returning();
  treeId = t.id;
  // Ca pe Neon: arborele vechi, importat doar cu primele 4 generații, apoi completat de syncDemo.
  const old = demoGedcom();
  old.individuals = old.individuals.filter((i) => +i.xref.slice(2, -1) < 32);
  old.families = old.families.filter((f) => +f.xref.slice(2, -1) < 16);
  await importGedcom(db, treeId, writeGedcom(old));
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  const byXref = new Map(people.map((p) => [p.gedcomXref!, p.id]));
  id = (x) => byXref.get(x)!;
});

describe("completarea arborelui de exemplu", () => {
  it("adaugă strămoșii până la cca. 1690 și rudele colaterale, o singură dată", async () => {
    const added = await syncDemo(db, treeId);
    expect(added).toBe(Object.keys(DEMO).filter((n) => +n >= 32).length + DEMO_EXTRAS.length);
    expect(await syncDemo(db, treeId)).toBe(0);
    const people = await db.select().from(person).where(eq(person.treeId, treeId));
    const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
    const byXref = new Map(people.map((p) => [p.gedcomXref!, p.id]));
    id = (x) => byXref.get(x)!;
    g = buildGraph(people, rels);
    expect(people.find((p) => p.gedcomXref === "@I1024@")?.birthDateText).toBe("ABT 1690");
  });
});

describe("rude și grad de rudenie", () => {
  it("găsește părinți, soți, copii și frați", () => {
    const f = family(g, id("@I1@"));
    expect(f.parents.sort()).toEqual([id("@I2@"), id("@I3@")].sort());
    expect(f.partners).toEqual([id("@X1@")]);
    expect(f.children.sort()).toEqual([id("@X2@"), id("@X3@")].sort());
    expect(f.siblings.sort()).toEqual(["@X4@", "@X13@", "@X14@", "@X15@"].map(id).sort());
    expect(family(g, id("@I8@")).children).toHaveLength(13);
  });

  it("numește legătura și gradul față de persoana din centru", () => {
    const k = (x: string) => kinship(g, id("@I1@"), id(x));
    expect(k("@I2@")).toMatchObject({ label: "tată", degree: 1 });
    expect(k("@I5@")).toMatchObject({ label: "bunică", degree: 2 });
    expect(k("@I8@")).toMatchObject({ label: "străbunic", degree: 3 });
    expect(k("@I1024@")).toMatchObject({ label: "strămoș (generația 10)", degree: 10 });
    expect(k("@X4@")).toMatchObject({ label: "soră", degree: 2 });
    expect(k("@X6@")).toMatchObject({ label: "nepot de frate", degree: 3 });
    expect(k("@X7@")).toMatchObject({ label: "unchi", degree: 3 });
    expect(k("@X9@")).toMatchObject({ label: "văr primar", degree: 4 });
    expect(k("@X2@")).toMatchObject({ label: "fiu", degree: 1 });
    expect(k("@X1@")).toMatchObject({ label: "soție", degree: null });
    expect(k("@X5@")?.degree).toBeNull();
  });

  it("scrie gradul cu cifre romane și numește verii mai îndepărtați", () => {
    expect(romanDegree(4)).toBe("IV");
    expect(romanDegree(9)).toBe("IX");
    expect(bloodLabel(3, 3, "F")).toBe("vară de-al doilea");
    expect(bloodLabel(3, 1, "M")).toBe("frate al bunicului/bunicii");
  });

  it("dincolo de gradul VII arată ascendentul comun, ca afilierea „din neamul lui …”", () => {
    const far = kinship(g, id("@I1@"), id("@X32@"))!;
    expect(far.degree).toBe(10);
    expect(far.ancestor).toBe(id("@I32@"));
    const dragomiresti = kinship(g, id("@I1@"), id("@X36@"))!;
    expect(dragomiresti.ancestor).toBe(id("@I512@"));
    const { byDegree } = relativesByDegree(g, id("@I1@"));
    expect(byDegree.get(1)!.map((x) => x.id).sort()).toEqual(["@I2@", "@I3@", "@X2@", "@X3@"].map(id).sort());
  });

  it("găsește cel mai vechi strămoș pentru trunchiul copacului", () => {
    expect(oldestAncestor(g, id("@I1@"))).toBe(id("@I1024@"));
    expect(ancestorsOf(g, id("@I1@"))[0][1]).toBe(10);
  });
});

describe("rude prin alianță fără legătură de sânge", () => {
  it("nu ciclează la socrii unei persoane fără legătură de sânge cu centrul", () => {
    const g = buildGraph([{ id: "eu", sex: "M" }, { id: "tata", sex: "M" }, { id: "x", sex: "M" }, { id: "y", sex: "F" }],
      [{ type: "parent_child", a: "tata", b: "eu" }, { type: "partnership", a: "x", b: "y" }]);
    expect(kinship(g, "eu", "x")).toBeNull();
  });
});

describe("frați din altă căsătorie", () => {
  it("îi numește frați după tată, tot de gradul II", () => {
    const g = buildGraph([{ id: "avram", sex: "M" }, { id: "floarea", sex: "F" }, { id: "a2", sex: "F" }, { id: "ioan", sex: "M" }, { id: "lenuta", sex: "F" }],
      [{ type: "parent_child", a: "avram", b: "ioan" }, { type: "parent_child", a: "floarea", b: "ioan" },
       { type: "parent_child", a: "avram", b: "lenuta" }, { type: "parent_child", a: "a2", b: "lenuta" }]);
    expect(kinship(g, "ioan", "lenuta")).toMatchObject({ label: "soră după tată", degree: 2 });
  });
});

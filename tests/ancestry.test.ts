import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person } from "@/db/schema";
import { writeGedcom } from "@/lib/gedcom";
import { demoGedcom, DEMO } from "@/lib/demo-data";
import { importGedcom, exportGedcom } from "@/lib/gedcom-db";
import { fetchAncestorRows, toAhnentafel } from "@/lib/ancestry";
import { parseGedcom } from "@/lib/gedcom";

let db: Db, treeId: string, byXref: Map<string, string>;

beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Test" }).returning();
  treeId = t.id;
  await importGedcom(db, treeId, writeGedcom(demoGedcom()));
  const people = await db.select().from(person);
  byXref = new Map(people.map((p) => [p.gedcomXref!, p.id]));
});

describe("ascendenți pe generații", () => {
  it("găsește toți ascendenții din exemplu pe 10 generații (până la cca. 1690), cu numerotare Ahnentafel corectă", async () => {
    const rows = await fetchAncestorRows(db, byXref.get("@I1@")!, 10);
    const ahnen = toAhnentafel(rows);
    expect(ahnen.size).toBe(Object.keys(DEMO).length);
    for (const n of Object.keys(DEMO).map(Number)) expect(ahnen.get(n)).toBe(byXref.get(`@I${n}@`));
  });

  it("se oprește la numărul cerut de generații", async () => {
    const ahnen = toAhnentafel(await fetchAncestorRows(db, byXref.get("@I1@")!, 2));
    expect([...ahnen.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("export GEDCOM", () => {
  it("ascunde persoanele în viață în mod implicit (GDPR)", async () => {
    const ged = parseGedcom(await exportGedcom(db, treeId));
    expect(ged.individuals.filter((i) => i.given === "Persoană")).toHaveLength(3);
    expect(ged.individuals.some((i) => i.given === "Andrei")).toBe(false);
    expect(ged.individuals.some((i) => i.given === "Toader")).toBe(true);
  });
  it("păstrează toate familiile și legăturile", async () => {
    const ged = parseGedcom(await exportGedcom(db, treeId, { includeLiving: true }));
    expect(ged.individuals).toHaveLength(Object.keys(DEMO).length);
    expect(ged.families.reduce((n, f) => n + f.children.length, 0)).toBe(demoGedcom().families.length);
  });
});

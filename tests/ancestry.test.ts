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

describe("tatăl și mama la locul lor, chiar când fișele sunt încurcate", () => {
  type Row = Parameters<typeof toAhnentafel>[0][number];
  const row = (id: string, childId: string | null, gen: number, sex: Row["sex"], givenName = id): Row => ({ id, childId, gen, sex, givenName });

  it("un „Tată necunoscut” rămas lângă tatăl adevărat nu-i ia locul, oricum ar veni din baza de date", () => {
    const ahnen = toAhnentafel([row("eu", null, 0, "M"), row("tn", "eu", 1, "M", "Tată necunoscut"), row("tata", "eu", 1, "M"), row("mama", "eu", 1, "F"),
      row("bunicul", "tata", 2, "M")]);
    expect(ahnen.get(2)).toBe("tata");
    expect(ahnen.get(3)).toBe("mama");
    expect(ahnen.get(4)).toBe("bunicul");
    expect([...ahnen.values()]).not.toContain("tn");
  });

  it("un „Tată necunoscut” rămas lângă tatăl adevărat nu ajunge nici pe locul mamei, când ea lipsește", () => {
    const ahnen = toAhnentafel([row("eu", null, 0, "M"), row("tn", "eu", 1, "M", "Tată necunoscut"), row("tata", "eu", 1, "M")]);
    expect(ahnen.get(2)).toBe("tata");
    expect(ahnen.has(3)).toBe(false);
  });

  it("mama trecută din greșeală ca bărbat nu dispare cu tot neamul ei: ia locul rămas liber", () => {
    const ahnen = toAhnentafel([row("eu", null, 0, "M"), row("tata", "eu", 1, "M"), row("mama", "eu", 1, "M"), row("bunica", "mama", 2, "F")]);
    // amândoi rămân în desen (iar sub desen apare semnul cu doi tați); cel cu strămoși ia primul loc
    expect(new Set([ahnen.get(2), ahnen.get(3)])).toEqual(new Set(["tata", "mama"]));
    expect([...ahnen.values()]).toContain("bunica");
  });

  it("cu tatăl trecut în două fișe, rămâne cel cu strămoși, iar mama își păstrează locul, oricum ar veni din baza de date", () => {
    const rows = [row("eu", null, 0, "M"), row("tata2", "eu", 1, "M", "Avram"), row("tata", "eu", 1, "M", "Avram"), row("mama", "eu", 1, "F"),
      row("bunicul", "tata", 2, "M"), row("bunicaM", "mama", 2, "F")];
    for (const order of [rows, [rows[0], rows[2], rows[1], ...rows.slice(3)], [rows[0], rows[3], rows[1], rows[2], ...rows.slice(4)]]) {
      const ahnen = toAhnentafel(order);
      expect(ahnen.get(2)).toBe("tata");
      expect(ahnen.get(3)).toBe("mama");
      expect(ahnen.get(4)).toBe("bunicul");
      expect(ahnen.get(7)).toBe("bunicaM");
    }
  });

  it("un părinte fără sex ales ia locul rămas liber, oricare ar fi el", () => {
    expect(toAhnentafel([row("eu", null, 0, "M"), row("x", "eu", 1, "U"), row("mama", "eu", 1, "F")]).get(2)).toBe("x");
    expect(toAhnentafel([row("eu", null, 0, "M"), row("x", "eu", 1, "U"), row("tata", "eu", 1, "M")]).get(3)).toBe("x");
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

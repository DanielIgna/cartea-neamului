import { describe, it, expect } from "vitest";
import { buildGraph, halfBy, kinship, type Rel, type Sex } from "@/lib/kinship";
import { likelyDuplicates, inLaws, type Lookalike } from "@/lib/family";
import { findChecks, stepsFor, type CheckPerson } from "@/lib/verificari";
import { familyRoles } from "@/lib/gedcom-db";

/**
 * Familia Todea, cum a fost trecută greșit: bunicul Iosif Todea (cca. 1925) are două soții, Ana și Jenica, iar Anca și Simona
 * (fiicele lui Iosif Todea fiul, cca. 1958, fratele Floarei) sunt trecute la bunic. Floarea Curtuli e sora lui Toader, cu numele de măritată.
 * Mihai Todea are o mamă și o soție cu același nume, Ana Todea.
 */
type Row = [string, string, string, Sex, number | null, string?];
const rows: Row[] = [
  ["iosifB", "Iosif", "Todea", "M", 1925], ["ana", "Ana", "Todea", "F", 1928], ["jenica", "Jenica", "Todea", "F", 1960],
  ["floarea", "Floarea", "Igna", "F", 1940, "Todea"], ["iosifF", "Iosif", "Todea", "M", 1958], ["toader", "Toader", "Todea", "M", 1950],
  ["curtuli", "Floarea", "Curtuli", "F", 1952], ["anca", "Anca", "Todea", "F", 1984], ["simona", "Simona", "Todea", "F", 1987],
  ["mihai", "Mihai", "Todea", "M", 1955], ["anaMama", "Ana", "Todea", "F", 1930], ["anaSotie", "Ana", "Todea", "F", 1957],
  ["avram", "Avram", "Igna", "M", 1930], ["valeria", "Valeria", "Igna", "F", 1933], ["lenuta", "Lenuța", "Negre", "F", 1956, "Igna"],
  ["daniel", "Ioan Daniel", "Igna", "M", 1962], ["nicu", "Nicolae", "Igna", "M", 1965],
];
const pc = (a: string, b: string): Rel => ({ type: "parent_child", a, b });
const wed = (a: string, b: string): Rel => ({ type: "partnership", a, b });
const rels: Rel[] = [
  wed("iosifB", "ana"), wed("iosifB", "jenica"),
  ...["floarea", "iosifF", "toader", "curtuli"].flatMap((k) => [pc("iosifB", k), pc("ana", k)]),
  pc("iosifB", "anca"), pc("jenica", "anca"), pc("iosifB", "simona"), pc("jenica", "simona"),
  pc("anaMama", "mihai"), wed("mihai", "anaSotie"),
  wed("avram", "floarea"), wed("avram", "valeria"), pc("avram", "daniel"), pc("floarea", "daniel"), pc("avram", "nicu"), pc("floarea", "nicu"),
  pc("avram", "lenuta"),
];
const people: Record<string, CheckPerson & Lookalike> = Object.fromEntries(rows.map(([id, givenName, surname, sex, birthYear, birthSurname]) =>
  [id, { id, givenName, surname, sex, birthYear, birthSurname: birthSurname ?? null }]));
const g = buildGraph(Object.values(people), rels);

describe("De verificat: tatăl și fiul cu același nume", () => {
  const checks = findChecks(g, people);
  it("propune ca Jenica să fie soția lui Iosif Todea fiul, cu fiicele ei", () => {
    const c = checks.find((x) => x.kind === "sotGeneratie");
    expect(c).toMatchObject({ older: "iosifB", namesake: "iosifF", who: "jenica" });
    expect(c && "kids" in c ? [...c.kids].sort() : []).toEqual(["anca", "simona"]);
    const steps = stepsFor(c!, "muta")!;
    expect(steps[0]).toEqual({ op: "moveSpouse", from: "iosifB", to: "iosifF", spouse: "jenica" });
    expect(steps.filter((s) => s.op === "moveChild").length).toBe(2);
    expect(stepsFor(c!, "corect")).toEqual([]);
    expect(stepsFor(c!, "altceva")).toBeNull();
  });
  it("nu o mai întreabă după ce s-a răspuns", () => {
    const again = findChecks(g, people, { "sotGeneratie:iosifB:jenica": { choice: "corect", by: null, at: "" } });
    expect(again.some((x) => x.kind === "sotGeneratie")).toBe(false);
  });
  it("după mutare, Anca și Simona sunt nepoatele Floarei, nu surorile ei", () => {
    const fixed = rels.filter((r) => !(r.type === "partnership" && r.b === "jenica") && !(r.a === "iosifB" && (r.b === "anca" || r.b === "simona")))
      .concat([wed("iosifF", "jenica"), pc("iosifF", "anca"), pc("iosifF", "simona")]);
    const g2 = buildGraph(Object.values(people), fixed);
    expect(kinship(g2, "floarea", "anca")?.label).toBe("nepoată de frate");
    expect(findChecks(g2, people).some((x) => x.kind === "sotGeneratie")).toBe(false);
  });
});

describe("De verificat: mama care lipsește", () => {
  it("întreabă cine e mama Lenuței, cu Valeria printre răspunsuri", () => {
    const c = findChecks(g, people).find((x) => x.kind === "parinteLipsa" && x.child === "lenuta");
    expect(c?.options.map((o) => o.id)).toEqual(expect.arrayContaining(["p:valeria", "p:floarea", "alta"]));
    expect(stepsFor(c!, "p:valeria")).toEqual([{ op: "setParent", child: "lenuta", parent: "valeria", role: "mother" }]);
  });
  it("cu Valeria trecută mamă, Daniel și Nicu sunt frații Lenuței după tată", () => {
    const g2 = buildGraph(Object.values(people), [...rels, pc("valeria", "lenuta")]);
    expect(halfBy(g2, "lenuta", "daniel")).toBe("M");
    expect(kinship(g2, "lenuta", "nicu")?.label).toBe("frate după tată");
    expect(halfBy(g2, "daniel", "nicu")).toBeNull();
  });
});

describe("De verificat: numele de fată", () => {
  it("întreabă dacă Curtuli e numele de măritată al Floarei, sora lui Toader", () => {
    const c = findChecks(g, people).find((x) => x.kind === "numeDeFata" && x.who === "curtuli");
    expect(c).toMatchObject({ father: "iosifB", maiden: "Todea" });
    expect(stepsFor(c!, "da")).toEqual([{ op: "birthSurname", who: "curtuli", value: "Todea" }]);
    expect(kinship(g, "toader", "curtuli")?.label).toBe("soră");
  });
  it("nu întreabă de Floarea Igna, care are numele de fată trecut", () => {
    expect(findChecks(g, people).some((x) => x.kind === "numeDeFata" && x.who === "floarea")).toBe(false);
  });
});

describe("dubluri: soacra și nora cu același nume", () => {
  it("Ana Todea, mama lui Mihai, și Ana Todea, soția lui, nu sunt propuse spre unire", () => {
    expect(inLaws(g, "anaMama", "anaSotie")).toBe(true);
    const pairs = likelyDuplicates(g, people).map((d) => [d.keep, d.drop].sort().join("|"));
    expect(pairs).not.toContain(["anaMama", "anaSotie"].sort().join("|"));
  });
});

describe("GEDCOM: familia cu un singur părinte", () => {
  const sex = (id: string) => ({ m: "M", f: "F", u: "U" })[id[0] as "m" | "f" | "u"];
  it("mama singură e WIFE, nu HUSB", () => {
    expect(familyRoles("f1", undefined, sex)).toEqual([undefined, "f1"]);
    expect(familyRoles(undefined, "f1", sex)).toEqual([undefined, "f1"]);
    expect(familyRoles("m1", undefined, sex)).toEqual(["m1", undefined]);
    expect(familyRoles("f1", "m1", sex)).toEqual(["m1", "f1"]);
    expect(familyRoles("m1", "f1", sex)).toEqual(["m1", "f1"]);
  });
});

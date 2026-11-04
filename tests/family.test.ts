import { describe, it, expect } from "vitest";
import { buildGraph, kinship, unionsOf, relativesByDegree, type Rel, type Sex } from "@/lib/kinship";
import { descendants, childrenByUnion, parentsFromSiblings } from "@/lib/family";

/**
 * Povestea de verificat: Avram a avut-o pe Mariana cu Iosefina și pe Lenuța cu Valeria (amândouă discrete),
 * apoi s-a căsătorit cu Floarea, cu care a rămas până la final: Ioan Daniel și Nicolae Radu.
 * Nicolae o are pe Ioana dintr-o altă relație (mama discretă) și pe Maria cu Silvia, soția lui.
 * Floarea și Avram au fost trecuți în arbore primii, fostele soții mai târziu (ordinea trecerii nu trebuie să conteze când se știu anii).
 */
const P: [string, Sex, number | null][] = [
  ["avram", "M", 1930], ["floarea", "F", 1935], ["iosefina", "F", 1932], ["valeria", "F", 1933],
  ["mariana", "F", 1952], ["lenuta", "F", 1956], ["ioan", "M", 1962], ["nicolae", "M", 1965],
  ["silvia", "F", 1968], ["mamaIoanei", "F", null], ["ioana", "F", 1988], ["maria", "F", 1996],
];
const pc = (a: string, b: string): Rel => ({ type: "parent_child", a, b });
const wed = (a: string, b: string, created: number): Rel => ({ type: "partnership", a, b, created });
const rels: Rel[] = [
  wed("avram", "floarea", 1), wed("avram", "iosefina", 5), wed("avram", "valeria", 6), wed("nicolae", "silvia", 2), wed("nicolae", "mamaIoanei", 7),
  pc("avram", "mariana"), pc("iosefina", "mariana"), pc("avram", "lenuta"), pc("valeria", "lenuta"),
  pc("avram", "ioan"), pc("floarea", "ioan"), pc("avram", "nicolae"), pc("floarea", "nicolae"),
  pc("nicolae", "ioana"), pc("mamaIoanei", "ioana"), pc("nicolae", "maria"), pc("silvia", "maria"),
];
const g = buildGraph(P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), rels);
const discreet = new Set(["iosefina", "valeria", "mamaIoanei"]);
const drawn = (id: string) => !discreet.has(id);
const label = (ego: string, other: string) => kinship(g, ego, other)?.label;

describe("ordinea căsătoriilor", () => {
  it("le pune după anii copiilor, nu după ordinea în care au fost trecute în arbore", () => {
    const u = unionsOf(g, "avram");
    expect(u.map((x) => x.spouse)).toEqual(["iosefina", "valeria", "floarea"]);
    expect(u.map((x) => x.order)).toEqual([1, 2, 3]);
    expect(u[2].children).toEqual(["ioan", "nicolae"]);
  });
  it("anul scris la căsătorie are întâietate", () => {
    const g2 = buildGraph(P.map(([id, sex, birthYear]) => ({ id, sex, birthYear })), [...rels.filter((r) => r.type === "parent_child"),
      { type: "partnership", a: "avram", b: "floarea", start: "1950", created: 9 }, wed("avram", "iosefina", 1), wed("avram", "valeria", 2)]);
    expect(unionsOf(g2, "avram")[0].spouse).toBe("floarea");
  });
});

describe("persoane discrete în desene", () => {
  it("Avram apare doar cu Floarea; fetele pornesc discret doar din el, băieții din Avram și Floarea", () => {
    const root = descendants(g, drawn, "avram");
    expect(root.partners).toEqual(["floarea"]);
    const kids = Object.fromEntries(root.children.map((c) => [c.id, c]));
    expect(kids.mariana).toMatchObject({ via: null, apart: true });
    expect(kids.lenuta).toMatchObject({ via: null, apart: true });
    expect(kids.ioan).toMatchObject({ via: "floarea" });
    expect(kids.ioan.apart).toBeUndefined();
    expect(root.children.map((c) => c.id)).toEqual(["mariana", "lenuta", "ioan", "nicolae"]);
  });
  it("Ioana pornește doar din Nicolae, Maria din Nicolae și Silvia", () => {
    const nicolae = descendants(g, drawn, "avram").children.find((c) => c.id === "nicolae")!;
    expect(nicolae.partners).toEqual(["silvia"]);
    expect(nicolae.children.find((c) => c.id === "ioana")).toMatchObject({ via: null, apart: true });
    expect(nicolae.children.find((c) => c.id === "maria")).toMatchObject({ via: "silvia" });
  });
  it("fără soț desenat, copiii nu sunt marcați „din altă relație”", () => {
    const solo = descendants(buildGraph([{ id: "t", sex: "M" }, { id: "c", sex: "F" }], [pc("t", "c")]), () => true, "t");
    expect(solo.children[0].apart).toBeUndefined();
  });
  it("în fișa lui Avram: copiii cu Floarea, apoi cei din altă relație, fără numele mamelor", () => {
    expect(childrenByUnion(g, drawn, "avram")).toEqual({ named: [{ spouse: "floarea", children: ["ioan", "nicolae"] }], other: ["mariana", "lenuta"] });
  });
});

describe("cum se numesc rudele prin alianță", () => {
  it("frați după tată și mama vitregă", () => {
    expect(kinship(g, "ioan", "mariana")).toMatchObject({ label: "soră după tată", degree: 2 });
    expect(label("mariana", "floarea")).toBe("mamă vitregă");
    expect(label("ioan", "iosefina")).toBe("prima soție a tatălui");
    expect(label("ioan", "valeria")).toBe("a doua soție a tatălui");
    expect(label("floarea", "mariana")).toBe("fiică vitregă");
    expect(label("ioana", "silvia")).toBe("mamă vitregă");
    expect(label("silvia", "ioana")).toBe("fiică vitregă");
    expect(kinship(g, "ioana", "maria")).toMatchObject({ label: "soră după tată", degree: 2 });
  });
  it("noră, socru, soacră, cumnată", () => {
    expect(label("avram", "silvia")).toBe("noră");
    expect(label("floarea", "silvia")).toBe("noră");
    expect(label("silvia", "avram")).toBe("socru");
    expect(label("silvia", "floarea")).toBe("soacră");
    expect(label("ioan", "silvia")).toBe("cumnată");
    expect(label("silvia", "ioan")).toBe("cumnat");
  });
  it("fără ani cunoscuți, soția tatălui rămâne „soția tatălui”", () => {
    const g3 = buildGraph([{ id: "t", sex: "M" }, { id: "m1", sex: "F" }, { id: "m2", sex: "F" }, { id: "c", sex: "M" }],
      [pc("t", "c"), pc("m1", "c"), wed("t", "m1", 1), wed("t", "m2", 2)]);
    expect(kinship(g3, "c", "m2")?.label).toBe("soția tatălui");
  });
  it("lista rudelor prin alianță le cuprinde, iar ecranul le ascunde pe cele discrete", () => {
    const aff = relativesByDegree(g, "ioan").affinity.map((x) => x.id);
    expect(aff).toEqual(expect.arrayContaining(["iosefina", "valeria", "silvia"]));
    expect(aff.filter(drawn)).not.toContain("iosefina");
  });
});

/**
 * Mama a fost trecută cu frații ei: „+ Frate/soră” i-a pus un „Tată necunoscut”, apoi frații au primit tatăl adevărat (Ion Todea),
 * iar ea a rămas cu locul gol. Mama ei (Maria) e comună tuturor, așa că frații rămân frați.
 */
describe("părinții pe care îi au frații, dar ea nu", () => {
  const people: [string, Sex][] = [["floarea", "F"], ["tn", "M"], ["tnd", "M"], ["ion", "M"], ["vasile", "M"], ["maria", "F"], ["ana", "F"], ["gheorghe", "M"], ["bunicul", "M"]];
  const names: Record<string, string> = { tn: "Tată necunoscut", tnd: "Tată necunoscut" };
  const ph = (id: string) => /necunoscut/.test(names[id] ?? "");
  const discreetPh = (id: string) => id === "tnd";
  const graphOf = (rels: Rel[]) => buildGraph(people.map(([id, sex]) => ({ id, sex })), rels);
  const siblings = [pc("ion", "ana"), pc("maria", "ana"), pc("ion", "gheorghe"), pc("maria", "gheorghe")];

  it("îi propune tatăl fraților în locul „Tatălui necunoscut”", () => {
    const g = graphOf([pc("tn", "floarea"), pc("maria", "floarea"), ...siblings]);
    expect(parentsFromSiblings(g, "floarea", ph, discreetPh)).toEqual([{ role: "father", id: "ion", current: "tn" }]);
  });
  it("îi propune mama fraților când ea n-are mamă", () => {
    const g = graphOf([pc("ion", "floarea"), ...siblings]);
    expect(parentsFromSiblings(g, "floarea", ph, discreetPh)).toEqual([{ role: "mother", id: "maria" }]);
  });
  it("nu propune nimic după „Nu, are alt tată” (loc gol discret), nici când „Tatăl necunoscut” are părinți", () => {
    expect(parentsFromSiblings(graphOf([pc("tnd", "floarea"), pc("maria", "floarea"), ...siblings]), "floarea", ph, discreetPh)).toEqual([]);
    expect(parentsFromSiblings(graphOf([pc("tn", "floarea"), pc("bunicul", "tn"), pc("maria", "floarea"), ...siblings]), "floarea", ph, discreetPh)).toEqual([]);
  });
  it("nu ghicește când frații au tați diferiți, și nu propune un alt loc gol", () => {
    const half = [pc("ion", "ana"), pc("maria", "ana"), pc("vasile", "gheorghe"), pc("maria", "gheorghe")];
    expect(parentsFromSiblings(graphOf([pc("tn", "floarea"), pc("maria", "floarea"), ...half]), "floarea", ph, discreetPh)).toEqual([]);
    expect(parentsFromSiblings(graphOf([pc("maria", "floarea"), pc("tn", "ana"), pc("maria", "ana")]), "floarea", ph, discreetPh)).toEqual([]);
  });
  it("fără niciun părinte nu are frați în arbore, deci nu are de unde propune", () => {
    expect(parentsFromSiblings(graphOf(siblings), "floarea", ph, discreetPh)).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { buildGraph, type Rel, type Sex } from "@/lib/kinship";
import { journeyStops, journeyLegs, quizFor, lineUp, agoWords, yearsWords, type Person } from "@/lib/calatorie";
import { eventsFor } from "@/lib/vremuri";
import { parseWord, wordFor, DEFAULT_WORD } from "@/lib/cuvant-final";

/**
 * Ioan Daniel, fiul lui Avram Igna și al Floarei (născută Todea). Spița Igna urcă din tată în tată: Avram → Gavril → Mărjel.
 * Spița Todea urcă prin tatăl Floarei: Iosif Todea → tatăl lui (fără an trecut). Onița, soția lui Gavril, nu e pe drum, dar trăia.
 */
const P: [string, Sex, number | null, number | null, string?][] = [
  ["ioan", "M", 1962, null], ["nicolae", "M", 1965, null], ["avram", "M", 1930, 2008], ["floarea", "F", 1935, 2015, "Todea"],
  ["gavril", "M", 1900, 1975], ["onita", "F", 1905, 1980], ["marjel", "M", 1870, 1940],
  ["iosif", "M", 1905, 1970], ["ana", "F", 1910, 1990], ["tataIosif", "M", null, null],
  ["iosefina", "F", 1932, null], ["necunoscut", "M", null, null],
];
const people: Record<string, Person> = Object.fromEntries(P.map(([id, sex, b, d, birthSurname]) => [id, {
  id, sex, birthYear: b, deathYear: d, living: d === null && (b ?? 0) > 1950, givenName: id === "necunoscut" ? "Tată necunoscut" : id, name: id,
  discreet: id === "iosefina", birthSurname,
}]));
const pc = (a: string, b: string): Rel => ({ type: "parent_child", a, b });
const rels: Rel[] = [
  pc("avram", "ioan"), pc("floarea", "ioan"), pc("avram", "nicolae"), pc("floarea", "nicolae"),
  pc("gavril", "avram"), pc("onita", "avram"), pc("marjel", "gavril"),
  pc("iosif", "floarea"), pc("ana", "floarea"), pc("tataIosif", "iosif"),
  { type: "partnership", a: "gavril", b: "onita" }, { type: "partnership", a: "avram", b: "floarea" },
];
const g = buildGraph(Object.values(people), rels);
const placeholder = (id: string) => id === "necunoscut";
const stops = () => journeyStops({ g, people, ego: "ioan", placeholder, now: 2026 });

describe("călătoria în timp", () => {
  it("pornește de la cel din centru și coboară pe amândouă spițele, din prezent spre trecut", () => {
    expect(stops().map((s) => s.id)).toEqual(["ioan", "floarea", "avram", "iosif", "gavril", "tataIosif", "marjel"]);
  });

  it("spițele urcă doar din tată în tată; mama tatălui și mama mamei nu sunt opriri", () => {
    const ids = stops().map((s) => s.id);
    expect(ids).not.toContain("onita");
    expect(ids).not.toContain("ana");
    expect(lineUp(g, "avram", null)).toEqual(["avram", "gavril", "marjel"]);
    expect(lineUp(g, "floarea", null)).toEqual(["floarea", "iosif", "tataIosif"]);
  });

  it("anul lipsă e socotit cu o generație înaintea copilului și e arătat ca socotit", () => {
    const t = stops().find((s) => s.id === "tataIosif")!;
    expect(t.estimated).toBe(true);
    expect(t.year).toBe(1905 - 28);
  });

  it("spune cine mai trăia atunci, cu vârsta și legătura față de omul de la oprire", () => {
    const avram = stops().find((s) => s.id === "avram")!;
    const onita = avram.contemporaries.find((c) => c.id === "onita");
    expect(onita).toEqual({ id: "onita", age: 25, relation: "mamă" });
    // Cei de pe drum au oprirea lor; persoanele discrete nu apar.
    expect(avram.contemporaries.map((c) => c.id)).not.toContain("gavril");
    expect(stops().flatMap((s) => s.contemporaries.map((c) => c.id))).not.toContain("iosefina");
  });

  it("o spiță aleasă altfel (prin mama tatălui) e urmată până la strămoșul ales", () => {
    expect(lineUp(g, "avram", "onita")).toEqual(["avram", "onita"]);
  });

  it("un „Tată necunoscut” fără părinți nu e oprire", () => {
    const g2 = buildGraph(Object.values(people), [...rels, pc("necunoscut", "nicolae")]);
    expect(journeyStops({ g: g2, people, ego: "nicolae", placeholder, now: 2026 }).map((s) => s.id)).not.toContain("necunoscut");
  });

  it("face popasul din anii comunismului după cel din centru, la intrarea în acei ani", () => {
    const legs = journeyLegs(stops(), people, 2026);
    expect(legs.map((l) => (l.kind === "regime" ? "popas" : l.stop.id))).toEqual(["ioan", "popas", "floarea", "avram", "iosif", "gavril", "tataIosif", "marjel"]);
    expect(legs[1].year).toBe(1962);
    // Fără nimeni care să fi trăit atunci, nici popas.
    const old = journeyStops({ g, people, ego: "marjel", placeholder, now: 2026 }).map((s) => ({ ...s, year: 1800 }));
    expect(journeyLegs(old, { ...people, marjel: { ...people.marjel, birthYear: 1800, deathYear: 1860 } }, 2026).some((l) => l.kind === "regime")).toBe(false);
  });

  it("jocul: unul din răspunsuri e din viața omului, celelalte nu; aceeași întrebare de fiecare dată", () => {
    const avram = stops().find((s) => s.id === "avram")!;
    const evs = eventsFor({ area: "ardeal", county: "CJ" });
    const q = quizFor(avram, people.avram, evs, 2026)!;
    expect(q.options).toHaveLength(3);
    const right = q.options[q.answer];
    expect(evs).toContain(right);
    expect(right.year >= 1930 && right.year <= 2008).toBe(true);
    expect(new Set(q.options.map((e) => e.id)).size).toBe(3);
    for (const [i, e] of q.options.entries()) if (i !== q.answer) expect((e.to ?? e.year) < 1930 || e.year > 2008).toBe(true);
    expect(quizFor(avram, people.avram, evs, 2026)).toEqual(q);
  });

  it("vorbe pentru ani", () => {
    expect(agoWords(1930, 2026)).toBe("acum 96 de ani");
    expect(agoWords(2020, 2026)).toBe("acum 6 ani");
    expect(yearsWords(1)).toBe("un an");
    expect(yearsWords(19)).toBe("19 ani");
    expect(yearsWords(25)).toBe("25 de ani");
    expect(yearsWords(101)).toBe("101 ani");
  });
});

describe("cuvântul de la final", () => {
  it("textul de bază are cele două spițe și versetele cu trimiteri", () => {
    const b = parseWord(DEFAULT_WORD);
    expect(b.filter((x) => x.kind === "title").map((x) => x.text)).toContain("Spița lui Adam");
    const refs = b.flatMap((x) => (x.kind === "verse" ? [x.ref] : []));
    expect(refs).toEqual(expect.arrayContaining(["Geneza 5:1", "Matei 1:1", "Ioan 17:3", "Ioan 3:3", "2 Cronici 7:14"]));
  });
  it("null = textul de bază, gol = ascuns, altfel textul proprietarului", () => {
    expect(wordFor(null)).toBe(DEFAULT_WORD);
    expect(wordFor("  ")).toBeNull();
    expect(parseWord(wordFor("Rând unu\nrând doi\n\n> Un verset — Ioan 1:1")!)).toEqual([
      { kind: "para", text: "Rând unu rând doi" }, { kind: "verse", text: "Un verset", ref: "Ioan 1:1" },
    ]);
  });
});

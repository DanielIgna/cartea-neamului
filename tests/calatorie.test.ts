import { describe, it, expect } from "vitest";
import { buildGraph, type Rel, type Sex } from "@/lib/kinship";
import { buildJourney, destinations, pathTo, type PersonStop, type Traveller } from "@/lib/calatorie";

const T = (id: string, sex: Sex, birthYear: number | null, more: Partial<Traveller> = {}): Traveller => ({
  id, name: id, givenName: id, sex, birthYear, deathYear: null, approx: false, living: false, discreet: false, birthPlace: null, occupation: null, biography: null, ...more,
});
const list = [T("daniel", "M", 1975, { living: true }), T("avram", "M", 1945), T("floarea", "F", 1950), T("petrea", "M", 1910), T("ana", "F", 1915), T("marjel", "M", 1880),
  T("necunoscut", "M", null, { givenName: "Tată necunoscut" }), T("verisor", "M", 1950), T("ascunsa", "F", 1948, { discreet: true }), T("departe", "M", 1800)];
const people = Object.fromEntries(list.map((p) => [p.id, p]));
const pc = (a: string, b: string): Rel => ({ type: "parent_child", a, b });
const g = buildGraph(list, [pc("avram", "daniel"), pc("floarea", "daniel"), pc("petrea", "avram"), pc("ana", "avram"), pc("marjel", "petrea"), pc("petrea", "verisor"), pc("ascunsa", "verisor")]);
const ardeal = { area: "ardeal" as const, region: "Transilvania", place: "Ieud" };
const persons = (id: string) => buildJourney(g, pathTo(g, "daniel", id, people)!, people, () => ardeal, 2026);

describe("drumul navei", () => {
  it("merge din copil în părinte și pornește implicit pe spița din tată în tată", () => {
    expect(pathTo(g, "daniel", "marjel", people)).toEqual(["daniel", "avram", "petrea", "marjel"]);
    expect(destinations(g, "daniel", people).preferred).toBe("marjel");
    expect(pathTo(g, "daniel", "departe", people)).toBeNull();
  });

  it("oprește la fiecare om, de la prezent spre trecut, cu un popas la anii comunismului", () => {
    const stops = persons("marjel");
    expect(stops.filter((s): s is PersonStop => s.kind === "person").map((s) => s.person.id)).toEqual(["daniel", "avram", "petrea", "marjel"]);
    expect(stops.filter((s) => s.kind === "regime")).toHaveLength(1);
    const years = stops.filter((s): s is PersonStop => s.kind === "person").map((s) => s.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it("fără popas când nimeni de pe drum nu a prins acei ani", () => {
    const only = { x: T("x", "M", 1800, { deathYear: 1860 }) };
    expect(buildJourney(buildGraph(Object.values(only), []), ["x"], only, () => ardeal, 2026).some((s) => s.kind === "regime")).toBe(false);
  });

  it("socotește anul lipsă după copil și spune că e o socoteală", () => {
    const fam = { c: T("c", "M", 1950), t: T("t", "M", null, { givenName: "Ion" }) };
    const stop = buildJourney(buildGraph(Object.values(fam), [pc("t", "c")]), ["c", "t"], fam, () => ardeal, 2026).filter((s): s is PersonStop => s.kind === "person")[1];
    expect(stop.year).toBe(1922);
    expect(stop.estimated).toBe(true);
  });

  it("contemporanii sunt din aceiași ani, fără persoane discrete, fără locuri goale și fără cei de pe drum", () => {
    const stop = persons("marjel").filter((s): s is PersonStop => s.kind === "person").find((s) => s.person.id === "avram")!;
    const ids = stop.contemporaries.map((c) => c.id);
    expect(ids).toContain("verisor");
    expect(ids).toContain("floarea");
    expect(ids).not.toContain("ascunsa");
    expect(ids).not.toContain("daniel");
  });

  it("răspunsul corect al întrebării e din viața omului, iar celelalte din afara ei", () => {
    for (const s of persons("marjel")) {
      if (s.kind !== "person" || !s.quiz) continue;
      expect(s.quiz.options).toHaveLength(3);
      expect(new Set(s.quiz.options).size).toBe(3);
      expect(s.story.lived.some((l) => l.event.text === s.quiz!.options[s.quiz!.answer])).toBe(true);
    }
  });
});

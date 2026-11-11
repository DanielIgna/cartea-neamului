import { describe, expect, it } from "vitest";
import { buildFilm, byYear, yearOf, type CloseFamily } from "@/lib/family-film";
import { uploadIdOf, withSubmission, withoutSubmission } from "@/lib/home-submissions";
import { activeImages, MAX_ACTIVE } from "@/lib/home-images";
import type { PersonView } from "@/lib/tree-data";

const person = (id: string, over: Partial<PersonView> = {}): PersonView => ({
  id, name: `Om ${id}`, givenName: id, surname: "Igna", birthSurname: null, sex: "M", birthText: null, birthPlace: null, deathText: null, deathPlace: null,
  birthCountry: null, deathCountry: null, residencePlace: null, residenceCountry: null, birthYear: null, deathYear: null, approx: false,
  living: false, discreet: false, claimed: false, occupation: null, biography: null, notes: null, createdBy: null, claimedBy: null, photoId: null, documents: [], ...over,
});
const photo = (id: string, dateText: string | null = null) => ({ id, title: `Poza ${id}`, kind: "photo", dateText, hasFile: true, description: null, mimeType: "image/jpeg" });
const cf = (o: Partial<CloseFamily> = {}): CloseFamily => ({ father: null, mother: null, paternal: { grandfather: null, grandmother: null }, maternal: { grandfather: null, grandmother: null },
  partners: [], siblings: [], children: [], grandchildren: [], ...o });

describe("filmul vieții", () => {
  it("citește anul din date scrise de mână", () => {
    expect(yearOf("12.03.1932")).toBe(1932);
    expect(yearOf("vara lui 1965")).toBe(1965);
    expect(yearOf("cca. 1970")).toBe(1970);
    expect(yearOf("demult")).toBeNull();
  });
  it("pune pozele în ordinea anilor, cele fără an la sfârșit", () => {
    expect(byYear([{ year: null, k: "a" }, { year: 1980, k: "b" }, { year: 1950, k: "c" }]).map((x) => x.k)).toEqual(["c", "b", "a"]);
  });
  it("face câte o rolă pentru fiecare rudă cu poze, fără soții discreți, și calculează vârsta", () => {
    const people = {
      a: person("a", { birthYear: 1932, documents: [photo("d1", "1955"), photo("d2", "1980"), { ...photo("act"), kind: "act", mimeType: "application/pdf" }] }),
      t: person("t", { documents: [photo("d3", "1930")] }),
      x: person("x", { discreet: true, sex: "F", documents: [photo("d4")] }),
      c: person("c", { sex: "F" }),
    };
    const f = buildFilm(people, "a", cf({ father: "t", partners: ["x"], children: ["c"] }), [{ photoId: "m1", title: "La coasă", body: "...", whenText: "vara lui 1960", whenYear: null }], () => null);
    expect(f.reels.map((r) => r.role)).toEqual(["self", "father", "memories"]);
    expect(f.reels[0].frames.map((x) => [x.id, x.age])).toEqual([["d1", 23], ["d2", 48]]);
    // Are 3 poze ale lui (cu amintirea), deci banda arată toată familia, în ordinea anilor.
    expect(f.life.map((x) => x.id)).toEqual(["d3", "d1", "m1", "d2"]);
    expect(f.life.find((x) => x.id === "m1")?.source).toBe("memory");
    expect(f.total).toBe(4);
  });
});

describe("poza propusă pentru prima pagină", () => {
  it("intră prima în banner și iese la retragere", () => {
    const sub = { id: "11111111-1111-1111-1111-111111111111", fileKey: "site/propuneri/x.jpg", mimeType: "image/jpeg" };
    const { state, error } = withSubmission({}, sub, "admin");
    expect(error).toBeUndefined();
    const active = activeImages("banner", state.banner).map((i) => i.id);
    expect(active[0]).toBe(`u:${uploadIdOf(sub.id)}`);
    expect(active.length).toBeLessThanOrEqual(MAX_ACTIVE);
    const back = withoutSubmission(state, sub.id);
    expect(back.banner?.uploads).toEqual([]);
    expect(activeImages("banner", back.banner).some((i) => i.id.startsWith("u:"))).toBe(false);
  });
});

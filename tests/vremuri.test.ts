import { describe, it, expect } from "vitest";
import { ERAS, EVENTS, eraOf, eventsFor, storyFor, regionOfCounty, ageWords, type Origin } from "@/lib/vremuri";
import { resolvePlaces } from "@/lib/places";
import { countyCode } from "@/lib/place-key";

const huedin: Origin = { area: "ardeal", region: "Transilvania", county: "CJ", place: "Huedin" };
const iasi: Origin = { area: "regat", region: "Moldova", county: "IS", place: "Iași" };

describe("povestea vremurilor", () => {
  it("epocile se țin una după alta, fără găuri", () => {
    for (let i = 1; i < ERAS.length; i++) expect(ERAS[i].from).toBe(ERAS[i - 1].to + 1);
    for (const e of ERAS) expect(e.life["*"]).toBeTruthy();
  });
  it("fiecare eveniment are măcar un ținut și anii în ordine", () => {
    for (const e of EVENTS) { expect(e.areas.length).toBeGreaterThan(0); if (e.to) expect(e.to).toBeGreaterThanOrEqual(e.year); }
  });
  it("cine s-a născut la Huedin în 1932 a trăit Dictatul de la Viena și ocupația horthystă, nu bombardarea Bucureștiului", () => {
    const s = storyFor({ birthYear: 1932, deathYear: 2008, living: false }, huedin)!;
    expect(s.era.name).toBe("România Mare");
    expect(s.life).toMatch(/Ardealul/);
    const texts = s.lived.map((l) => l.event.text).join(" | ");
    expect(texts).toMatch(/Dictatul de la Viena/);
    expect(texts).toMatch(/horthystă/);
    expect(texts).not.toMatch(/Ploieștiului/);
    expect(s.lived.find((l) => /Dictatul/.test(l.event.text))!.age).toBe(8);
    expect(s.lived.length).toBeLessThanOrEqual(9);
  });
  it("în Moldova, foametea din 1946 da, ocupația horthystă nu", () => {
    const texts = storyFor({ birthYear: 1935, deathYear: null, living: false }, iasi)!.lived.map((l) => l.event.text).join(" | ");
    expect(texts).toMatch(/foametea/);
    expect(texts).not.toMatch(/horthystă/);
  });
  it("înainte de 1918 Ardealul și Regatul au povești diferite", () => {
    expect(storyFor({ birthYear: 1880, deathYear: 1950, living: false }, huedin)!.life).toMatch(/Ungariei/);
    expect(storyFor({ birthYear: 1880, deathYear: 1950, living: false }, iasi)!.life).toMatch(/independența/);
  });
  it("fără loc știut, doar evenimentele mari ale tuturor; fără an, nicio poveste", () => {
    expect(eventsFor(null).every((e) => e.areas.includes("ardeal") && e.areas.includes("regat"))).toBe(true);
    expect(storyFor({ birthYear: null, deathYear: null, living: true }, huedin)).toBeNull();
  });
  it("cei în viață trăiesc până azi; epoca după an", () => {
    const s = storyFor({ birthYear: 1985, deathYear: null, living: true }, huedin, 2026)!;
    expect(s.lived.some((l) => l.event.year === 2020)).toBe(true);
    expect(eraOf(1989).name).toBe("Epoca Ceaușescu");
    expect(eraOf(1990).name).toBe("Anii tranziției");
  });
  it("vârsta în cuvinte", () => {
    expect(ageWords(0, "M")).toBe("în anul nașterii");
    expect(ageWords(3, "F")).toBe("copilă de 3 ani");
    expect(ageWords(25, "M")).toBe("la 25 de ani");
  });
  it("satul găsit pe hartă dă județul, iar județul ținutul", async () => {
    const spots = await resolvePlaces([{ key: "huedin|RO", text: "Huedin", country: null, weight: 1 }]);
    const code = countyCode(spots.get("huedin|RO")!.group);
    expect(code).toBe("CJ");
    expect(regionOfCounty(code)).toEqual(["ardeal", "Transilvania"]);
    expect(regionOfCounty("SV")?.[0]).toBe("bucovina");
    expect(regionOfCounty("CT")?.[0]).toBe("dobrogea");
  });
});

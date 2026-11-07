import { describe, it, expect } from "vitest";
import { createTranslator } from "use-intl/core";
import { ERAS, EVENTS, eraOf, eventsFor, storyFor, regionOfCounty, ageWords, type Origin, type Story, type HistEvent } from "@/lib/vremuri";
import { resolvePlaces } from "@/lib/places";
import { countyCode } from "@/lib/place-key";
import { ro } from "@/i18n/messages/ro";
import { loadMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/locales";

const huedin: Origin = { area: "ardeal", region: "transilvania", county: "CJ", place: "Huedin" };
const iasi: Origin = { area: "regat", region: "moldova", county: "IS", place: "Iași" };

/** Cuvintele poveștii într-o limbă, ca în componente (partea „Vremuri” din texte). */
async function wordsIn(locale: Locale) {
  const t = createTranslator({ locale, messages: (await loadMessages(locale)) as unknown as typeof ro, namespace: "Vremuri" }) as unknown as (key: string) => string;
  return {
    era: (s: Story) => t(`eras.${s.era.id}.name`),
    life: (s: Story) => t(`eras.${s.era.id}.life.${s.life}`),
    event: (e: HistEvent) => t(`events.${e.id}`),
    region: (o: Origin) => t(`regions.${o.region}`),
  };
}
const words = ro.Vremuri;
const lived = (s: Story, w: { event: (e: HistEvent) => string }) => s.lived.map((l) => w.event(l.event)).join(" | ");

describe("povestea vremurilor", () => {
  it("epocile se țin una după alta, fără găuri", () => {
    for (let i = 1; i < ERAS.length; i++) expect(ERAS[i].from).toBe(ERAS[i - 1].to + 1);
    for (const e of ERAS) expect(words.eras[e.id].life.all).toBeTruthy();
  });
  it("fiecare epocă, eveniment și ținut are cuvintele lui, și nimic în plus", () => {
    expect(Object.keys(words.eras).sort()).toEqual(ERAS.map((e) => e.id).sort());
    // `own` spune exact ce ținuturi au povestea lor: storyFor nu alege niciodată un text care lipsește.
    for (const e of ERAS) expect(Object.keys(words.eras[e.id].life).filter((k) => k !== "all").sort(), e.id).toEqual([...e.own].sort());
    expect(Object.keys(words.events).sort()).toEqual(EVENTS.map((e) => e.id).sort());
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const code of ["CJ", "MM", "SM", "BH", "TM", "SV", "IS", "B", "DJ", "CT"]) expect(words.regions[regionOfCounty(code)![1]]).toBeTruthy();
  });
  it("fiecare eveniment are măcar un ținut și anii în ordine", () => {
    for (const e of EVENTS) { expect(e.areas.length).toBeGreaterThan(0); if (e.to) expect(e.to).toBeGreaterThanOrEqual(e.year); }
  });
  it("cine s-a născut la Huedin în 1932 a trăit Dictatul de la Viena și ocupația horthystă, nu bombardarea Bucureștiului", async () => {
    const w = await wordsIn("ro");
    const s = storyFor({ birthYear: 1932, deathYear: 2008, living: false }, huedin)!;
    expect(w.era(s)).toBe("România Mare");
    expect(w.life(s)).toMatch(/Ardealul/);
    const texts = lived(s, w);
    expect(texts).toMatch(/Dictatul de la Viena/);
    expect(texts).toMatch(/horthystă/);
    expect(texts).not.toMatch(/Ploieștiului/);
    expect(s.lived.find((l) => l.event.id === "1940-dictatul-viena")!.age).toBe(8);
    expect(s.lived.length).toBeLessThanOrEqual(9);
  });
  it("aceeași poveste, în limba cititorului: epoca, viața de atunci, evenimentele și ținutul", async () => {
    const s = storyFor({ birthYear: 1932, deathYear: 2008, living: false }, huedin)!;
    const en = await wordsIn("en-GB"), de = await wordsIn("de"), hu = await wordsIn("hu"), us = await wordsIn("en-US");
    expect(en.era(s)).toBe("Greater Romania");
    expect(en.life(s)).toMatch(/^Transylvania was now part of Romania/);
    expect(lived(s, en)).toMatch(/The Second Vienna Award: northern Transylvania is given to Hungary/);
    expect(en.region(huedin)).toBe("Transylvania");
    expect(de.era(s)).toBe("Großrumänien");
    expect(lived(s, de)).toMatch(/Der Zweite Wiener Schiedsspruch/);
    expect(de.region(huedin)).toBe("Siebenbürgen");
    expect(hu.region(huedin)).toBe("Erdély");
    // Engleza americană: aceleași texte, cu cuvintele și datele ei.
    expect(lived(s, us)).toMatch(/August 23: Romania changes sides/);
    expect(lived(s, us)).toMatch(/Collectivization: land and animals/);
    for (const l of ["fr", "es", "nl", "it"] as const) {
      const w = await wordsIn(l);
      expect(w.era(s), l).not.toBe("România Mare");
      expect(lived(s, w), l).not.toMatch(/Dictatul|Ardealul/);
    }
  });
  it("în Moldova, foametea din 1946 da, ocupația horthystă nu", async () => {
    const texts = lived(storyFor({ birthYear: 1935, deathYear: null, living: false }, iasi)!, await wordsIn("ro"));
    expect(texts).toMatch(/foametea/);
    expect(texts).not.toMatch(/horthystă/);
  });
  it("înainte de 1918 Ardealul și Regatul au povești diferite", async () => {
    const w = await wordsIn("ro");
    expect(w.life(storyFor({ birthYear: 1880, deathYear: 1950, living: false }, huedin)!)).toMatch(/Ungariei/);
    expect(w.life(storyFor({ birthYear: 1880, deathYear: 1950, living: false }, iasi)!)).toMatch(/independența/);
    // Un ținut fără povestea lui în epoca aceea o primește pe cea comună.
    expect(storyFor({ birthYear: 1880, deathYear: 1950, living: false }, null)!.life).toBe("all");
    expect(storyFor({ birthYear: 1995, deathYear: null, living: true }, huedin)!.life).toBe("all");
  });
  it("fără loc știut, doar evenimentele mari ale tuturor; fără an, nicio poveste", () => {
    expect(eventsFor(null).every((e) => e.areas.includes("ardeal") && e.areas.includes("regat"))).toBe(true);
    expect(storyFor({ birthYear: null, deathYear: null, living: true }, huedin)).toBeNull();
  });
  it("cei în viață trăiesc până azi; epoca după an", () => {
    const s = storyFor({ birthYear: 1985, deathYear: null, living: true }, huedin, 2026)!;
    expect(s.lived.some((l) => l.event.year === 2020)).toBe(true);
    expect(words.eras[eraOf(1989).id].name).toBe("Epoca Ceaușescu");
    expect(words.eras[eraOf(1990).id].name).toBe("Anii tranziției");
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
    expect(regionOfCounty(code)).toEqual(["ardeal", "transilvania"]);
    expect(regionOfCounty("SV")?.[0]).toBe("bucovina");
    expect(regionOfCounty("CT")?.[0]).toBe("dobrogea");
  });
});

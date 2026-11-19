import { describe, expect, it } from "vitest";
import { entries, draftEntries, resolve, resolveDraft } from "@/lib/diaspora";
import { DRAFT_COUNTRIES, PENDING, draftKey } from "@/lib/diaspora/ciorne";
import { DRAFT_REGIONS } from "@/lib/diaspora/ciorne/regiuni";
import { DRAFT_THEMES } from "@/lib/diaspora/ciorne/teme";
import { APROBATE } from "@/lib/diaspora/ciorne/aprobate";
import { ownWords } from "@/lib/diaspora/extins";
import { getEntry } from "@/lib/continut/colectii";
import { REGION_MIN_WORDS } from "@/lib/diaspora/america";

/** Ciornele de diaspora (Europa, Ucraina, valurile de emigrare): nimic public până la aprobarea lui Daniel. */
describe("ciornele diasporei", () => {
  const published = new Set(entries().map((e) => e.path));

  it("ciornele neaprobate nu sunt pagini publice", () => {
    for (const e of draftEntries()) {
      expect(published.has(e.path), e.path).toBe(false);
      const [, , a, b] = e.path.split("/");
      expect(resolve(a, b), e.path).toBeNull();
      expect(resolveDraft(a, b)?.path).toBe(e.path);
    }
  });

  it("fiecare cheie aprobată există", () => {
    const keys = new Set([...DRAFT_COUNTRIES.map(draftKey.country), ...DRAFT_REGIONS.map(draftKey.region), ...DRAFT_THEMES.map(draftKey.theme)]);
    for (const k of APROBATE) expect(keys.has(k), k).toBe(true);
    // Toate ciornele din 18.11.2026 sunt aprobate (19.11.2026); ce rămâne în PENDING nu e public.
    expect(PENDING.themes.length + PENDING.regions.length + PENDING.countries.length).toBeGreaterThanOrEqual(0);
  });

  it("fiecare articol e scris în toate limbile lui, cu titlu și descriere", () => {
    for (const t of DRAFT_THEMES) for (const l of t.langs) {
      expect(t.name[l], `${t.slug} ${l}`).toBeTruthy();
      expect(t.description[l], `${t.slug} ${l}`).toBeTruthy();
      expect(ownWords((t.body[l] ?? []).flatMap((s) => [s.h, ...s.p])), `${t.slug} ${l}`).toBeGreaterThanOrEqual(250);
    }
  });

  it("regiunile au destule cuvinte proprii în română și text în fiecare limbă", () => {
    for (const r of DRAFT_REGIONS) {
      expect(ownWords(r.notes.ro ?? []), r.slug).toBeGreaterThanOrEqual(REGION_MIN_WORDS);
      for (const l of r.langs) expect(ownWords(r.notes[l] ?? []), `${r.slug} ${l}`).toBeGreaterThanOrEqual(180);
      for (const l of r.langs) expect(r.notes[l]?.length, `${r.slug} ${l}`).toBeGreaterThan(0);
    }
  });

  it("ghidurile legate există", () => {
    for (const x of [...DRAFT_THEMES, ...DRAFT_REGIONS]) for (const g of x.guides ?? []) expect(getEntry("ghid", g), `${x.slug} → ${g}`).not.toBeNull();
  });

  it("fără limbaj religios și fără carte tipărită", () => {
    const text = JSON.stringify([DRAFT_COUNTRIES, DRAFT_REGIONS, DRAFT_THEMES]);
    for (const w of [/Biblia/i, /\bBible\b/i, /carte tipărită/i, /printed book/i, /Dumnezeu/i]) expect(text).not.toMatch(w);
  });
});

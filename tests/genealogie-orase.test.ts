import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { GEN_CITIES, GEN_MIN_WORDS, REGION_PAGES_LIVE, genCityPath, genWords, regionPagePath } from "@/lib/genealogie-orase";
import { getCounty } from "@/lib/continut/localitati";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { sectionOf } from "@/lib/public-sections";
import { fitTitle } from "@/lib/page-metadata";

describe("genealogie pe orașe", () => {
  it("are cel puțin 10 orașe, fiecare cu județ cunoscut și ≥300 de cuvinte proprii", () => {
    expect(GEN_CITIES.length).toBeGreaterThanOrEqual(10);
    for (const c of GEN_CITIES) {
      expect(getCounty(c.county), c.slug).not.toBeNull();
      expect(genWords(c), c.slug).toBeGreaterThanOrEqual(GEN_MIN_WORDS);
    }
  });

  it("slugurile sunt unice și nu iau numele paginilor regionale", () => {
    const slugs = GEN_CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain("regiune");
    expect(regionPagePath("banat")).toBe("/genealogie/regiune/banat");
    expect(sectionOf("/genealogie/regiune/banat")).toBe("genealogie");
    expect(sectionOf("/genealogie/cluj-napoca")).toBe("genealogie");
  });

  it("titlurile încap în 60 de caractere și nu se repetă paragrafele", () => {
    for (const c of GEN_CITIES) expect(fitTitle(`Genealogie ${c.name}: arhive, registre, nume | Cartea Neamului`).length).toBeLessThanOrEqual(60);
    const paras = GEN_CITIES.flatMap((c) => c.body.flatMap((s) => s.p));
    expect(new Set(paras).size).toBe(paras.length);
  });

  it("textele nu pomenesc unelte de construcție și nu au limbaj religios în titluri", () => {
    const src = readFileSync("src/lib/genealogie-orase.ts", "utf8") + readFileSync("src/components/continut/GenealogieOrase.tsx", "utf8");
    expect(src).not.toMatch(/\bAI\b|inteligen[țt]ă artificială|ChatGPT|Claude/);
    for (const c of GEN_CITIES) for (const s of c.body) expect(s.h).not.toMatch(/Biblie|Dumnezeu|credin/i);
  });

  it("paginile sunt în sitemap; legăturile regionale așteaptă să fie publicate", () => {
    const paths = sitemapGroups().flatMap((g) => g.urls.map((u) => u.path));
    for (const c of GEN_CITIES) expect(paths).toContain(genCityPath(c));
    expect(paths).toContain("/genealogie");
    expect(REGION_PAGES_LIVE).toBe(true);
  });
});

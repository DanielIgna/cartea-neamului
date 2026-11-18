import { describe, expect, it } from "vitest";
import { GEN_REGIONS, genRegionPath, regionWords } from "@/lib/genealogie-regiuni";
import { getEntry } from "@/lib/continut/colectii";
import { getCounty } from "@/lib/continut/localitati";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { REGION_LABEL, regionPagePath } from "@/lib/genealogie-orase";

describe("paginile regionale /genealogie/regiune/<slug>", () => {
  it("sunt cele 10 (7 + Crișana, Muntenia, Oltenia), cu aceeași adresă ca legăturile din paginile de orașe", () => {
    expect(GEN_REGIONS.map((r) => r.slug).sort()).toEqual(["banat", "basarabia", "bucovina", "crisana", "dobrogea", "maramures", "moldova", "muntenia", "oltenia", "transilvania"]);
    for (const r of GEN_REGIONS) {
      expect(genRegionPath(r)).toBe(regionPagePath(r.slug));
      expect(REGION_LABEL[r.slug]).toBe(r.name);
    }
  });
  it("au text propriu, titlu ≤60, descriere 120–155, ghiduri și județe care există", () => {
    for (const r of GEN_REGIONS) {
      expect(regionWords(r), r.slug).toBeGreaterThanOrEqual(400);
      expect(r.title.length, r.slug).toBeLessThanOrEqual(60);
      expect(r.description.length, r.slug).toBeGreaterThanOrEqual(120);
      expect(r.description.length, r.slug).toBeLessThanOrEqual(155);
      for (const g of r.guides) expect(getEntry("ghid", g), `${r.slug}: ${g}`).not.toBeNull();
      for (const c of r.counties) expect(getCounty(c), `${r.slug}: ${c}`).toBeTruthy();
      expect(r.faq.length).toBeGreaterThanOrEqual(3);
    }
  });
  it("sunt în sitemap", () => {
    const urls = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
    for (const r of GEN_REGIONS) expect(urls.has(genRegionPath(r))).toBe(true);
  });
});

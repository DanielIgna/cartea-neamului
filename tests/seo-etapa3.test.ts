import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { GEN_REGIONS, genRegionPath, getGenRegion, regionWords } from "@/lib/genealogie-regiuni";
import { GEN_CITIES, REGION_LABEL } from "@/lib/genealogie-orase";
import { REGIONS, type RegionKey } from "@/lib/continut/regiuni";
import { loadCounties } from "@/lib/continut/localitati";
import { getEntry } from "@/lib/continut/colectii";
import { countyCrumbs, placeCrumbs } from "@/lib/seo/firimituri";
import { sitemapGroups } from "@/lib/continut/sitemap";

/** Planul SEO, etapa 3: regiunile lipsă (Crișana, Muntenia, Oltenia) și legăturile interne. */
describe("SEO etapa 3: regiuni și legături", () => {
  it("fiecare regiune istorică din paginile de nume și localități are pagina ei", () => {
    for (const k of Object.keys(REGIONS) as RegionKey[]) expect(getGenRegion(k), k).not.toBeNull();
    for (const k of ["crisana", "muntenia", "oltenia"]) expect(REGION_LABEL[k]).toBe(getGenRegion(k)!.name);
  });

  it("regiunile noi au text propriu, întrebări și ghiduri care există", () => {
    for (const slug of ["crisana", "muntenia", "oltenia"]) {
      const r = getGenRegion(slug)!;
      expect(regionWords(r), slug).toBeGreaterThanOrEqual(400);
      expect(r.faq.length).toBeGreaterThanOrEqual(3);
      for (const g of r.guides) expect(getEntry("ghid", g), g).toBeTruthy();
    }
  });

  it("fiecare județ e trecut la regiunea lui principală, iar fiecare regiune din România are județe", () => {
    for (const c of loadCounties()) expect(getGenRegion(c.regions[0])!.counties, c.slug).toContain(c.slug);
    for (const r of GEN_REGIONS.filter((x) => x.slug !== "basarabia")) expect(r.counties.length, r.slug).toBeGreaterThan(0);
  });

  it("orașele mari au regiunea lor (nicio pagină de oraș fără regiune)", () => {
    for (const c of GEN_CITIES) expect(c.region, c.slug).not.toBeNull();
    expect(GEN_CITIES.find((c) => c.slug === "oradea")!.region).toBe("crisana");
  });

  it("firul de pagini: Genealogie › Regiune › Județ › Localitate", () => {
    const cluj = loadCounties().find((c) => c.slug === "cluj")!;
    expect(countyCrumbs(cluj).map((x) => x.path)).toEqual(["/genealogie", "/genealogie/regiune/transilvania", "/localitati/cluj"]);
    const dolj = loadCounties().find((c) => c.slug === "dolj")!;
    expect(placeCrumbs(dolj, { name: "Craiova", path: "/localitati/dolj/craiova" }).map((x) => x.name)).toEqual(["Genealogie", "Oltenia", "Județul Dolj", "Craiova"]);
  });

  it("paginile regionale noi sunt în sitemap", () => {
    const all = sitemapGroups().flatMap((g) => g.urls.map((u) => u.path));
    for (const slug of ["crisana", "muntenia", "oltenia"]) expect(all).toContain(genRegionPath({ slug }));
  });

  it("hubul /genealogie are titlul nou, iar acasă și subsolul îl leagă", () => {
    expect(readFileSync("src/components/continut/GenealogieOrase.tsx", "utf8")).toContain("Genealogie pe regiuni, județe și orașe");
    expect(readFileSync("src/components/Landing.tsx", "utf8")).toMatch(/\["\/genealogie", /);
    expect(readFileSync("src/components/SiteFooter.tsx", "utf8")).toContain('href="/genealogie"');
  });

  it("paginile de nume leagă regiunile și județele", () => {
    const src = readFileSync("src/components/continut/NamePages.tsx", "utf8");
    expect(src).toContain("genRegionPath(g)");
    expect(src).toContain("countyPath(c)");
  });
});

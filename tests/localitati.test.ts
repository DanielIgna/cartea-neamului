import { describe, expect, it } from "vitest";
import { loadCounties, countyPath, seatPath } from "@/lib/continut/localitati";
import { countyMetadata, seatMetadata, localitiesHubMetadata } from "@/components/continut/LocalityPages";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { getName } from "@/lib/continut/nume";

describe("/localitati", () => {
  const cs = loadCounties();
  it("are 41 de județe plus București", () => {
    expect(cs).toHaveLength(42);
    expect(cs.filter((c) => c.seatSlug)).toHaveLength(41);
    expect(new Set(cs.map((c) => c.slug)).size).toBe(42);
  });
  it("fiecare județ are arhivă și istorie", () => {
    for (const c of cs) {
      expect(c.archive).toMatch(/Arhivelor Naționale/);
      expect(c.history.length).toBeGreaterThan(60);
    }
  });
  it("metadate unice pe fiecare pagină", async () => {
    const metas = [localitiesHubMetadata()];
    for (const c of cs) {
      metas.push(await countyMetadata(c.slug));
      if (c.seatSlug) metas.push(await seatMetadata(c.slug, c.seatSlug));
    }
    const titles = metas.map((m) => String(m.title));
    const descs = metas.map((m) => String(m.description));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(80);
  });
  it("sitemap conține județele și reședințele", () => {
    const g = sitemapGroups().find((x) => x.name === "localitati")!;
    expect(g.urls).toHaveLength(1 + 42 + 41);
    expect(g.urls.map((u) => u.path)).toContain(countyPath(cs[0]));
    expect(g.urls.map((u) => u.path)).toContain(seatPath(cs.find((c) => c.seatSlug)!)!);
  });
  it("legăturile spre nume trimit la pagini existente", () => {
    for (const c of cs) for (const n of (c as { names?: string[] }).names ?? []) expect(getName(n)).toBeTruthy();
  });
});

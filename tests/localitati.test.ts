import { describe, expect, it } from "vitest";
import { loadCounties, countyPath, seatPath } from "@/lib/continut/localitati";
import { countyMetadata, seatMetadata, localitiesHubMetadata } from "@/components/continut/LocalityPages";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { getName } from "@/lib/continut/nume";
import { loadUats, getUat, uatPath, neighbours, rankInCounty } from "@/lib/continut/uat";
import { uatGate } from "@/lib/continut/prag";
import { countOf, uatDescription, uatTitle } from "@/lib/continut/uat-text";

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
  it("sitemap conține județele, reședințele și localitățile peste prag", () => {
    const g = sitemapGroups().find((x) => x.name === "localitati")!;
    const indexable = loadUats().filter((u) => !uatGate(u) && !cs.some((c) => c.slug === u.countySlug && c.seatSlug === u.slug)).length;
    expect(g.urls).toHaveLength(1 + 42 + 41 + indexable);
    expect(new Set(g.urls.map((u) => u.path)).size).toBe(g.urls.length);
    expect(g.urls.length).toBeLessThan(50_000);
    expect(g.urls.map((u) => u.path)).toContain(countyPath(cs[0]));
    expect(g.urls.map((u) => u.path)).toContain(seatPath(cs.find((c) => c.seatSlug)!)!);
  });
  it("legăturile spre nume trimit la pagini existente", () => {
    for (const c of cs) for (const n of (c as { names?: string[] }).names ?? []) expect(getName(n)).toBeTruthy();
  });
});

describe("/localitati/<județ>/<localitate>", () => {
  const cs = loadCounties();
  const all = loadUats();
  it("are toate comunele, orașele și municipiile din SIRUTA, fără București", () => {
    expect(all.length).toBe(3180);
    expect(all.filter((u) => u.kind === "m").length).toBe(102);
    expect(new Set(all.map(uatPath)).size).toBe(all.length);
    for (const u of all) {
      expect(uatPath(u)).toMatch(/^\/localitati\/[a-z0-9-]+\/[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(u.villages.length).toBeGreaterThan(0);
    }
  });
  it("reședința fiecărui județ e și localitate, la aceeași adresă", () => {
    for (const c of cs.filter((x) => x.seatSlug)) expect(getUat(c.slug, c.seatSlug!)).toBeTruthy();
  });
  it("titluri și descrieri unice, de lungime potrivită", () => {
    const byCounty = new Map(cs.map((c) => [c.slug, c]));
    const titles = all.map((u) => uatTitle(u, byCounty.get(u.countySlug)!));
    const descs = all.map((u) => uatDescription(u, byCounty.get(u.countySlug)!));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    for (const d of descs) expect(d.length).toBeLessThanOrEqual(165);
  });
  it("datele proprii: vecini, loc în județ", () => {
    const s = getUat("cluj", "sancraiu")!;
    expect(s.villages.map((v) => v.name)).toContain("Domoșu");
    expect(neighbours(s, 3).map((x) => x.u.name)).toContain("Huedin");
    const r = rankInCounty(s);
    expect(r.rank).toBeGreaterThan(0);
    expect(r.rank).toBeLessThanOrEqual(r.of);
  });
  it("pragul ține afară doar comunele mici cu un singur sat", () => {
    const gated = all.filter((u) => uatGate(u));
    expect(gated.length).toBeGreaterThan(0);
    expect(gated.length).toBeLessThan(all.length / 10);
    for (const u of gated) { expect(u.kind).toBe("c"); expect(u.villages).toHaveLength(1); }
  });
  it("numere scrise corect în română", () => {
    expect(countOf(1, "sat", "sate")).toBe("1 sat");
    expect(countOf(7, "sat", "sate")).toBe("7 sate");
    expect(countOf(19, "sat", "sate")).toBe("19 sate");
    expect(countOf(20, "sat", "sate")).toBe("20 de sate");
    expect(countOf(101, "sat", "sate")).toBe("101 sate");
    expect(countOf(120, "sat", "sate")).toBe("120 de sate");
  });
});

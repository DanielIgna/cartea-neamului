import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { KEYWORDS_APPROVED, PLANNED_GUIDES, seoKeywords, toCsv } from "@/data/seo-keywords";
import { rawGroups } from "@/lib/continut/sitemap";
import { loadNames } from "@/lib/continut/nume";

/** Planul SEO, secțiunea 5: lista de cuvinte cheie, ca ciornă până la aprobare. */
describe("cuvinte cheie (ciornă)", () => {
  const rows = seoKeywords();
  // Paginile din hartă, plus paginile de nume sub prag (există, dar sunt „noindex” până le îmbogățim: „de-imbunatatit”).
  const paths = new Set(["/", ...rawGroups().flatMap((g) => g.urls.map((u) => u.path)), ...loadNames().map((n) => `/nume/${n.slug}`)]);

  it("rămâne ciornă până o aprobă Daniel și nu e folosită pe site", () => {
    expect(KEYWORDS_APPROVED).toBe(false);
    expect(readFileSync("src/lib/seo-cuvinte.ts", "utf8")).not.toContain("seo-keywords");
  });

  it("are peste 1.000 de rânduri, fără dubluri", () => {
    expect(rows.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(rows.map((r) => r.keyword.toLowerCase())).size).toBe(rows.length);
  });

  it("fiecare pagină țintă „exista” sau „de-imbunatatit” există", () => {
    const missing = rows.filter((r) => r.status !== "de-creat" && !paths.has(r.targetUrl)).map((r) => `${r.keyword} → ${r.targetUrl}`);
    expect(missing).toEqual([]);
  });

  it("paginile „de-creat” sunt articolele plănuite și nu există încă", () => {
    const planned = new Set(PLANNED_GUIDES.map((g) => `/ghid/${g.slug}`));
    for (const r of rows.filter((x) => x.status === "de-creat")) {
      expect(planned.has(r.targetUrl), r.targetUrl).toBe(true);
      expect(paths.has(r.targetUrl), r.targetUrl).toBe(false);
    }
    expect(PLANNED_GUIDES).toHaveLength(41);
  });

  it("o pagină țintă nu primește cuvinte din grupe diferite (fără canibalizare)", () => {
    const byUrl = new Map<string, Set<string>>();
    for (const r of rows) byUrl.set(r.targetUrl, (byUrl.get(r.targetUrl) ?? new Set()).add(r.cluster));
    expect([...byUrl].filter(([, c]) => c.size > 1).map(([u, c]) => `${u}: ${[...c].join(", ")}`)).toEqual([]);
  });

  it("nu promite carte tipărită și nu inventează volume", () => {
    const csv = toCsv(rows);
    expect(csv).not.toMatch(/tipărit[ăa]|livrare|volum/i);
    expect(csv.split("\n")[0]).toBe("keyword,cluster,intent,sezon,prioritate,targetUrl,status");
  });

  it("CSV-ul din repo e la zi", () => {
    expect(readFileSync("src/data/seo-keywords.csv", "utf8")).toBe(toCsv(rows));
  });
});

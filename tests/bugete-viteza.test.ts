import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { BUDGET_PAGES, CONTENT_BUDGET, HOME_BUDGET, overBudget } from "@/lib/seo/bugete";
import { sitemapGroups } from "@/lib/continut/sitemap";

/** Planul SEO, secțiunea 10: bugetele de viteză și proba care le verifică. */
describe("bugetele de viteză", () => {
  it("are pragurile bune ale Google și 120 KB HTML pe paginile de conținut", () => {
    expect(CONTENT_BUDGET).toEqual({ lcpMs: 2500, cls: 0.1, tbtMs: 200, htmlKb: 120 });
    expect(HOME_BUDGET.htmlKb).toBeGreaterThan(CONTENT_BUDGET.htmlKb);
  });

  it("verifică prima pagină și 6 pagini tipice, toate din sitemap", () => {
    expect(BUDGET_PAGES).toHaveLength(7);
    const all = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
    for (const p of BUDGET_PAGES) expect(all.has(p.path), p.path).toBe(true);
  });

  it("spune pe înțeles ce e peste buget", () => {
    expect(overBudget({ path: "/", lcpMs: 1200, cls: 0.02, tbtMs: 50, htmlKb: 80 }, CONTENT_BUDGET)).toEqual([]);
    expect(overBudget({ path: "/", lcpMs: 3100, cls: 0.25, tbtMs: 420, htmlKb: 130 }, CONTENT_BUDGET)).toEqual([
      "LCP 3,1 s, peste 2,5 s", "CLS 0.25, peste 0.1", "TBT 420 ms, peste 200 ms", "HTML 130 KB, peste 120 KB",
    ]);
    expect(overBudget({ path: "/", lcpMs: null, cls: 0, tbtMs: 0, htmlKb: 10 }, CONTENT_BUDGET)).toEqual(["LCP nemăsurat"]);
  });

  it("proba rulează săptămânal pe site-ul live", () => {
    expect(existsSync("scripts/bugete-viteza.ts")).toBe(true);
    const wf = readFileSync(".github/workflows/bugete-viteza.yml", "utf8");
    expect(wf).toContain("scripts/bugete-viteza.ts");
    expect(wf).toContain("schedule:");
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { loadDrafts } from "@/lib/continut/ciorne";
import { PLANNED_GUIDES } from "@/data/seo-keywords";
import versiuni from "@/data/seo-versiuni.json";

/** Ciornele de ghiduri: rămân nepublicate până le aprobă Daniel, dar trebuie să fie gata de publicat (planul SEO, secțiunea 11). */
const drafts = loadDrafts();
const live = new Set(["/", ...Object.keys(versiuni as Record<string, string>)]);
const PRICE = /\b\d+\s*(lei|€|euro)\b|\bRON\b/i;
const PRINT = /carte tipărită|cartea tipărită|gata de tipărit|livrare/i;
const SENSITIVE = /\bAI\b|inteligență artificială|ChatGPT|Claude/;

describe("ciornele de ghiduri", () => {
  it("există primele 6 și fiecare e în lista de ghiduri planificate", () => {
    expect(drafts.length).toBeGreaterThanOrEqual(6);
    const planned = new Set(PLANNED_GUIDES.map((g) => g.slug));
    expect(drafts.map((d) => d.slug).filter((s) => !planned.has(s))).toEqual([]);
  });
  it("nu sunt publice: nu apar în sitemap și nici în content/ghid", () => {
    for (const d of drafts) {
      expect(live.has(`/ghid/${d.slug}`)).toBe(false);
      expect(() => readFileSync(`content/ghid/${d.slug}.md`)).toThrow();
    }
    expect(readFileSync("src/app/sitemap.xml/route.ts", "utf8")).not.toContain("ciorne");
  });
  it("au antet complet, cuvânt țintă, 1.000+ cuvinte, 4–6 întrebări frecvente și surse", () => {
    for (const d of drafts) {
      expect(d.title && d.description && d.keyword, d.slug).toBeTruthy();
      expect(d.seoTitle.length, d.slug).toBeLessThanOrEqual(60);
      expect(d.description.length, d.slug).toBeLessThanOrEqual(170);
      expect(d.words, d.slug).toBeGreaterThanOrEqual(1000);
      expect(d.faq, d.slug).toBeGreaterThanOrEqual(4);
      expect(d.faq, d.slug).toBeLessThanOrEqual(6);
      expect(d.sources, d.slug).toBe(true);
    }
  });
  it("legăturile interne, ghidurile legate și termenii duc la pagini existente", () => {
    const bad: string[] = [];
    for (const d of drafts) {
      const src = readFileSync(`content/ciorne/ghid/${d.slug}.md`, "utf8");
      for (const m of src.matchAll(/\]\((\/[^)\s#?]*)/g)) if (!live.has(m[1].replace(/\/$/, "") || "/")) bad.push(`${d.slug} → ${m[1]}`);
      for (const r of d.related) if (!live.has(`/ghid/${r}`)) bad.push(`${d.slug} related ${r}`);
      for (const t of d.terms) if (!live.has(`/glosar/${t}`)) bad.push(`${d.slug} term ${t}`);
    }
    expect(bad).toEqual([]);
  });
  it("fără prețuri scrise de mână, fără carte tipărită, fără unelte de scris", () => {
    for (const d of drafts) {
      const src = readFileSync(`content/ciorne/ghid/${d.slug}.md`, "utf8");
      expect(src, d.slug).not.toMatch(PRICE);
      expect(src, d.slug).not.toMatch(PRINT);
      expect(src, d.slug).not.toMatch(SENSITIVE);
    }
  });
});

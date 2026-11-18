import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { list, parseBlocks, parseFrontmatter, plainText, type Block } from "./markdown";

/**
 * Ciornele de ghiduri (planul SEO, secțiunea 11): articolele noi stau în content/ciorne/ghid până le aprobă Daniel. Nu sunt
 * citite de loadCollection, deci nu au pagină publică, nu intră în sitemap, în căutare sau în legături. Se citesc doar în
 * Admin → SEO → Ciorne. Publicarea = mutarea fișierului în content/ghid (cu `updated` pus la ziua publicării).
 * Antetul e același ca la ghiduri (title, seo, description, category, related, terms), plus `cuvant` (căutarea țintă).
 */
const DIR = path.join(process.cwd(), "content", "ciorne", "ghid");

export type Draft = {
  slug: string; title: string; seoTitle: string; description: string; category: string; keyword: string;
  related: string[]; terms: string[]; blocks: Block[]; words: number; faq: number; sources: boolean;
};

export function loadDrafts(): Draft[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith(".md")).sort().map((f): Draft => {
    const { data, body } = parseFrontmatter(readFileSync(path.join(DIR, f), "utf8"));
    const blocks = parseBlocks(body);
    const faqAt = blocks.findIndex((b) => b.t === "h2" && /întrebări frecvente/i.test(b.v));
    const faqEnd = faqAt < 0 ? -1 : blocks.findIndex((b, i) => i > faqAt && b.t === "h2");
    return {
      slug: f.replace(/\.md$/, ""), title: data.title ?? f, seoTitle: data.seo ?? data.title ?? f, description: data.description ?? "",
      category: data.category ?? "Altele", keyword: data.cuvant ?? "", related: list(data.related), terms: list(data.terms),
      blocks, words: plainText(blocks).split(/\s+/).filter(Boolean).length,
      faq: faqAt < 0 ? 0 : blocks.slice(faqAt + 1, faqEnd < 0 ? undefined : faqEnd).filter((b) => b.t === "h3").length,
      sources: blocks.some((b) => b.t === "h2" && /^surse/i.test(b.v)),
    };
  });
}

export const getDraft = (slug: string) => loadDrafts().find((d) => d.slug === slug) ?? null;

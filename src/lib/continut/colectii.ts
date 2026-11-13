import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { list, parseBlocks, parseFrontmatter, plainText, type Block } from "./markdown";

/**
 * Ghidurile (content/ghid) și glosarul (content/glosar): câte un fișier .md, scris de mână și păstrat în repo, citit la
 * publicare. Antetul fiecărui fișier:
 *   title       – titlul de pe pagină (H1); la glosar, termenul
 *   seo         – titlul pentru Google (opțional; altfel se face din title)
 *   description – descrierea pentru Google și pentru previzualizarea linkului (70–160 de caractere)
 *   updated     – data ultimei schimbări (AAAA-LL-ZZ), pusă în sitemap și în datele Article
 *   published   – data primei publicări (opțional, altfel = updated)
 *   related     – alte ghiduri, după adresă (slug), despărțite prin virgulă
 *   terms       – termeni din glosar, după adresă
 *   alt         – (glosar) alte forme ale termenului
 *   category    – (ghid) grupa din lista de ghiduri
 */
export type Collection = "ghid" | "glosar";
export type Entry = {
  collection: Collection; slug: string; path: string;
  title: string; seoTitle: string; description: string;
  updated: Date; published: Date; related: string[]; terms: string[]; alt: string[]; category: string;
  blocks: Block[]; words: number;
};

const DIR = (c: Collection) => path.join(process.cwd(), "content", c);
const SUFFIX = " | Cartea Neamului";
const cache = new Map<Collection, Entry[]>();

function seoTitle(c: Collection, title: string, seo?: string): string {
  if (seo) return seo.endsWith(SUFFIX) ? seo : `${seo}${SUFFIX}`;
  return c === "glosar" ? `${title}: ce înseamnă în genealogie${SUFFIX}` : `${title}${SUFFIX}`;
}

export function loadCollection(c: Collection): Entry[] {
  const hit = cache.get(c);
  if (hit) return hit;
  const entries = readdirSync(DIR(c)).filter((f) => f.endsWith(".md")).map((f): Entry => {
    const slug = f.replace(/\.md$/, "");
    const { data, body } = parseFrontmatter(readFileSync(path.join(DIR(c), f), "utf8"));
    const blocks = parseBlocks(body);
    const updated = new Date(`${data.updated ?? "2026-11-13"}T00:00:00Z`);
    return {
      collection: c, slug, path: `/${c}/${slug}`,
      title: data.title ?? slug, seoTitle: seoTitle(c, data.title ?? slug, data.seo), description: data.description ?? "",
      updated, published: data.published ? new Date(`${data.published}T00:00:00Z`) : updated,
      related: list(data.related), terms: list(data.terms), alt: list(data.alt), category: data.category ?? "Altele",
      blocks, words: plainText(blocks).split(/\s+/).filter(Boolean).length,
    };
  });
  entries.sort((a, b) => a.title.localeCompare(b.title, "ro"));
  cache.set(c, entries);
  return entries;
}

export const getEntry = (c: Collection, slug: string) => loadCollection(c).find((e) => e.slug === slug) ?? null;
export const lastUpdated = (entries: { updated: Date }[]) => new Date(Math.max(0, ...entries.map((e) => e.updated.getTime())));

/** Ghidurile și termenii care trimit la o pagină (legături înapoi, ca fiecare pagină să fie legată din mai multe locuri). */
export function backlinks(target: string): Entry[] {
  return [...loadCollection("ghid"), ...loadCollection("glosar")].filter((e) => e.path !== target &&
    (e.related.some((s) => `/ghid/${s}` === target) || e.terms.some((s) => `/glosar/${s}` === target)));
}

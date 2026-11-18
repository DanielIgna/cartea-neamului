import type { AuditPage } from "@/lib/seo-audit";

/**
 * Legăturile interne și lista „De cerut indexare” (planul SEO, Admin SEO, 18.11.2026).
 *
 * Legăturile: scripts/seo-legaturi.ts deschide fiecare pagină din sitemap pe site-ul pornit local, numără legăturile din corpul
 * paginii (fără meniul de sus și subsol, care sunt pe toate paginile) și scrie src/data/seo-legaturi.json. Admin → SEO → Indexare
 * arată paginile orfane (nicio pagină nu le leagă) și pe cele slab legate. Pe site nu se calculează nimic.
 */

export type LinkStat = { in: number; out: number; from: string[] };
export type LinkData = { generated: string; pages: Record<string, LinkStat> };

const LOCALE_PREFIX = /^\/(en|en-us|fr|es|nl|de|it|hu|he)(\/|$)/;
const SITE_HOSTS = ["carteaneamului.ro", "localhost"];

/** Adresa internă curată (fără domeniu, ? sau #, fără / la final) sau null pentru legăturile spre alte site-uri și fișiere. */
export function internalPath(href: string): string | null {
  let h = href.trim().replace(/&amp;/g, "&");
  if (!h || h.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(h)) return null;
  const abs = h.match(/^https?:\/\/([^/:]+)(?::\d+)?(\/[^]*)?$/i);
  if (abs) {
    if (!SITE_HOSTS.includes(abs[1].toLowerCase().replace(/^www\./, ""))) return null;
    h = abs[2] ?? "/";
  }
  if (!h.startsWith("/") || h.startsWith("//")) return null;
  const p = h.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (/\.(pdf|png|jpe?g|svg|webp|xml|txt|csv|ics|ico)$/i.test(p) || p.startsWith("/api/") || p.startsWith("/_next/")) return null;
  return p;
}

/** Legăturile interne din corpul paginii, fără <header>, <footer> și legăturile spre pagina însăși. */
export function bodyLinks(html: string, self: string): string[] {
  const body = html.replace(/<header[\s\S]*?<\/header>/gi, "").replace(/<footer[\s\S]*?<\/footer>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "");
  const out = new Set<string>();
  for (const m of body.matchAll(/<a\b[^>]*?\shref=("([^"]*)"|'([^']*)')/gi)) {
    const p = internalPath(m[2] ?? m[3] ?? "");
    if (p && p !== self) out.add(p);
  }
  return [...out];
}

/** Paginile următoare ale unui hub împărțit în pagini („/nume?pagina=2”): legăturile lor se socotesc la hub. */
export function pagingLinks(html: string, self: string): string[] {
  const esc = self.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...new Set([...html.matchAll(new RegExp(`href="(${esc}\\?pagina=\\d+)"`, "g"))].map((m) => m[1]))];
}

/** Din legăturile fiecărei pagini (pagină → spre ce leagă): câte legături primește fiecare pagină și de la cine (primele 3). */
export function linkStats(outLinks: Map<string, string[]>): Record<string, LinkStat> {
  const res: Record<string, LinkStat> = {};
  for (const [p, links] of outLinks) res[p] = { in: 0, out: links.length, from: [] };
  for (const [from, links] of [...outLinks].sort(([a], [b]) => a.localeCompare(b))) for (const to of links) {
    const s = res[to];
    if (!s) continue;
    s.in++;
    if (s.from.length < 3) s.from.push(from);
  }
  return res;
}

/** Paginile indexabile pe care nu le leagă nicio altă pagină (orfane) și cele cu 1–2 legături (slab legate). */
export function linkReport(data: LinkData | null, pages: AuditPage[]) {
  if (!data) return null;
  // Paginile traduse (/en/contact…) le găsește Google prin hreflang, nu prin legături: nu le socotim orfane.
  const idx = pages.filter((p) => p.indexable && p.inSitemap && p.path !== "/" && !(LOCALE_PREFIX.test(p.path) && p.cluster.key !== "diaspora"));
  const known = idx.filter((p) => data.pages[p.path]);
  return {
    generated: data.generated,
    measured: known.length,
    missing: idx.length - known.length,
    orphans: known.filter((p) => data.pages[p.path].in === 0),
    weak: known.filter((p) => data.pages[p.path].in > 0 && data.pages[p.path].in < 3),
  };
}

/** Ordinea grupelor la cererea de indexare: întâi ce aduce conturi sau e în sezon, apoi paginile de ajutor, apoi restul. */
const CLUSTER_ORDER = ["cadouri", "pagini", "unelte", "scoala", "ghid", "genealogie", "glosar", "nume", "localitati", "diaspora", "autoritate"];
const rank = (p: AuditPage) => {
  const i = CLUSTER_ORDER.indexOf(p.cluster.key);
  return i < 0 ? CLUSTER_ORDER.length : i;
};
const FIRST = ["/", "/cadou-de-sarbatori"];
const isHub = (p: AuditPage) => FIRST.includes(p.path) ? 2 : p.category === "hub" || /^\/(cadouri|unelte|genealogie|scoala|ghid|glosar|nume|localitati)$/.test(p.path) ? 1 : 0;

/**
 * „De cerut indexare”: primele 15 pagini indexabile din sitemap care nu apar încă în Google (fără afișări în perioada aleasă;
 * dacă Search Console nu e legat, toate contează). Hubul înaintea paginilor lui, apoi după grupă și după data schimbării.
 * Google primește cam 10 cereri pe zi în Inspectarea adresei, de aceea lista e scurtă.
 */
export function indexRequests(pages: AuditPage[], o: { gscPages?: Map<string, { impressions: number }>; lastmod: (path: string) => Date | null; limit?: number }): (AuditPage & { lastmod: Date | null })[] {
  return pages
    .filter((p) => p.indexable && p.inSitemap && p.cluster.indexable && !(o.gscPages?.get(p.path)?.impressions))
    .filter((p) => !LOCALE_PREFIX.test(p.path) || p.cluster.key === "diaspora")
    .map((p) => ({ ...p, lastmod: o.lastmod(p.path) }))
    .sort((a, b) => isHub(b) - isHub(a) || FIRST.indexOf(a.path) - FIRST.indexOf(b.path) || rank(a) - rank(b) || (b.lastmod?.getTime() ?? 0) - (a.lastmod?.getTime() ?? 0) || a.path.localeCompare(b.path))
    .slice(0, o.limit ?? 15);
}

/** Legătura spre Inspectarea adresei din Search Console, pentru cererea de indexare. */
export const inspectLink = (url: string, property = "sc-domain:carteaneamului.ro") =>
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(property)}&id=${encodeURIComponent(url)}`;

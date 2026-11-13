import { PUBLIC_PAGES } from "@/lib/public-pages";
import { PRIVACY_DATE, TERMS_DATE } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-url";
import { lastUpdated, loadCollection } from "@/lib/continut/colectii";

/**
 * Harta site-ului (sitemap.xml). Cât timp are câteva sute de adrese e un singur fișier; peste INDEX_LIMIT devine un index
 * care trimite la câte un fișier pe secțiune (/sitemaps/pagini.xml, /sitemaps/ghid.xml…), fiecare cu data ultimei schimbări.
 * robots.txt arată tot spre /sitemap.xml, deci nu se schimbă.
 */
export const INDEX_LIMIT = 300;

export type SitemapUrl = { path: string; lastModified: Date; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number };
export type SitemapGroup = { name: string; label: string; urls: SitemapUrl[] };

/** Când s-a publicat ultima versiune a site-ului; textele legale au data lor. */
const BUILT_AT = new Date();
const LAST_MODIFIED: Record<string, Date> = { "/confidentialitate": PRIVACY_DATE, "/termeni": TERMS_DATE };

function collectionGroup(c: "ghid" | "glosar", label: string): SitemapGroup {
  const entries = loadCollection(c);
  return {
    name: c, label,
    urls: [
      { path: `/${c}`, lastModified: lastUpdated(entries), changeFrequency: "weekly", priority: 0.6 },
      ...entries.map((e): SitemapUrl => ({ path: e.path, lastModified: e.updated, changeFrequency: "monthly", priority: c === "ghid" ? 0.5 : 0.4 })),
    ],
  };
}

export function sitemapGroups(): SitemapGroup[] {
  return [
    { name: "pagini", label: "Paginile principale", urls: PUBLIC_PAGES.map((p) => ({ path: p.path, lastModified: LAST_MODIFIED[p.path] ?? BUILT_AT, changeFrequency: p.changeFrequency, priority: p.priority })) },
    collectionGroup("ghid", "Ghiduri"),
    collectionGroup("glosar", "Glosar"),
  ];
}

const abs = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const iso = (d: Date) => d.toISOString();

export function urlsetXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) =>
    `<url>\n<loc>${esc(abs(u.path))}</loc>\n<lastmod>${iso(u.lastModified)}</lastmod>\n<changefreq>${u.changeFrequency}</changefreq>\n<priority>${u.priority}</priority>\n</url>`).join("\n")}\n</urlset>\n`;
}

export function indexXml(groups: SitemapGroup[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${groups.map((g) =>
    `<sitemap>\n<loc>${esc(`${SITE_URL}/sitemaps/${g.name}.xml`)}</loc>\n<lastmod>${iso(lastUpdated(g.urls.map((u) => ({ updated: u.lastModified }))))}</lastmod>\n</sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

/** /sitemap.xml: un singur fișier sau indexul, după numărul de adrese. */
export function mainSitemapXml(groups = sitemapGroups()): string {
  const all = groups.flatMap((g) => g.urls);
  return all.length > INDEX_LIMIT ? indexXml(groups) : urlsetXml(all);
}

export const xmlResponse = (body: string) => new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });

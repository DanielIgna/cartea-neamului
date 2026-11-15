import { LOCALES, localizedPath } from "@/i18n/locales";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { PRIVACY_DATE, TERMS_DATE } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-url";
import { lastUpdated, loadCollection } from "@/lib/continut/colectii";
import { NAMES_UPDATED, loadNames } from "@/lib/continut/nume";
import { nameGate, uatGate } from "@/lib/continut/prag";
import { UATS_UPDATED, loadUats, uatPath } from "@/lib/continut/uat";
import { COUNTIES_UPDATED, countyPath, loadCounties, seatPath } from "@/lib/continut/localitati";

/**
 * Harta site-ului (sitemap.xml). Cât timp are câteva sute de adrese e un singur fișier; peste INDEX_LIMIT devine un index
 * care trimite la câte un fișier pe secțiune (/sitemaps/pagini.xml, /sitemaps/ghid.xml…), fiecare cu data ultimei schimbări.
 * robots.txt arată tot spre /sitemap.xml, deci nu se schimbă.
 */
export const INDEX_LIMIT = 300;

export type SitemapUrl = {
  path: string; lastModified: Date; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number;
  /** Aceeași pagină în celelalte limbi (hreflang → adresă), pentru paginile traduse. */
  alternates?: Record<string, string>;
};
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

/**
 * Paginile principale în celelalte limbi (/en/contact, /it, /he/termeni…), fiecare cu toate variantele ei (hreflang), plus
 * româna ca „x-default”. Ghidurile, glosarul, numele și localitățile sunt încă doar în română, așa că nu intră aici.
 */
function languagesGroup(): SitemapGroup {
  const alt = (path: string) => {
    const a: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [l, localizedPath(path, l)]));
    a["x-default"] = path;
    return a;
  };
  return {
    name: "limbi", label: "Paginile principale în celelalte limbi",
    urls: LOCALES.filter((l) => l !== "ro").flatMap((l) => PUBLIC_PAGES.map((p): SitemapUrl => ({
      path: localizedPath(p.path, l), lastModified: LAST_MODIFIED[p.path] ?? BUILT_AT, changeFrequency: p.changeFrequency,
      priority: Math.round(p.priority * 8) / 10, alternates: alt(p.path),
    }))),
  };
}

export function sitemapGroups(): SitemapGroup[] {
  return [
    { name: "pagini", label: "Paginile principale", urls: PUBLIC_PAGES.map((p) => ({ path: p.path, lastModified: LAST_MODIFIED[p.path] ?? BUILT_AT, changeFrequency: p.changeFrequency, priority: p.priority })) },
    collectionGroup("ghid", "Ghiduri"),
    collectionGroup("glosar", "Glosar"),
    {
      name: "nume", label: "Nume de familie",
      urls: [
        { path: "/nume", lastModified: NAMES_UPDATED, changeFrequency: "weekly", priority: 0.6 },
        ...loadNames().filter((n) => !nameGate(n)).map((n): SitemapUrl => ({ path: `/nume/${n.slug}`, lastModified: NAMES_UPDATED, changeFrequency: "monthly", priority: 0.4 })),
      ],
    },
    languagesGroup(),
    {
      name: "localitati", label: "Localități",
      urls: [
        { path: "/localitati", lastModified: COUNTIES_UPDATED, changeFrequency: "weekly", priority: 0.6 },
        ...loadCounties().flatMap((c): SitemapUrl[] => [
          { path: countyPath(c), lastModified: COUNTIES_UPDATED, changeFrequency: "monthly", priority: 0.5 },
          ...(seatPath(c) ? [{ path: seatPath(c)!, lastModified: UATS_UPDATED, changeFrequency: "monthly" as const, priority: 0.4 }] : []),
        ]),
        // Comunele, orașele și municipiile peste prag (src/lib/continut/prag.ts); reședințele sunt deja mai sus.
        ...loadUats().filter((u) => !uatGate(u) && uatPath(u) !== seatPath(loadCounties().find((c) => c.slug === u.countySlug)!))
          .map((u): SitemapUrl => ({ path: uatPath(u), lastModified: UATS_UPDATED, changeFrequency: "monthly", priority: u.kind === "c" ? 0.3 : 0.4 })),
      ],
    },
  ];
}

const abs = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Data ultimei schimbări, niciodată în viitor (o dată din viitor îl face pe Google să nu mai creadă datele din sitemap). */
const iso = (d: Date) => new Date(Math.min(d.getTime(), Date.now())).toISOString();

export function urlsetXml(urls: SitemapUrl[]): string {
  const xhtml = urls.some((u) => u.alternates) ? ` xmlns:xhtml="http://www.w3.org/1999/xhtml"` : "";
  const links = (u: SitemapUrl) => Object.entries(u.alternates ?? {}).map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(p))}"/>\n`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}>\n${urls.map((u) =>
    `<url>\n<loc>${esc(abs(u.path))}</loc>\n${links(u)}<lastmod>${iso(u.lastModified)}</lastmod>\n<changefreq>${u.changeFrequency}</changefreq>\n<priority>${u.priority}</priority>\n</url>`).join("\n")}\n</urlset>\n`;
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

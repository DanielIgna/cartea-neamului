import { LOCALES, localizedPath, withRegionalHreflang } from "@/i18n/locales";
import { PUBLIC_PAGES, TRANSLATED_PAGES, pageLocales } from "@/lib/public-pages";
import { PRIVACY_DATE, TERMS_DATE } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-url";
import { lastUpdated, loadCollection } from "@/lib/continut/colectii";
import { images } from "@/lib/continut/markdown";
import { NAMES_UPDATED, loadNames } from "@/lib/continut/nume";
import { nameGate, uatGate } from "@/lib/continut/prag";
import { UATS_UPDATED, loadUats, uatPath } from "@/lib/continut/uat";
import { GEN_CITIES, GEN_HUB, GEN_MIN_WORDS, GEN_UPDATED, genCityPath, genWords } from "@/lib/genealogie-orase";
import { GEN_REGIONS, REGIONS_UPDATED, genRegionPath } from "@/lib/genealogie-regiuni";
import { COUNTIES_UPDATED, countyPath, loadCounties, seatPath } from "@/lib/continut/localitati";
import { SCHOOL_PAGES, SCHOOL_UPDATED } from "@/lib/scoala";
import { GIFTS_HUB, GIFTS_UPDATED, GIFT_PAGES, giftPath } from "@/lib/cadouri";
import { KIN_PAGES, TOOLS_HUB, TOOLS_UPDATED, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { TOOLS, toolPath } from "@/lib/unelte/unelte";
import { AUTHORITY_PAGES, AUTHORITY_UPDATED } from "@/lib/autoritate";
import { lastmodOf } from "@/lib/seo/versiuni";
import { DIASPORA_UPDATED, HUB_LANGS, LOCALES_OF, alternatesFor, entries as diasporaEntries } from "@/lib/diaspora";

/**
 * Harta site-ului (sitemap.xml). Cât timp are câteva sute de adrese e un singur fișier; peste INDEX_LIMIT devine un index
 * care trimite la câte un fișier pe secțiune (/sitemaps/pagini.xml, /sitemaps/ghid.xml…), fiecare cu data ultimei schimbări.
 * robots.txt arată tot spre /sitemap.xml, deci nu se schimbă.
 */
export const INDEX_LIMIT = 300;

/**
 * `lastModified`: data ultimei schimbări reale (src/lib/seo/versiuni.ts). `changeFrequency` și `priority` rămân doar pentru
 * ordinea din Admin; nu mai intră în XML, Google nu le folosește (planul SEO, 18.11.2026).
 */
export type SitemapUrl = {
  path: string; lastModified: Date; changeFrequency?: "weekly" | "monthly" | "yearly"; priority?: number;
  /** Aceeași pagină în celelalte limbi (hreflang → adresă), pentru paginile traduse. */
  alternates?: Record<string, string>;
  /** Imaginile paginii (adrese de pe site), pentru Google Imagini. */
  images?: string[];
};
export type SitemapGroup = { name: string; label: string; urls: SitemapUrl[] };

/**
 * Data de rezervă a paginilor principale, doar pentru o adresă care încă nu e în src/data/seo-versiuni.json (nu ora generării,
 * care se schimba la fiecare cerere); textele legale au data lor.
 */
const PAGES_FALLBACK = new Date("2026-11-18T00:00:00Z");
const LAST_MODIFIED: Record<string, Date> = { "/confidentialitate": PRIVACY_DATE, "/termeni": TERMS_DATE };

function collectionGroup(c: "ghid" | "glosar", label: string): SitemapGroup {
  const entries = loadCollection(c);
  return {
    name: c, label,
    urls: [
      { path: `/${c}`, lastModified: lastUpdated(entries), changeFrequency: "weekly", priority: 0.6 },
      ...entries.map((e): SitemapUrl => {
        const img = images(e.blocks).map((x) => x.src);
        return { path: e.path, lastModified: e.updated, changeFrequency: "monthly", priority: c === "ghid" ? 0.5 : 0.4, ...(img.length ? { images: img } : {}) };
      }),
    ],
  };
}

/**
 * Paginile principale în celelalte limbi (/en/contact, /it, /he/termeni…), fiecare cu toate variantele ei (hreflang), plus
 * româna ca „x-default”. Ghidurile, glosarul, numele și localitățile sunt încă doar în română, așa că nu intră aici.
 */
function languagesGroup(): SitemapGroup {
  const alt = (path: string) => {
    const a: Record<string, string> = Object.fromEntries(pageLocales(path).map((l) => [l, localizedPath(path, l)]));
    a["x-default"] = path;
    return withRegionalHreflang(a);
  };
  return {
    name: "limbi", label: "Paginile principale în celelalte limbi",
    urls: LOCALES.filter((l) => l !== "ro").flatMap((l) => TRANSLATED_PAGES.filter((p) => pageLocales(p.path).includes(l)).map((p): SitemapUrl => ({
      path: localizedPath(p.path, l), lastModified: LAST_MODIFIED[p.path] ?? PAGES_FALLBACK, changeFrequency: p.changeFrequency,
      priority: Math.round(p.priority * 8) / 10, alternates: alt(p.path),
    }))),
  };
}

/**
 * Paginile pentru diaspora, câte un fișier pe limbă (Daniel, 15.11.2026: „sitemap pe limbă”): /sitemaps/diaspora-ro.xml,
 * diaspora-en.xml, diaspora-it.xml… Fiecare pagină apare în limbile în care e scrisă, cu toate variantele ei (hreflang);
 * statele și provinciile fără text propriu nu intră.
 */
function diasporaGroups(): SitemapGroup[] {
  return HUB_LANGS.map((lang) => ({
    name: `diaspora-${lang}`, label: `Diaspora (${lang})`,
    urls: diasporaEntries().filter((e) => e.indexable && e.langs.includes(lang)).flatMap((e) => LOCALES_OF[lang].map((loc): SitemapUrl => ({
      path: localizedPath(e.path, loc), lastModified: DIASPORA_UPDATED, changeFrequency: "monthly",
      priority: e.kind === "hub" ? 0.6 : e.kind === "region" ? 0.4 : 0.5, alternates: alternatesFor(e.path, e.langs),
    }))),
  })).filter((g) => g.urls.length);
}

/**
 * `published`: comunele publicate de motorul SEO (adresa → data ultimei schimbări), citite din bază de rutele sitemap-ului.
 * Fără el (teste, Centrul SEO), comunele nu apar: intră doar cele publicate.
 */
export function sitemapGroups(published: Map<string, Date> = new Map(), shop: SitemapUrl[] = []): SitemapGroup[] {
  // Comunele publicate de motorul SEO și modelele de invitații au data lor din bază; restul, data din src/data/seo-versiuni.json.
  const own = new Set(shop.map((u) => u.path));
  return rawGroups(published, shop).map((g) => ({ ...g, urls: g.urls.map((u) => (published.has(u.path) || own.has(u.path) ? u : { ...u, lastModified: lastmodOf(u.path, u.lastModified) })) }));
}

/** Grupele, cu datele de rezervă (fără src/data/seo-versiuni.json); scripts/seo-versiuni.ts pornește de la ele. */
export function rawGroups(published: Map<string, Date> = new Map(), shop: SitemapUrl[] = []): SitemapGroup[] {
  return [
    // `shop`: modelele de invitații de nuntă publicate din Admin (src/lib/invitatii-nunta-sitemap.ts), citite din bază de rutele sitemap-ului.
    { name: "pagini", label: "Paginile principale", urls: [...PUBLIC_PAGES.map((p) => ({ path: p.path, lastModified: LAST_MODIFIED[p.path] ?? PAGES_FALLBACK, changeFrequency: p.changeFrequency, priority: p.priority })), ...shop] },
    collectionGroup("ghid", "Ghiduri"),
    collectionGroup("glosar", "Glosar"),
    {
      name: "nume", label: "Nume de familie",
      urls: [
        { path: "/nume", lastModified: NAMES_UPDATED, changeFrequency: "weekly", priority: 0.6 },
        ...loadNames().filter((n) => !nameGate(n)).map((n): SitemapUrl => ({ path: `/nume/${n.slug}`, lastModified: NAMES_UPDATED, changeFrequency: "monthly", priority: 0.4 })),
      ],
    },
    {
      // Pentru școli (/scoala): pagina profesorilor și cele trei pe clase.
      name: "scoala", label: "Pentru școli",
      urls: SCHOOL_PAGES.map((p): SitemapUrl => ({ path: p.path, lastModified: SCHOOL_UPDATED, changeFrequency: "monthly", priority: p.path === "/scoala" ? 0.7 : 0.6 })),
    },
    {
      // Cadourile pe ocazii și persoane (src/lib/cadouri.ts); Crăciunul e /cadou-de-sarbatori, în „pagini”.
      name: "cadouri", label: "Cadouri",
      urls: [GIFTS_HUB, ...GIFT_PAGES.map(giftPath)].map((path): SitemapUrl => ({ path, lastModified: GIFTS_UPDATED })),
    },
    {
      // Uneltele gratuite și paginile despre rude (src/lib/unelte).
      name: "unelte", label: "Unelte gratuite",
      urls: [
        ...[TOOLS_HUB, ...TOOLS.map(toolPath)].map((path): SitemapUrl => ({ path, lastModified: TOOLS_UPDATED })),
        ...KIN_PAGES.map((p): SitemapUrl => ({ path: kinPagePath(p), lastModified: TOOLS_UPDATED, ...(p.image ? { images: [p.image.src] } : {}) })),
      ],
    },
    {
      // Presă și widgetul gratuit (src/lib/autoritate.ts).
      name: "autoritate", label: "Presă și widget",
      urls: AUTHORITY_PAGES.map((p): SitemapUrl => ({ path: p.path, lastModified: AUTHORITY_UPDATED, changeFrequency: "monthly", priority: 0.5 })),
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
        ...loadUats().filter((u) => !uatGate(u, () => published.has(uatPath(u))) && uatPath(u) !== seatPath(loadCounties().find((c) => c.slug === u.countySlug)!))
          .map((u): SitemapUrl => ({ path: uatPath(u), lastModified: (u.kind === "c" ? published.get(uatPath(u)) : null) ?? UATS_UPDATED, changeFrequency: "monthly", priority: u.kind === "c" ? 0.3 : 0.4 })),
      ],
    },
    {
      // Orașele mari din România (src/lib/genealogie-orase.ts); doar cele peste pragul de cuvinte proprii.
      name: "genealogie", label: "Genealogie pe orașe",
      urls: [
        { path: GEN_HUB, lastModified: GEN_UPDATED, changeFrequency: "monthly", priority: 0.5 },
        ...GEN_CITIES.filter((c) => genWords(c) >= GEN_MIN_WORDS).map((c): SitemapUrl => ({ path: genCityPath(c), lastModified: GEN_UPDATED, changeFrequency: "monthly", priority: 0.5 })),
        // Regiunile istorice (src/lib/genealogie-regiuni.ts).
        ...GEN_REGIONS.map((r): SitemapUrl => ({ path: genRegionPath(r), lastModified: REGIONS_UPDATED, changeFrequency: "monthly", priority: 0.6 })),
      ],
    },
    ...diasporaGroups(),
  ];
}

const abs = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Data ultimei schimbări, niciodată în viitor (o dată din viitor îl face pe Google să nu mai creadă datele din sitemap). */
const iso = (d: Date) => new Date(Math.min(d.getTime(), Date.now())).toISOString();

export function urlsetXml(urls: SitemapUrl[]): string {
  const xhtml = urls.some((u) => u.alternates) ? ` xmlns:xhtml="http://www.w3.org/1999/xhtml"` : "";
  const image = urls.some((u) => u.images?.length) ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : "";
  const links = (u: SitemapUrl) => Object.entries(u.alternates ?? {}).map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(p))}"/>\n`).join("");
  const imgs = (u: SitemapUrl) => (u.images ?? []).map((s) => `<image:image><image:loc>${esc(abs(s))}</image:loc></image:image>\n`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}${image}>\n${urls.map((u) =>
    `<url>\n<loc>${esc(abs(u.path))}</loc>\n${links(u)}${imgs(u)}<lastmod>${iso(u.lastModified)}</lastmod>\n</url>`).join("\n")}\n</urlset>\n`;
}

/** Grupele de diaspora (câte una pe limbă) intră în index ca un singur fișier, /sitemap-diaspora.xml (Daniel, 17.11.2026). */
export const isDiasporaGroup = (g: SitemapGroup) => g.name.startsWith("diaspora-");
export const DIASPORA_SITEMAP = "/sitemap-diaspora.xml";
/** Toate adresele de diaspora, din toate limbile, fără dubluri (pentru /sitemap-diaspora.xml). */
export function diasporaSitemapUrls(groups: SitemapGroup[] = sitemapGroups()): SitemapUrl[] {
  const seen = new Set<string>();
  return groups.filter(isDiasporaGroup).flatMap((g) => g.urls).filter((u) => !seen.has(u.path) && !!seen.add(u.path));
}

export function indexXml(groups: SitemapGroup[]): string {
  const lastmod = (urls: SitemapUrl[]) => iso(lastUpdated(urls.map((u) => ({ updated: u.lastModified }))));
  const items = groups.filter((g) => !isDiasporaGroup(g)).map((g) => ({ loc: `${SITE_URL}/sitemaps/${g.name}.xml`, lastmod: lastmod(g.urls) }));
  const dia = diasporaSitemapUrls(groups);
  if (dia.length) items.push({ loc: `${SITE_URL}${DIASPORA_SITEMAP}`, lastmod: lastmod(dia) });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.map((x) =>
    `<sitemap>\n<loc>${esc(x.loc)}</loc>\n<lastmod>${x.lastmod}</lastmod>\n</sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

/** /sitemap.xml: un singur fișier sau indexul, după numărul de adrese. */
export function mainSitemapXml(groups: SitemapGroup[] = sitemapGroups()): string {
  const all = groups.flatMap((g) => g.urls);
  return all.length > INDEX_LIMIT ? indexXml(groups) : urlsetXml(all);
}

export const xmlResponse = (body: string) => new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });

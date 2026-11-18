import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { splitLocalePath, type Locale } from "@/i18n/locales";
import { loadMessages } from "@/i18n/messages";
import { loadCollection } from "@/lib/continut/colectii";
import { loadNames } from "@/lib/continut/nume";
import { nameDescription, namePageText, nameTitle } from "@/lib/continut/nume-extra";
import { loadCounties } from "@/lib/continut/localitati";
import { loadUats, uatPath } from "@/lib/continut/uat";
import { GEN_CITIES, genCityPath } from "@/lib/genealogie-orase";
import { GEN_REGIONS, genRegionPath } from "@/lib/genealogie-regiuni";
import { SCHOOL_PAGES } from "@/lib/scoala";
import { AUTHORITY_PAGES } from "@/lib/autoritate";
import { GIFT_PAGES, giftPath } from "@/lib/cadouri";
import { KIN_PAGES, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { TOOLS, toolPath } from "@/lib/unelte/unelte";
import { grandparentQuestions } from "@/lib/unelte/intrebari";
import { entries as diasporaEntries } from "@/lib/diaspora";

/**
 * Amprenta conținutului fiecărei adrese din sitemap (doar pentru scripts/seo-versiuni.ts și teste, nu pe site): un hash din
 * ce se vede pe pagină. Când amprenta se schimbă, data paginii din src/data/seo-versiuni.json devine ziua schimbării; altfel
 * rămâne cea veche. Așa „lastmod” din sitemap spune când s-a schimbat cu adevărat fiecare pagină (planul SEO, 18.11.2026).
 *
 * Ce intră în amprentă:
 * - ghiduri și glosar: fișierul .md;
 * - nume, localități, orașe, regiuni, diaspora, școală, presă: datele paginii, plus șablonul ei (fișierul paginii și
 *   componentele pe care le folosește direct);
 * - paginile principale: fișierul paginii, componentele lui și textele lor din limba paginii.
 */
const ROOT = process.cwd();
const SITE = path.join(ROOT, "src", "app", "(site)");
const sha = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const read = (f: string) => (existsSync(f) ? readFileSync(f, "utf8") : "");

/** Componentele din src/components folosite direct de un fișier (un singur nivel). */
function componentsOf(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/from\s+"@\/components\/([^"]+)"/g)) {
    for (const ext of [".tsx", ".ts", "/index.tsx"]) {
      const f = path.join(ROOT, "src", "components", m[1] + ext);
      if (existsSync(f)) { out.push(f); break; }
    }
  }
  return out;
}

const templateCache = new Map<string, { hash: string; namespaces: string[] }>();
/** Șablonul unei pagini: fișierul ei (din app/(site)) și componentele lui. */
function template(routeFile: string) {
  const hit = templateCache.get(routeFile);
  if (hit) return hit;
  const file = path.join(SITE, routeFile);
  const page = read(file);
  const parts = [page, ...componentsOf(page).map(read)];
  const namespaces = [...new Set(parts.flatMap((s) => [...s.matchAll(/(?:getT|getTranslations|useTranslations)\(\s*"([A-Za-z]+)"/g)].map((m) => m[1])))].sort();
  const out = { hash: sha(parts.join("\n\u0000")), namespaces };
  templateCache.set(routeFile, out);
  return out;
}

const routeFileOf = (p: string) => (p === "/" ? "page.tsx" : `${p.slice(1)}/page.tsx`);

type Resolver = (p: string) => string | null;

/** Adresele pentru care amprenta n-ar avea de unde citi conținutul (nici regulă de secțiune, nici fișier de pagină): pentru teste. */
export function unknownSources(paths: string[]): string[] {
  const known = [/^\/(ghid|glosar|nume|localitati|scoala|cadouri|unelte|genealogie|diaspora)\/.+$/];
  return paths.map((f) => splitLocalePath(f).path).filter((p) => !known.some((re) => re.test(p)) && !existsSync(path.join(SITE, routeFileOf(p))));
}

export async function contentFingerprints(paths: string[]): Promise<Map<string, string>> {
  const messages = new Map<Locale, Record<string, unknown>>();
  const msg = async (l: Locale) => {
    if (!messages.has(l)) messages.set(l, (await loadMessages(l)) as Record<string, unknown>);
    return messages.get(l)!;
  };

  const records = new Map<string, unknown>();
  for (const c of ["ghid", "glosar"] as const) for (const e of loadCollection(c)) records.set(e.path, read(path.join(ROOT, "content", c, `${e.slug}.md`)));
  // La nume, textul vizibil întreg (și cel compus în src/lib/continut/nume-extra.ts), nu doar datele din JSON.
  for (const n of loadNames()) records.set(`/nume/${n.slug}`, { n, text: namePageText(n).paragraphs, title: nameTitle(n), description: nameDescription(n) });
  const counties = new Map(loadCounties().map((c) => [c.slug, c]));
  for (const c of counties.values()) records.set(`/localitati/${c.slug}`, c);
  for (const u of loadUats()) records.set(uatPath(u), { u, county: counties.get(u.countySlug) ?? null });
  for (const c of GEN_CITIES) records.set(genCityPath(c), c);
  for (const r of GEN_REGIONS) records.set(genRegionPath(r), r);
  for (const s of SCHOOL_PAGES) records.set(s.path, s);
  for (const a of AUTHORITY_PAGES) records.set(a.path, a);
  for (const g of GIFT_PAGES) records.set(giftPath(g), g);
  for (const e of diasporaEntries()) records.set(e.path, e);
  for (const t of TOOLS) records.set(toolPath(t), t.slug === "intrebari-pentru-bunici-pdf" ? { t, q: grandparentQuestions() } : t);
  for (const p of KIN_PAGES) records.set(kinPagePath(p), p);

  const hubs: Record<string, string[]> = {
    "/ghid": [...records.keys()].filter((k) => k.startsWith("/ghid/")),
    "/glosar": [...records.keys()].filter((k) => k.startsWith("/glosar/")),
    "/nume": loadNames().map((n) => `${n.slug}:${n.name}`),
    "/localitati": [...counties.keys()],
    "/cadouri": GIFT_PAGES.map((g) => `${g.slug}:${g.title}`),
    "/unelte": [...TOOLS.map((t) => `${t.slug}:${t.title}`), ...KIN_PAGES.map((p) => `${p.slug}:${p.title}`)],
  };

  // Șablonul fiecărei familii de pagini (după fișierul rutei din app/(site)).
  const sectionRoute: [RegExp, string][] = [
    [/^\/ghid\/[^/]+$/, ""], [/^\/glosar\/[^/]+$/, ""],
    [/^\/nume\/[^/]+$/, "nume/[slug]/page.tsx"],
    [/^\/localitati\/[^/]+$/, "localitati/[judet]/page.tsx"],
    [/^\/localitati\/[^/]+\/[^/]+$/, "localitati/[judet]/[localitate]/page.tsx"],
    [/^\/genealogie\/regiune\/[^/]+$/, "genealogie/regiune/[regiune]/page.tsx"],
    [/^\/genealogie\/[^/]+$/, "genealogie/[oras]/page.tsx"],
    [/^\/scoala\/[^/]+$/, "scoala/[slug]/page.tsx"],
    [/^\/cadouri\/[^/]+$/, "cadouri/[slug]/page.tsx"],
    [/^\/unelte\/rudenie\/[^/]+$/, "unelte/rudenie/[relatie]/page.tsx"],
    [/^\/unelte\/[^/]+$/, "unelte/[slug]/page.tsx"],
    [/^\/diaspora\/[^/]+\/[^/]+$/, "diaspora/[a]/[b]/page.tsx"],
    [/^\/diaspora\/[^/]+$/, "diaspora/[a]/page.tsx"],
  ];

  const resolve: Resolver = (p) => {
    for (const [re, route] of sectionRoute) {
      if (!re.test(p)) continue;
      const rec = records.get(p);
      if (rec === undefined) return null;
      return sha(`${route ? template(route).hash : ""}\n${typeof rec === "string" ? rec : JSON.stringify(rec)}`);
    }
    return null;
  };

  const out = new Map<string, string>();
  for (const full of paths) {
    const { locale, path: p } = splitLocalePath(full);
    const loc: Locale = locale ?? "ro";
    let h = resolve(p);
    if (!h) {
      // Hub sau pagină simplă: șablonul, textele lui în limba paginii și, la huburi, lista paginilor din ele.
      const t = template(routeFileOf(p));
      const m = await msg(loc);
      const texts = t.namespaces.map((ns) => JSON.stringify(m[ns] ?? null)).join("\n");
      const own = records.get(p);
      h = sha([t.hash, texts, JSON.stringify(hubs[p] ?? null), own === undefined ? "" : JSON.stringify(own)].join("\n\u0000"));
    }
    out.set(full, h);
  }
  return out;
}

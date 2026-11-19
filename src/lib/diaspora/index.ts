import type { Metadata } from "next";
import { LOCALES, localizedPath, withRegionalHreflang, type Locale } from "@/i18n/locales";
import { canonicalUrl, fitTitle } from "@/lib/page-metadata";
import { COUNTRIES, getCountry } from "./tari";
import { REGIONS, getRegion, regionIndexable } from "./america";
import { THEMES, getTheme } from "./teme";
import { LANG_OF, LOCALES_OF, type Country, type Lang, type Region, type T, type Theme } from "./tipuri";
import { UI } from "./ui";
import { DRAFT_COUNTRIES, PENDING } from "./ciorne";

export * from "./tipuri";
export { COUNTRIES, REGIONS, THEMES };

/** Toate paginile secțiunii /diaspora, cu limbile lor și dacă intră în Google. */
export const HUB_PATH = "/diaspora";
export const HUB_LANGS: Lang[] = ["ro", "en", "it", "es", "de", "fr", "he", "hu"];
/** Data ultimei schimbări de text (pentru sitemap). */
export const DIASPORA_UPDATED = new Date("2026-11-15T00:00:00Z");

export type Entry =
  | { kind: "hub"; path: string; langs: Lang[]; indexable: true }
  | { kind: "country"; path: string; langs: Lang[]; indexable: true; country: Country }
  | { kind: "region"; path: string; langs: Lang[]; indexable: boolean; region: Region; country: Country }
  | { kind: "theme"; path: string; langs: Lang[]; indexable: true; theme: Theme };

const countryPath = (c: Country) => `${HUB_PATH}/${c.slug}`;
export const COUNTRY_OF = { us: "statele-unite", ca: "canada", it: "italia", es: "spania", de: "germania", gb: "marea-britanie", il: "israel", fr: "franta", at: "austria", be: "belgia", ie: "irlanda", pt: "portugalia", gr: "grecia", cy: "cipru", nl: "olanda", ua: "ucraina" } as const;
const KEY_OF = Object.fromEntries(Object.entries(COUNTRY_OF).map(([k, v]) => [v, k])) as Record<string, keyof typeof COUNTRY_OF>;
/** Cheia țării (pentru orașe și regiuni) după pagina ei. */
export const keyOfCountry = (c: Country) => KEY_OF[c.slug] ?? null;
export const regionPath = (r: Region) => `${HUB_PATH}/${COUNTRY_OF[r.country]}/${r.slug}`;
export const themePath = (t: Theme) => `${HUB_PATH}/${t.slug}`;
export { countryPath };

let all: Entry[] | null = null;
export function entries(): Entry[] {
  if (all) return all;
  all = [
    { kind: "hub", path: HUB_PATH, langs: HUB_LANGS, indexable: true },
    ...COUNTRIES.map((c): Entry => ({ kind: "country", path: countryPath(c), langs: c.langs, indexable: true, country: c })),
    ...THEMES.map((t): Entry => ({ kind: "theme", path: themePath(t), langs: t.langs, indexable: true, theme: t })),
    ...REGIONS.map((r): Entry => ({ kind: "region", path: regionPath(r), langs: r.langs, indexable: regionIndexable(r), region: r, country: getCountry(COUNTRY_OF[r.country])! })),
  ];
  return all;
}

/** Ciornele neaprobate, ca pagini (doar pentru previzualizarea din Admin; nu apar în sitemap, liste sau legături). */
let drafts: Entry[] | null = null;
export function draftEntries(): Entry[] {
  if (drafts) return drafts;
  const countryOf = (k: Region["country"]) => getCountry(COUNTRY_OF[k]) ?? DRAFT_COUNTRIES.find((c) => c.slug === COUNTRY_OF[k])!;
  drafts = [
    ...PENDING.countries.map((c): Entry => ({ kind: "country", path: countryPath(c), langs: c.langs, indexable: true, country: c })),
    ...PENDING.themes.map((t): Entry => ({ kind: "theme", path: themePath(t), langs: t.langs, indexable: true, theme: t })),
    ...PENDING.regions.map((r): Entry => ({ kind: "region", path: regionPath(r), langs: r.langs, indexable: true, region: r, country: countryOf(r.country) })),
  ];
  return drafts;
}
/** O ciornă după adresă (previzualizare în Admin), sau null. */
export const resolveDraft = (a?: string, b?: string) => draftEntries().find((e) => e.path === [HUB_PATH, a, b].filter(Boolean).join("/")) ?? null;

/** Pagina pentru /diaspora/<a>[/<b>], sau null. */
export function resolve(a?: string, b?: string): Entry | null {
  if (!a) return entries()[0];
  if (b) {
    const country = KEY_OF[a] ?? null;
    const r = country ? getRegion(country, b) : null;
    return r ? entries().find((e) => e.kind === "region" && e.region === r) ?? null : null;
  }
  const c = getCountry(a);
  if (c) return entries().find((e) => e.kind === "country" && e.country === c) ?? null;
  const t = getTheme(a);
  return t ? entries().find((e) => e.kind === "theme" && e.theme === t) ?? null : null;
}

/** Limba în care se arată pagina: a omului, dacă pagina e scrisă în ea; altfel engleza, altfel româna. */
export function pickLang(langs: Lang[], locale: Locale): { lang: Lang; native: boolean } {
  const want = LANG_OF[locale];
  if (want && langs.includes(want)) return { lang: want, native: true };
  return { lang: langs.includes("en") ? "en" : langs.includes("ro") ? "ro" : langs[0], native: false };
}

/** Prima limbă a site-ului în care se poate citi un text (pentru adresa canonică a variantei de rezervă). */
const firstLocale = (l: Lang): Locale => LOCALES_OF[l][0];

/** Adresele paginii în fiecare limbă în care e scrisă (hreflang), plus „x-default” (româna, altfel engleza). */
export function alternatesFor(path: string, langs: Lang[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of langs) for (const loc of LOCALES_OF[l]) out[loc] = localizedPath(path, loc);
  out["x-default"] = localizedPath(path, langs.includes("ro") ? "ro" : firstLocale(langs.includes("en") ? "en" : langs[0]));
  return withRegionalHreflang(out);
}

/**
 * Canonica și hreflang pentru o pagină de diaspora în limba dată. Deschisă într-o limbă în care nu e scrisă (de pildă în
 * neerlandeză), pagina arată textul în engleză, trimite la adresa engleză și nu intră în Google. Paginile prea subțiri
 * (state fără informații proprii) sunt „noindex” în toate limbile.
 */
export function diasporaAlternates(e: Entry, locale: Locale): Pick<Metadata, "alternates" | "robots"> & { url: string; lang: Lang } {
  const { lang, native } = pickLang(e.langs, locale);
  const own = native ? locale : firstLocale(lang);
  const url = canonicalUrl(localizedPath(e.path, own));
  const languages = Object.fromEntries(Object.entries(alternatesFor(e.path, e.langs)).map(([k, p]) => [k, canonicalUrl(p)]));
  const robots = !native || !e.indexable ? { index: false, follow: true } : undefined;
  return { url, lang, alternates: { canonical: url, languages }, ...(robots ? { robots } : {}) };
}

export const isRtl = (l: Lang) => l === "he";
/** Pentru teste și pentru middleware: toate adresele secțiunii (fără prefix de limbă). */
export const allPaths = () => entries().map((e) => e.path);
/** Câte limbi ale site-ului are în total secțiunea (pentru Centrul de cunoștințe). */
export const localeCount = () => new Set(entries().flatMap((e) => e.langs.flatMap((l) => LOCALES_OF[l]))).size;
export const LOCALES_ALL = LOCALES;

/** Textul într-o limbă, cu engleza și apoi româna ca rezervă. */
export const tx = (t: T | undefined, l: Lang) => t?.[l] ?? t?.en ?? t?.ro ?? "";

/** Titlul, descrierea și numele scurt ale unei pagini, în limba dată (pentru pagină, metadate și Centrul SEO). */
export function titleOf(e: Entry, l: Lang) {
  const u = UI[l];
  switch (e.kind) {
    case "hub": return `${u.hubTitle} | Cartea Neamului`;
    case "country": return u.titleCountry(tx(e.country.where, l));
    case "region": {
      const t = u.titleRegion(tx(e.region.where, l));
      return fitTitle(t).length <= 60 || !u.titleRegionShort ? t : u.titleRegionShort(tx(e.region.where, l));
    }
    case "theme": return `${tx(e.theme.name, l)} | Cartea Neamului`;
  }
}
export function descriptionOf(e: Entry, l: Lang) {
  const u = UI[l];
  switch (e.kind) {
    case "hub": return u.hubDescription;
    case "country": return u.descCountry(tx(e.country.where, l));
    case "region": return u.descRegion(tx(e.region.where, l), tx(e.country.name, l));
    case "theme": return tx(e.theme.description, l);
  }
}
export function nameOf(e: Entry, l: Lang) {
  switch (e.kind) {
    case "hub": return UI[l].diaspora;
    case "country": return tx(e.country.name, l);
    case "region": return tx(e.region.name, l);
    case "theme": return tx(e.theme.name, l);
  }
}


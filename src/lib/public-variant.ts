import { LOCALES, type Locale } from "@/i18n/locales";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { sectionOf } from "@/lib/public-sections";

/**
 * Paginile publice, pentru vizitatorii fără cont, se servesc gata făcute din cache: câte o variantă pentru fiecare limbă,
 * temă și dacă anunțul despre cookie-uri a fost deja închis. Varianta e un singur segment, ex. „ro.auto.0”, în adresa
 * internă /pub/<varianta>/<pagina>, la care middleware.ts trimite cererea (adresa din browser rămâne cea obișnuită).
 * (Fișier fără importuri de pe server, ca să meargă și în middleware.)
 */
export type PublicVariant = { locale: Locale; theme: "auto" | "light" | "dark"; cookieSeen: boolean };

export const PUBLIC_PREFIX = "/pub";
const THEMES = ["auto", "light", "dark"] as const;

export function variantKey(v: PublicVariant): string {
  return `${v.locale}.${v.theme}.${v.cookieSeen ? 1 : 0}`;
}

export function parseVariant(key: string): PublicVariant | null {
  const [locale, theme, seen, ...rest] = decodeURIComponent(key).split(".");
  if (rest.length || !(LOCALES as readonly string[]).includes(locale) || !(THEMES as readonly string[]).includes(theme) || (seen !== "0" && seen !== "1")) return null;
  return { locale: locale as Locale, theme: theme as PublicVariant["theme"], cookieSeen: seen === "1" };
}

/** Toate variantele (9 limbi × 3 teme × anunț închis sau nu = 54), făcute la publicare și reîmprospătate din 10 în 10 minute. */
export const ALL_VARIANTS = LOCALES.flatMap((locale) => THEMES.flatMap((theme) => [false, true].map((cookieSeen) => variantKey({ locale, theme, cookieSeen }))));

/** Paginile care au variantă gata făcută: toate cele din PUBLIC_PAGES. */
export const PUBLIC_PATHS = new Set(PUBLIC_PAGES.map((p) => p.path));

/** Paginile servite gata făcute: cele din PUBLIC_PAGES și cele din secțiunile publice (ghiduri, glosar…). */
export const isPublicPath = (pathname: string) => PUBLIC_PATHS.has(pathname) || sectionOf(pathname) !== null;

/** Varianta făcută la publicare pentru paginile din secțiuni (cea pe care o primesc Google și vizitatorii noi în română). */
export const BUILD_VARIANT = variantKey({ locale: "ro", theme: "auto", cookieSeen: false });

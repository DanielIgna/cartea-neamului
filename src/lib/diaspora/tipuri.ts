import type { Locale } from "@/i18n/locales";

/**
 * Paginile pentru românii din afara țării (Daniel, 15.11.2026, „punctul 10”, prioritar): câte o pagină pe țară, pe statele
 * SUA și provinciile Canadei, pe orașele mari și câteva pagini speciale. Fiecare pagină e scrisă în câteva limbi (româna,
 * engleza și limba țării), nu în toate: textul e propriu fiecărei limbi, nu tradus automat.
 */
export type Lang = "ro" | "en" | "it" | "es" | "de" | "fr" | "he" | "hu" | "nl"
  | "pt" | "el" | "sv" | "da" | "nb" | "uk" | "sr" | "bg" | "tr";
export type T = Partial<Record<Lang, string>>;
export type TList = Partial<Record<Lang, string[]>>;

/** Limba conținutului pentru limba site-ului (engleza britanică și cea americană au același text). */
export const LANG_OF: Record<Locale, Lang | null> = {
  ro: "ro", "en-GB": "en", "en-US": "en", fr: "fr", es: "es", nl: "nl", de: "de", it: "it", hu: "hu", he: "he",
  // Limbile noi (Daniel, 24.11.2026: „tradu în limbile noi cele 9”): prima pagină, textele comune și pagina țării lor.
  pt: "pt", el: "el", sv: "sv", da: "da", nb: "nb", uk: "uk", sr: "sr", bg: "bg", tr: "tr",
};
/** Limbile site-ului care arată un text (pentru hreflang). */
export const LOCALES_OF: Record<Lang, Locale[]> = {
  ro: ["ro"], en: ["en-GB", "en-US"], it: ["it"], es: ["es"], de: ["de"], fr: ["fr"], he: ["he"], hu: ["hu"], nl: ["nl"],
  pt: ["pt"], el: ["el"], sv: ["sv"], da: ["da"], nb: ["nb"], uk: ["uk"], sr: ["sr"], bg: ["bg"], tr: ["tr"],
};

export type Link = { name: string; url: string; note: T };

export type Country = {
  slug: string; code: string; flag: string;
  name: T;
  /** Locul cu prepoziția potrivită fiecărei limbi: „în Italia”, „au Canada”, „in der Schweiz”, „בישראל”. */
  where: T;
  /** Limbile în care e scrisă pagina (prima e limba țării, dacă o avem). */
  langs: Lang[];
  /** Țară din Uniunea Europeană: actele de stare civilă circulă fără apostilă (Regulamentul UE 2016/1191). */
  eu: boolean;
  /** Câți români trăiesc acolo, spus rotund (null când nu știm sigur). */
  size: T | null;
  /** Orașele, cu numele lor de acolo (scrise la fel în toate limbile; pentru ebraică, citiesHe). */
  cities: string[]; citiesHe?: string[];
  /** Orașul cu filială a Institutului Cultural Român, dacă există. */
  icr: T | null;
  history: TList;
  /** Arhivele și registrele din țara gazdă, utile pentru familiile de acolo. */
  records: Link[];
};

/** Țările cu pagini pe regiuni sau orașe: codul țării, cu litere mici. */
export type CountryKey = "us" | "ca" | "it" | "es" | "de" | "gb" | "il" | "fr" | "at" | "be" | "ie" | "pt" | "gr" | "cy" | "nl" | "ua";

export type Region = {
  slug: string; country: CountryKey;
  /** „region” = regiune, land, comunitate autonomă sau națiune din Europa (și regiunile Ucrainei). */
  kind: "state" | "province" | "city" | "region";
  /** Orașele misiunilor României (din extins.ts) care servesc orașul, ca să le arătăm pe pagină. */
  mission?: string[];
  name: T;
  where: T;
  /** Pentru un oraș: statul sau provincia (slug). */
  parent?: string;
  langs: Lang[];
  /** Ce știm sigur despre românii de acolo; fără note, pagina rămâne în afara Google (prea puțin text propriu). */
  notes: TList;
  cities?: string[];
  /** Ghidurile din /ghid legate de regiune (slug), ca să nu repetăm ce e scris acolo. */
  guides?: string[];
};

export type Theme = {
  slug: string; langs: Lang[]; name: T; description: T;
  body: Partial<Record<Lang, { h: string; p: string[] }[]>>;
  records: Link[];
  related: string[];
  /** Ghidurile din /ghid legate de temă (slug). */
  guides?: string[];
};

/** O misiune a României: ambasadă, secția ei consulară, consulat general sau consulat (doar din surse oficiale). */
export type Mission = { kind: "embassy" | "consular" | "cg" | "consulate"; city: string; address?: string; url?: string };
export type Faq = { q: string; a: string };
/** Textul lărgit al unei țări (src/lib/diaspora/extins.ts): scris doar în limbile în care are rost, nu în toate. */
export type CountryExtra = {
  stats?: Link;
  missions: Mission[];
  missionsSource: Link;
  guide: TList;
  specifics: TList;
  faq: Partial<Record<Lang, Faq[]>>;
};

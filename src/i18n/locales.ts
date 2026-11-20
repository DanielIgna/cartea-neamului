/**
 * Limbile site-ului. Româna e limba de bază: textele se scriu întâi în română (src/i18n/messages/ro.ts), iar celelalte
 * limbi le traduc. Pentru cei din diaspora, mai ales copiii născuți acolo, care nu mai citesc bine românește.
 *
 * Alegerea se ține într-un cookie („limba”) și, pentru cine are cont, și în cont (coloana user.locale), ca să-l urmeze pe
 * alt telefon. Paginile publice au și adresa lor pe limbă (/it/, /en/contact; vezi URL_PREFIX), româna e fără prefix.
 */
export const LOCALES = ["ro", "en-GB", "en-US", "fr", "es", "nl", "de", "it", "hu", "he", "pt", "el", "sv", "da", "nb", "uk", "sr", "bg", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ro";
/**
 * În câte limbi e site-ul, cum se spune oamenilor („în 18 limbi”): engleza britanică și cea americană sunt o singură limbă.
 * Orice text care spune numărul limbilor îl ia de aici, ca să nu rămână în urmă când se adaugă o limbă.
 */
export const LANGUAGE_COUNT = new Set(LOCALES.map((l) => l.split("-")[0])).size;
/**
 * Limbile adăugate pe 19.11.2026 care nu au încă toate textele traduse: ce lipsește se arată în engleză (nu în română), iar
 * paginile publice fără text în ele nu primesc adresă pe acea limbă (vezi NOT_YET_IN din public-pages.ts).
 */
export const NEW_LOCALES = ["pt", "el", "sv", "da", "nb", "uk", "sr", "bg", "tr"] as const satisfies readonly Locale[];
export const LOCALE_COOKIE = "limba";
/** Întrebarea despre limbă a fost închisă cu ✕ pe acest dispozitiv: nu mai apare. */
export const SUGGEST_DISMISSED_COOKIE = "limba_intrebare";
/** Ora după care se arată datele și orele, până știm ora fiecăruia. */
export const TIME_ZONE = "Europe/Bucharest";

/** Numele fiecărei limbi scris în limba ei, cum îl caută omul în listă. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  ro: "Română", "en-GB": "English (UK)", "en-US": "English (US)", fr: "Français", es: "Español",
  nl: "Nederlands", de: "Deutsch", it: "Italiano", hu: "Magyar", he: "עברית",
  pt: "Português", el: "Ελληνικά", sv: "Svenska", da: "Dansk", nb: "Norsk", uk: "Українська", sr: "Srpski", bg: "Български", tr: "Türkçe",
};

/** Limbile scrise de la dreapta la stânga (ebraica): pagina primește dir="rtl". */
export const RTL_LOCALES: readonly Locale[] = ["he"];
export const dirOf = (l: Locale): "rtl" | "ltr" => (RTL_LOCALES.includes(l) ? "rtl" : "ltr");

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** Limba unei etichete de browser („de-AT”, „en-GB”, „fr”), dacă o avem; engleza fără țară e cea britanică. */
function localeOfTag(tag: string): Locale | null {
  const [lang, region = ""] = tag.toLowerCase().split(/[-_]/);
  if (lang === "ro" || lang === "mo") return "ro";
  if (lang === "en") return ["us", "ca", "ph", "pr", "um", "vi", "as", "gu", "mp"].includes(region) ? "en-US" : "en-GB";
  if (lang === "he" || lang === "iw") return "he";
  // Norvegiana are două scrieri (bokmål „nb”, nynorsk „nn”) și eticheta veche „no”: toate primesc bokmål.
  if (lang === "nb" || lang === "nn" || lang === "no") return "nb";
  return (["fr", "es", "nl", "de", "it", "hu", "pt", "el", "sv", "da", "uk", "sr", "bg", "tr"] as const).find((l) => l === lang) ?? null;
}

/**
 * Limba pe care o preferă browserul (antetul Accept-Language), dintre cele pe care le avem: „de-DE,de;q=0.9,ro;q=0.8” → „de”.
 * Ordinea e cea dată de browser (după q); prima limbă pe care o avem câștigă, chiar dacă e româna.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  for (const t of acceptTags(header)) {
    const l = localeOfTag(t);
    if (l) return l;
  }
  return null;
}

/** Limba din antetul Cookie al unei cereri (la crearea contului, unde nu avem `cookies()` din Next). */
export function localeFromCookieHeader(header: string | null | undefined): Locale | null {
  const m = (header ?? "").match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return isLocale(v) ? v : null;
}

/* ---------- Adresele pe limbi și limba ghicită la prima vizită (Daniel, 2026-11-14) ---------- */

/**
 * Prefixul din adresă al fiecărei limbi: româna rămâne fără prefix (e și „x-default”), celelalte au adresa lor, ca Google să
 * le vadă pe fiecare: /it/, /en/contact, /he/termeni. Engleza britanică e „/en”, cea americană „/en-us”.
 */
export const URL_PREFIX: Record<Locale, string> = {
  ro: "", "en-GB": "en", "en-US": "en-us", fr: "fr", es: "es", nl: "nl", de: "de", it: "it", hu: "hu", he: "he",
  // Norvegiana sub „/no” (cum o caută oamenii), ucraineana sub „/ua”: „/uk” s-ar fi citit „Marea Britanie”.
  pt: "pt", el: "el", sv: "sv", da: "da", nb: "no", uk: "ua", sr: "sr", bg: "bg", tr: "tr",
};
const PREFIX_LOCALE = new Map(LOCALES.filter((l) => URL_PREFIX[l]).map((l) => [URL_PREFIX[l], l] as const));
/** Prefixele, pentru middleware și teste (fără română). */
export const URL_PREFIXES = [...PREFIX_LOCALE.keys()];

/** Adresa unei pagini în limba dată: („/contact”, „it”) → „/it/contact”; („/”, „he”) → „/he”; româna rămâne „/contact”. */
export function localizedPath(path: string, locale: Locale): string {
  const p = URL_PREFIX[locale];
  if (!p) return path;
  return path === "/" ? `/${p}` : `/${p}${path}`;
}

/** Desparte prefixul de limbă: „/it/contact” → { locale: „it”, path: „/contact” }; fără prefix → limba null și adresa la fel. */
export function splitLocalePath(pathname: string): { locale: Locale | null; path: string } {
  const m = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
  const l = m ? PREFIX_LOCALE.get(m[1]) : undefined;
  if (!l) return { locale: null, path: pathname };
  const rest = m![2] ?? "/";
  return { locale: l, path: rest.length > 1 ? rest.replace(/\/+$/, "") || "/" : "/" };
}

/**
 * Etichetele hreflang regionale pentru America de Nord (Daniel, 18.11.2026: „hreflang, fără adrese noi”): Canada în engleză
 * primește aceeași pagină ca SUA (/en-us), iar românii din SUA și Canada pagina românească. Nu sunt limbi noi și nu au adresă
 * proprie, doar îi spun lui Google ce variantă să arate acolo; fără ele, Google alegea la întâmplare între /en și /en-us.
 */
export const REGIONAL_HREFLANG: Record<string, Locale> = {
  "en-CA": "en-US", "ro-US": "ro", "ro-CA": "ro",
  // Europa (firul „Extinde SEO-ul diasporei în Europa”): variantele regionale ale limbilor pe care le avem, plus Republica Moldova.
  "de-AT": "de", "de-CH": "de", "fr-BE": "fr", "fr-CH": "fr", "nl-BE": "nl", "en-IE": "en-GB", "ro-MD": "ro",
  // Limbile adăugate pe 19.11.2026: portugheza Braziliei vede pagina din Portugalia, greaca din Cipru pe cea greacă.
  "pt-BR": "pt", "el-CY": "el", "sv-FI": "sv",
};

/** Adaugă etichetele regionale la o listă hreflang → adresă, doar unde există limba de bază (fără ea nu adaugă nimic). */
export function withRegionalHreflang<T>(langs: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = { ...langs };
  for (const [tag, base] of Object.entries(REGIONAL_HREFLANG)) if (base in langs && !(tag in out)) out[tag] = langs[base];
  return out;
}

/** Steagul de lângă numele limbii (în selectorul din antet și în întrebarea despre limbă). */
export const LANGUAGE_FLAGS: Record<Locale, string> = {
  ro: "🇷🇴", "en-GB": "🇬🇧", "en-US": "🇺🇸", fr: "🇫🇷", es: "🇪🇸", nl: "🇳🇱", de: "🇩🇪", it: "🇮🇹", hu: "🇭🇺", he: "🇮🇱",
  pt: "🇵🇹", el: "🇬🇷", sv: "🇸🇪", da: "🇩🇰", nb: "🇳🇴", uk: "🇺🇦", sr: "🇷🇸", bg: "🇧🇬", tr: "🇹🇷",
};

/**
 * Limba după țara de unde vine vizita (antetul x-vercel-ip-country), când browserul nu spune o limbă pe care o avem.
 * Irlanda rămâne pe engleză: nu are limbă proprie pe site, dar are pagini și articole proprii în /diaspora.
 */
export const COUNTRY_LOCALE: Record<string, Locale> = {
  RO: "ro", MD: "ro",
  IT: "it", SM: "it", VA: "it",
  ES: "es", AD: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  DE: "de", AT: "de", LI: "de", CH: "de", LU: "de",
  FR: "fr", BE: "fr", MC: "fr",
  NL: "nl",
  HU: "hu",
  IL: "he",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  GR: "el", CY: "el",
  SE: "sv",
  DK: "da", FO: "da", GL: "da",
  NO: "nb", SJ: "nb",
  UA: "uk",
  RS: "sr", ME: "sr", BA: "sr",
  BG: "bg",
  TR: "tr",
  US: "en-US", CA: "en-US",
  GB: "en-GB", IE: "en-GB", AU: "en-GB", NZ: "en-GB", MT: "en-GB", FI: "en-GB",
};

/** Etichetele de limbă din Accept-Language, în ordinea preferinței (după q). */
function acceptTags(header: string | null | undefined): string[] {
  if (!header) return [];
  return header.split(",").map((part, i) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const weight = q ? Number(q.slice(2)) : 1;
    return { tag: tag.trim(), q: Number.isFinite(weight) ? weight : 0, i };
  }).filter((t) => t.tag && t.tag !== "*" && t.q > 0).sort((a, b) => b.q - a.q || a.i - b.i).map((t) => t.tag);
}

/**
 * Limba ghicită pentru cine vine prima dată: întâi limba browserului, apoi țara. Excepția cea mai importantă: dacă româna e
 * oriunde printre limbile browserului (un român din Italia cu „it,ro”), rămâne româna, pentru că diaspora e publicul nostru.
 */
export function detectLocale({ acceptLanguage, country }: { acceptLanguage?: string | null; country?: string | null }): Locale {
  const tags = acceptTags(acceptLanguage);
  if (tags.some((t) => localeOfTag(t) === "ro")) return "ro";
  for (const t of tags) {
    const l = localeOfTag(t);
    if (l) return l;
  }
  const c = (country ?? "").toUpperCase();
  return COUNTRY_LOCALE[c] ?? DEFAULT_LOCALE;
}

/** Roboții motoarelor de căutare și ai previzualizărilor de linkuri: nu sunt niciodată trimiși în altă parte și nu primesc întrebarea. */
export const isCrawler = (ua: string | null | undefined) =>
  !ua || /bot\b|bot\/|crawl|spider|slurp|googlebot|bingbot|duckduck|baiduspider|yandex|applebot|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|embedly|pinterest|google-inspectiontool|chrome-lighthouse|headlesschrome|petalbot|semrush|ahrefs/i.test(ua);

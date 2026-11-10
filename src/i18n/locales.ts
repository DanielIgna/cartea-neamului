/**
 * Limbile site-ului. Româna e limba de bază: textele se scriu întâi în română (src/i18n/messages/ro.ts), iar celelalte
 * limbi le traduc. Pentru cei din diaspora, mai ales copiii născuți acolo, care nu mai citesc bine românește.
 *
 * Alegerea se ține într-un cookie („limba”) și, pentru cine are cont, și în cont (coloana user.locale), ca să-l urmeze pe
 * alt telefon. Adresele paginilor rămân aceleași în toate limbile.
 */
export const LOCALES = ["ro", "en-GB", "en-US", "fr", "es", "nl", "de", "it", "hu"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ro";
export const LOCALE_COOKIE = "limba";
/** Întrebarea despre limbă a fost închisă cu ✕ pe acest dispozitiv: nu mai apare. */
export const SUGGEST_DISMISSED_COOKIE = "limba_intrebare";
/** Ora după care se arată datele și orele, până știm ora fiecăruia. */
export const TIME_ZONE = "Europe/Bucharest";

/** Numele fiecărei limbi scris în limba ei, cum îl caută omul în listă. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  ro: "Română", "en-GB": "English (UK)", "en-US": "English (US)", fr: "Français", es: "Español",
  nl: "Nederlands", de: "Deutsch", it: "Italiano", hu: "Magyar",
};

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** Limba unei etichete de browser („de-AT”, „en-GB”, „fr”), dacă o avem; engleza fără țară e cea britanică. */
function localeOfTag(tag: string): Locale | null {
  const [lang, region = ""] = tag.toLowerCase().split(/[-_]/);
  if (lang === "ro" || lang === "mo") return "ro";
  if (lang === "en") return ["us", "ca", "ph", "pr", "um", "vi", "as", "gu", "mp"].includes(region) ? "en-US" : "en-GB";
  return (["fr", "es", "nl", "de", "it", "hu"] as const).find((l) => l === lang) ?? null;
}

/**
 * Limba pe care o preferă browserul (antetul Accept-Language), dintre cele pe care le avem: „de-DE,de;q=0.9,ro;q=0.8” → „de”.
 * Ordinea e cea dată de browser (după q); prima limbă pe care o avem câștigă, chiar dacă e româna.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const tags = header.split(",").map((part, i) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const weight = q ? Number(q.slice(2)) : 1;
    return { tag: tag.trim(), q: Number.isFinite(weight) ? weight : 0, i };
  }).filter((t) => t.tag && t.tag !== "*" && t.q > 0).sort((a, b) => b.q - a.q || a.i - b.i);
  for (const t of tags) {
    const l = localeOfTag(t.tag);
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

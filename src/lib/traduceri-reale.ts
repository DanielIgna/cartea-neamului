import { LOCALES, localizedPath, type Locale } from "@/i18n/locales";
import { PUBLIC_PAGES, pageLocales } from "@/lib/public-pages";
import { sectionOf } from "@/lib/public-sections";
import { DIASPORA_LANGS } from "@/lib/diaspora/limbi-generat";
import { LANG_OF } from "@/lib/diaspora/tipuri";
import { isCategoryProductPath, isModelPath } from "@/lib/invitatii-nunta";

/**
 * În ce limbi are o pagină publică text adevărat (planul SEO, 18.11.2026, punctul 4). Fișier fără importuri de pe server:
 * îl folosesc middleware.ts (o adresă pe o limbă fără traducere trimite cu 308 la pagina cu text) și selectorul de limbă.
 * - paginile principale traduse (PUBLIC_PAGES fără `roOnly`): toate limbile;
 * - diaspora: limbile în care e scrisă fiecare pagină;
 * - restul (ghiduri, glosar, nume, localități, genealogie, paginile `roOnly`): doar româna.
 */
const PAGES = new Map(PUBLIC_PAGES.map((p) => [p.path, new Set<Locale>(pageLocales(p.path))]));

const ALL: ReadonlySet<Locale> = new Set(LOCALES);

export function realLocales(path: string): ReadonlySet<Locale> {
  const page = PAGES.get(path);
  if (page) return page;
  // Un model de invitație are adresă în toate limbile (middleware-ul nu citește baza); în limbile fără text, pagina arată textul
  // românesc, cu adresa canonică românească și noindex (src/lib/invitatii-nunta-meta.ts).
  if (isModelPath(path) || isCategoryProductPath(path)) return ALL;
  if (sectionOf(path) === "diaspora") {
    const langs = DIASPORA_LANGS[path]?.split(" ") ?? ["ro"];
    return new Set(LOCALES.filter((l) => l === "ro" ? langs.includes("ro") : !!LANG_OF[l] && langs.includes(LANG_OF[l]!)));
  }
  return new Set<Locale>(["ro"]);
}

export const hasRealTranslation = (path: string, locale: Locale) => realLocales(path).has(locale);

/**
 * Adresa la care duce alegerea unei limbi pe o pagină publică: pagina în limba aleasă dacă e scrisă în ea, altfel pagina
 * românească (sau, dacă pagina nu e în română, prima ei limbă). Tot aici trimite redirectul 308 din middleware.
 */
export function pathForLocale(path: string, locale: Locale): string {
  const real = realLocales(path);
  if (real.has(locale)) return localizedPath(path, locale);
  return localizedPath(path, real.has("ro") ? "ro" : [...real][0] ?? "ro");
}

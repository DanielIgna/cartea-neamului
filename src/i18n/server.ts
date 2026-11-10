import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createFormatter, createTranslator, type Messages, type NamespaceKeys, type NestedKeyOf } from "use-intl/core";
import { currentUser } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUGGEST_DISMISSED_COOKIE, TIME_ZONE, isLocale, localeFromAcceptLanguage, type Locale } from "./locales";
import { loadMessages } from "./messages";

/** Unde a găsit serverul limba: aleasă pe acest telefon (cookie), din cont sau niciuna (româna, de la sine). */
export type LocaleSource = "cookie" | "account" | "default";

/**
 * Limba cererii: cea aleasă pe acest telefon sau calculator; altfel cea din cont (aleasă pe alt telefon); altfel româna.
 * Contul de probă îl folosesc mai mulți, așa că limba lui nu se ia din cont.
 */
export const getLocaleInfo = cache(async (): Promise<{ locale: Locale; source: LocaleSource }> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return { locale: chosen, source: "cookie" };
  const me = await currentUser().catch(() => null);
  if (me && !isDemo(me.email) && isLocale(me.locale) && me.locale !== DEFAULT_LOCALE) return { locale: me.locale, source: "account" };
  return { locale: DEFAULT_LOCALE, source: "default" };
});

export const getLocale = async () => (await getLocaleInfo()).locale;
export const getMessages = cache(loadMessages);

type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>;

/** Textele unei părți a site-ului, pentru paginile și acțiunile de pe server (în componentele din browser: useTranslations). */
export async function getT<N extends Namespace>(namespace: N, locale?: Locale) {
  const l = locale ?? (await getLocale());
  return createTranslator({ locale: l, messages: await getMessages(l), namespace, timeZone: TIME_ZONE });
}

/** Date și numere scrise ca în limba omului. */
export async function getFormat(locale?: Locale) {
  return createFormatter({ locale: locale ?? (await getLocale()), timeZone: TIME_ZONE });
}

/**
 * Limba în care să-l întrebăm o singură dată pe om dacă vrea site-ul: doar dacă n-a ales încă nimic (nici aici, nici în cont)
 * și browserul lui e într-o limbă pe care o avem, alta decât româna.
 */
export async function suggestedLocale(): Promise<Locale | null> {
  const { locale, source } = await getLocaleInfo();
  if (source !== "default") return null;
  // Închisă o dată cu ✕: nu mai întrebăm pe acest telefon sau calculator.
  if ((await cookies()).get(SUGGEST_DISMISSED_COOKIE)?.value) return null;
  const header = (await headers()).get("accept-language");
  // Cine are browserul în română (prima limbă din listă) nu e întrebat, chiar dacă mai știe și alte limbi.
  if (localeFromAcceptLanguage(header?.split(",")[0]) === DEFAULT_LOCALE) return null;
  const l = localeFromAcceptLanguage(header);
  return l && l !== DEFAULT_LOCALE && l !== locale ? l : null;
}

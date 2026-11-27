import type { TextLocale } from "./invitatii-nunta";

/** Numele limbilor site-ului, în română, pentru formularul din Admin. */
export function localeNames(locales: readonly TextLocale[]) {
  const dn = new Intl.DisplayNames(["ro"], { type: "language" });
  const name = (l: TextLocale) => (l === "en-GB" ? "engleză" : l === "nb" ? "norvegiană" : dn.of(l) ?? l);
  return locales.map((code) => ({ code, name: name(code) }));
}

export const whenRo = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);

import type { PersonView } from "./tree-data";
import { parseFuzzyDate } from "./dates";
import type { Locale } from "@/i18n/locales";

/**
 * Bucăți de text despre o persoană, folosite și în paginile de pe server (profilul, cartea), și în desenele din browser.
 * Stau aici, nu în desene: o funcție dintr-un fișier „use client” nu poate fi chemată de pe server.
 */

/** Cum se scriu datele în fiecare limbă: „cca. 1870” / “c. 1870” / „um 1870”, „12.03.1932” / “03/12/1932” / „1932. 03. 12.”. */
type DateWords = { approx: string; before: (y: number) => string; after: (y: number) => string; dmy: (d: string, m: string, y: string) => string; my: (m: string, y: string) => string };
const slash = { dmy: (d: string, m: string, y: string) => `${d}/${m}/${y}`, my: (m: string, y: string) => `${m}/${y}` };
const dots = { dmy: (d: string, m: string, y: string) => `${d}.${m}.${y}`, my: (m: string, y: string) => `${m}.${y}` };
export const DATE_WORDS: Record<Locale, DateWords> = {
  ro: { approx: "cca. ", before: (y) => `înainte de ${y}`, after: (y) => `după ${y}`, ...dots },
  "en-GB": { approx: "c. ", before: (y) => `before ${y}`, after: (y) => `after ${y}`, ...slash },
  "en-US": { approx: "c. ", before: (y) => `before ${y}`, after: (y) => `after ${y}`, dmy: (d, m, y) => `${m}/${d}/${y}`, my: (m, y) => `${m}/${y}` },
  fr: { approx: "vers ", before: (y) => `avant ${y}`, after: (y) => `après ${y}`, ...slash },
  es: { approx: "h. ", before: (y) => `antes de ${y}`, after: (y) => `después de ${y}`, ...slash },
  nl: { approx: "ca. ", before: (y) => `vóór ${y}`, after: (y) => `na ${y}`, dmy: (d, m, y) => `${d}-${m}-${y}`, my: (m, y) => `${m}-${y}` },
  de: { approx: "um ", before: (y) => `vor ${y}`, after: (y) => `nach ${y}`, ...dots },
  it: { approx: "ca. ", before: (y) => `prima del ${y}`, after: (y) => `dopo il ${y}`, ...slash },
  hu: { approx: "kb. ", before: (y) => `${y} előtt`, after: (y) => `${y} után`, dmy: (d, m, y) => `${y}. ${m}. ${d}.`, my: (m, y) => `${y}. ${m}.` },
  he: { approx: "בערך ", before: (y) => `לפני ${y}`, after: (y) => `אחרי ${y}`, ...dots },
};

/** „1898–1967”, „cca. 1870–?”, „1988” pentru cei în viață; nimic pentru cei în viață fără an de naștere (sau cu datele ascunse, în carte). */
export const years = (p?: Pick<PersonView, "approx" | "birthYear" | "deathYear" | "living">, locale: Locale = "ro") =>
  !p || (p.living && !p.birthYear && !p.deathYear) ? "" : `${p.approx ? DATE_WORDS[locale].approx : ""}${p.birthYear ?? "?"}${p.deathYear ? `–${p.deathYear}` : p.living ? "" : "–?"}`;

/**
 * O dată, scurt, cu ziua și luna când se știu: „12 martie 1932”, „12.03.1932” și „12 MAR 1932” devin „12.03.1932”;
 * „martie 1985” devine „03.1985”; „cca. 1870”, „înainte de 1900” și anii simpli rămân cum sunt. În altă limbă, cu
 * semnele și cuvintele ei: „03/12/1932” în engleza americană, „vor 1900” în germană.
 */
export function shortDate(text: string | null | undefined, locale: Locale = "ro"): string {
  const t = text?.trim();
  if (!t) return "";
  const r = parseFuzzyDate(t);
  if (!r.year || !r.from || !r.to) return t;
  const w = DATE_WORDS[locale];
  if (r.side === "before") return w.before(r.year);
  if (r.side === "after") return w.after(r.year);
  const prefix = r.approx ? w.approx : "";
  const [y, m, d] = r.from.split("-");
  if (r.from === r.to) return `${prefix}${w.dmy(d, m, y)}`;
  if (r.from.slice(0, 7) === r.to.slice(0, 7)) return `${prefix}${w.my(m, y)}`;
  return `${prefix}${r.year}`;
}

/** Nașterea și moartea, cu ziua și luna când se știu: „12.03.1932–05.11.2008”, „cca. 1870–1931”, „12.03.1985” pentru cei în viață. */
export function lifeDates(p?: Pick<PersonView, "birthText" | "deathText" | "approx" | "birthYear" | "deathYear" | "living">, locale: Locale = "ro") {
  if (!p) return "";
  const b = shortDate(p.birthText, locale), d = shortDate(p.deathText, locale);
  if (!b && !d) return years(p, locale);
  if (p.living && !d) return b;
  return `${b || "?"}–${d || "?"}`;
}

/** Taie un text prea lung pentru locul în care încape, cu „…” la capăt. */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

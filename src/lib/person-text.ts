import type { PersonView } from "./tree-data";
import { parseFuzzyDate } from "./dates";

/**
 * Bucăți de text despre o persoană, folosite și în paginile de pe server (profilul, cartea), și în desenele din browser.
 * Stau aici, nu în desene: o funcție dintr-un fișier „use client” nu poate fi chemată de pe server.
 */

/** „1898–1967”, „cca. 1870–?”, „1988” pentru cei în viață. */
export const years = (p?: Pick<PersonView, "approx" | "birthYear" | "deathYear" | "living">) =>
  !p ? "" : `${p.approx ? "cca. " : ""}${p.birthYear ?? "?"}${p.deathYear ? `–${p.deathYear}` : p.living ? "" : "–?"}`;

/**
 * O dată, scurt, cu ziua și luna când se știu: „12 martie 1932”, „12.03.1932” și „12 MAR 1932” devin „12.03.1932”;
 * „martie 1985” devine „03.1985”; „cca. 1870”, „înainte de 1900” și anii simpli rămân cum sunt.
 */
export function shortDate(text: string | null | undefined): string {
  const t = text?.trim();
  if (!t) return "";
  const r = parseFuzzyDate(t);
  if (!r.year || !r.from || !r.to) return t;
  const s = t.toUpperCase();
  const prefix = /^(BEF|ÎNAINTE DE|INAINTE DE)\b/.test(s) ? "înainte de " : /^(AFT|DUPĂ|DUPA)\b/.test(s) ? "după " : r.approx ? "cca. " : "";
  if (prefix === "înainte de " || prefix === "după ") return `${prefix}${r.year}`;
  const [y, m, d] = r.from.split("-");
  if (r.from === r.to) return `${prefix}${d}.${m}.${y}`;
  if (r.from.slice(0, 7) === r.to.slice(0, 7)) return `${prefix}${m}.${y}`;
  return `${prefix}${r.year}`;
}

/** Nașterea și moartea, cu ziua și luna când se știu: „12.03.1932–05.11.2008”, „cca. 1870–1931”, „12.03.1985” pentru cei în viață. */
export function lifeDates(p?: Pick<PersonView, "birthText" | "deathText" | "approx" | "birthYear" | "deathYear" | "living">) {
  if (!p) return "";
  const b = shortDate(p.birthText), d = shortDate(p.deathText);
  if (!b && !d) return years(p);
  if (p.living && !d) return b;
  return `${b || "?"}–${d || "?"}`;
}

/** Taie un text prea lung pentru locul în care încape, cu „…” la capăt. */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

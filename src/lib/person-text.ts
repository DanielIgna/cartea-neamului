import type { PersonView } from "./tree-data";

/**
 * Bucăți de text despre o persoană, folosite și în paginile de pe server (profilul, cartea), și în desenele din browser.
 * Stau aici, nu în desene: o funcție dintr-un fișier „use client” nu poate fi chemată de pe server.
 */

/** „1898–1967”, „cca. 1870–?”, „1988” pentru cei în viață. */
export const years = (p?: Pick<PersonView, "approx" | "birthYear" | "deathYear" | "living">) =>
  !p ? "" : `${p.approx ? "cca. " : ""}${p.birthYear ?? "?"}${p.deathYear ? `–${p.deathYear}` : p.living ? "" : "–?"}`;

/** Taie un text prea lung pentru locul în care încape, cu „…” la capăt. */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

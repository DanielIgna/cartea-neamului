/**
 * Scorul de calitate al paginilor făcute din date (planul SEO, etapa 4, 18.11.2026). Pentru fiecare pagină dintr-un tip
 * (nume, localități…) numărăm:
 *  - cuvintele proprii: cele din frazele care nu se repetă pe alte pagini de același tip. O frază se socotește „comună”
 *    și când diferă doar prin numele paginii („Numele Pop apare…” și „Numele Popa apare…” sunt aceeași frază);
 *  - procentul de fraze comune (cuvintele din frazele comune, din totalul cuvintelor paginii);
 *  - datele specifice (variante, regiuni, județe, sens…), legăturile interne și întrebările frecvente.
 * Ținta din plan: cel puțin TARGET_OWN_WORDS cuvinte proprii și sub TARGET_MAX_COMMON% fraze comune.
 * Calcul pur pe text, fără bază de date, ca să se poată testa și arăta în Admin → SEO → Indexare.
 */
export const TARGET_OWN_WORDS = 400;
export const TARGET_MAX_COMMON = 40;
/** O frază care apare pe mai mult de atâtea pagini de același tip e text comun. */
export const SHARED_AFTER = 3;

export type PageText = {
  path: string;
  /** Numele paginii (și variantele lui), înlocuite cu „X” când comparăm frazele. */
  names: string[];
  /** Tot textul vizibil al paginii, pe paragrafe (le împărțim noi în fraze). */
  paragraphs: string[];
  facts: number; links: number; faq: number;
};

export type QualityScore = {
  path: string; words: number; own: number; commonPct: number; facts: number; links: number; faq: number;
  /** 0–100: jumătate cuvintele proprii (față de țintă), jumătate fraze unice. */
  score: number; meetsTarget: boolean;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const clean = (s: string) => s.replace(/[*_]/g, "");
export const sentences = (p: string) => clean(p).split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter(Boolean);
const countWords = (s: string) => s.split(/\s+/).filter((w) => /\p{L}|\d/u.test(w)).length;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Forma de comparat a unei fraze: fără diacritice, semne și fără numele paginii. */
export function sentenceKey(s: string, names: string[]): string {
  let x = fold(s);
  for (const n of [...names].sort((a, b) => b.length - a.length)) if (n.trim()) x = x.replace(new RegExp(`(?<![\\p{L}])${escape(fold(n))}(?![\\p{L}])`, "gu"), "x");
  return x.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function scorePages(pages: PageText[]): Map<string, QualityScore> {
  const split = pages.map((p) => ({ p, lines: p.paragraphs.flatMap(sentences).map((s) => ({ s, k: sentenceKey(s, p.names), w: countWords(s) })) }));
  const freq = new Map<string, number>();
  for (const { lines } of split) for (const k of new Set(lines.map((l) => l.k))) if (k) freq.set(k, (freq.get(k) ?? 0) + 1);
  const out = new Map<string, QualityScore>();
  for (const { p, lines } of split) {
    const words = lines.reduce((a, l) => a + l.w, 0);
    const own = lines.filter((l) => (freq.get(l.k) ?? 1) <= SHARED_AFTER).reduce((a, l) => a + l.w, 0);
    const commonPct = words ? Math.round(((words - own) / words) * 100) : 100;
    const score = Math.round(50 * Math.min(1, own / TARGET_OWN_WORDS) + 50 * (1 - commonPct / 100));
    out.set(p.path, { path: p.path, words, own, commonPct, facts: p.facts, links: p.links, faq: p.faq, score, meetsTarget: own >= TARGET_OWN_WORDS && commonPct < TARGET_MAX_COMMON });
  }
  return out;
}

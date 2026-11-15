/**
 * Controlul de calitate al motorului de publicare (Daniel, 14.11.2026): o pagină intră în Google doar dacă are
 *  - cel puțin MIN_UNIQUE_WORDS cuvinte unice: cuvintele din propozițiile care nu se repetă pe alte pagini de același fel
 *    (textul comun, ca sfaturile despre registre, nu se numără);
 *  - cel puțin MIN_FACTS date proprii (populația, satele, vecinii…);
 *  - cel mult MAX_SIMILARITY% asemănare cu cea mai apropiată pagină de același fel (bucăți de câte 5 cuvinte comune).
 * Altfel rămâne „noindex” până se completează. Totul e calcul pe text, fără bază de date, ca să se poată testa.
 */
export const MIN_UNIQUE_WORDS = 300;
export const MIN_FACTS = 3;
export const MAX_SIMILARITY = 60;
/** O propoziție care apare pe mai mult de atâtea pagini de același fel e text comun. */
export const COMMON_LINE_PAGES = 3;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export const wordsOf = (s: string) => (norm(s) ? norm(s).split(" ") : []);

/** Câte pagini conțin fiecare rând (după forma fără diacritice și semne). */
export function lineFrequency(pages: string[][]): Map<string, number> {
  const f = new Map<string, number>();
  for (const lines of pages) for (const l of new Set(lines.map(norm))) if (l) f.set(l, (f.get(l) ?? 0) + 1);
  return f;
}

export function uniqueWords(lines: string[], freq: Map<string, number>) {
  return lines.filter((l) => (freq.get(norm(l)) ?? 1) <= COMMON_LINE_PAGES).reduce((n, l) => n + wordsOf(l).length, 0);
}

export function shingles(lines: string[], n = 5): Set<string> {
  const w = wordsOf(lines.join(" "));
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** Asemănarea a două pagini, în procente (Jaccard pe bucăți de 5 cuvinte). */
export function similarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const x of a) if (b.has(x)) common++;
  return Math.round((common / (a.size + b.size - common)) * 100);
}

export type Quality = { ok: boolean; words: number; unique: number; facts: number; similarity: number; closest: string | null; reasons: string[] };

export function judge(p: { lines: string[]; facts: string[] }, freq: Map<string, number>, others: { path: string; sh: Set<string> }[]): Quality {
  const sh = shingles(p.lines);
  let best = 0, closest: string | null = null;
  for (const o of others) { const s = similarity(sh, o.sh); if (s > best) { best = s; closest = o.path; } }
  const unique = uniqueWords(p.lines, freq);
  const reasons: string[] = [];
  if (unique < MIN_UNIQUE_WORDS) reasons.push(`${unique} cuvinte unice (minimum ${MIN_UNIQUE_WORDS})`);
  if (p.facts.length < MIN_FACTS) reasons.push(`${p.facts.length} date proprii (minimum ${MIN_FACTS})`);
  if (best > MAX_SIMILARITY) reasons.push(`${best}% la fel cu ${closest} (maximum ${MAX_SIMILARITY}%)`);
  return { ok: !reasons.length, words: wordsOf(p.lines.join(" ")).length, unique, facts: p.facts.length, similarity: best, closest, reasons };
}

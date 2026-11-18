/**
 * Bugetele de viteză (planul SEO, secțiunea 10, 18.11.2026), verificate de scripts/bugete-viteza.ts pe 6 pagini tipice
 * (plus prima pagină), cu un telefon simulat. Pragurile sunt cele „bune” ale Google pentru Core Web Vitals:
 *   LCP (cel mai mare element afișat) < 2,5 s · CLS (cât sare pagina) < 0,1 · INP (răspunsul la o atingere) < 200 ms.
 * INP se măsoară doar pe oameni reali (Search Console → Core Web Vitals); în probă folosim în locul lui TBT (cât stă
 * blocat browserul), cu pragul de 200 ms, ca semn timpuriu. HTML-ul paginilor de conținut rămâne sub 120 KB.
 */
export type Budget = { lcpMs: number; cls: number; tbtMs: number; htmlKb: number };
export const CONTENT_BUDGET: Budget = { lcpMs: 2500, cls: 0.1, tbtMs: 200, htmlKb: 120 };
/** Prima pagină: are galeria, prețurile și toate secțiunile, deci HTML-ul e mai mare (acum ~140 KB); ținta e să scadă. */
export const HOME_BUDGET: Budget = { ...CONTENT_BUDGET, htmlKb: 160 };

export const BUDGET_PAGES: { path: string; label: string; budget: Budget }[] = [
  { path: "/", label: "Prima pagină", budget: HOME_BUDGET },
  { path: "/ghid/cum-ceri-un-act-de-stare-civila", label: "Ghid", budget: CONTENT_BUDGET },
  { path: "/nume/mocanu", label: "Nume de familie", budget: CONTENT_BUDGET },
  { path: "/localitati/cluj", label: "Județ", budget: CONTENT_BUDGET },
  { path: "/cadouri/botez", label: "Cadou", budget: CONTENT_BUDGET },
  { path: "/unelte/calculator-grad-de-rudenie", label: "Unealtă", budget: CONTENT_BUDGET },
  { path: "/diaspora/italia", label: "Diaspora", budget: CONTENT_BUDGET },
];

export type Measure = { path: string; lcpMs: number | null; cls: number; tbtMs: number; htmlKb: number };

/** Ce depășește bugetul, pe înțeles („LCP 3,1 s, peste 2,5 s”). Gol = în buget. */
export function overBudget(m: Measure, b: Budget): string[] {
  const out: string[] = [];
  const s = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
  if (m.lcpMs == null) out.push("LCP nemăsurat");
  else if (m.lcpMs > b.lcpMs) out.push(`LCP ${s(m.lcpMs)}, peste ${s(b.lcpMs)}`);
  if (m.cls > b.cls) out.push(`CLS ${m.cls.toFixed(2)}, peste ${b.cls}`);
  if (m.tbtMs > b.tbtMs) out.push(`TBT ${Math.round(m.tbtMs)} ms, peste ${b.tbtMs} ms`);
  if (m.htmlKb > b.htmlKb) out.push(`HTML ${Math.round(m.htmlKb)} KB, peste ${b.htmlKb} KB`);
  return out;
}

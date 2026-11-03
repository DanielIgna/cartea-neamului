/**
 * Interpretează date genealogice în română sau GEDCOM: "1898", "cca. 1870", "ABT 1870", "12 MAR 1901", "12.03.1985",
 * "12 martie 1985", "1985-03-12", "martie 1985", "înainte de 1900".
 */
const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  IAN: 1, IANUARIE: 1, FEBRUARIE: 2, MARTIE: 3, APRILIE: 4, MAI: 5, IUN: 6, IUNIE: 6, IUL: 7, IULIE: 7, AUGUST: 8,
  SEPT: 9, SEPTEMBRIE: 9, OCTOMBRIE: 10, NOI: 11, NOIEMBRIE: 11, DECEMBRIE: 12,
};
const pad = (n: number) => String(n).padStart(2, "0");

export type DateRange = { from: string | null; to: string | null; year: number | null; approx: boolean };

/** „1985-03-12”, doar dacă ziua există cu adevărat (nu 31 februarie). */
function day(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
}

export function parseFuzzyDate(input: string | null | undefined): DateRange {
  const empty = { from: null, to: null, year: null, approx: false };
  if (!input) return empty;
  const s = input.trim().toUpperCase();
  const approx = /^(ABT|CA\.?|CCA\.?|CIRCA|EST|CAL)\b/.test(s);
  const before = /^(BEF|ÎNAINTE DE|INAINTE DE)\b/.test(s);
  const after = /^(AFT|DUPĂ|DUPA)\b/.test(s);
  // O zi anume: „12 MAR 1901”, „12 martie 1985”, „12 mar. 1985”, „12.03.1985”, „12/03/1985”, „1985-03-12”.
  const iso = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  const num = s.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  const txt = s.match(/\b(\d{1,2})\s*([A-Z]+)\.?\s*(\d{4})\b/);
  const d = iso ? day(+iso[1], +iso[2], +iso[3]) : num ? day(+num[3], +num[2], +num[1]) : txt && MONTHS[txt[2]] ? day(+txt[3], MONTHS[txt[2]], +txt[1]) : null;
  if (d) return { from: d, to: d, year: +d.slice(0, 4), approx };
  // O lună: „martie 1985”, „03.1985”.
  const mNum = s.match(/(?:^|[^\d.])(\d{1,2})[./-](\d{4})\b/);
  const mTxt = s.match(/\b([A-Z]+)\.?\s+(\d{4})\b/);
  const [my, mm] = mNum && +mNum[1] >= 1 && +mNum[1] <= 12 ? [+mNum[2], +mNum[1]] : mTxt && MONTHS[mTxt[1]] ? [+mTxt[2], MONTHS[mTxt[1]]] : [0, 0];
  if (my && !before && !after) {
    const last = new Date(Date.UTC(my, mm, 0)).getUTCDate();
    return { from: `${my}-${pad(mm)}-01`, to: `${my}-${pad(mm)}-${pad(last)}`, year: my, approx };
  }
  const y = s.match(/(\d{4})/);
  if (!y) return empty;
  const year = +y[1];
  const span = approx ? 2 : 0;
  if (before) return { from: `${year - 20}-01-01`, to: `${year}-01-01`, year, approx: true };
  if (after) return { from: `${year}-01-01`, to: `${year + 20}-12-31`, year, approx: true };
  return { from: `${year - span}-01-01`, to: `${year + span}-12-31`, year, approx };
}

/** Ziua exactă, dacă data e scrisă complet („12.03.1985” → „1985-03-12”); altfel null (doar anul, „cca.”, „înainte de”). */
export function exactDay(input: string | null | undefined): string | null {
  const r = parseFuzzyDate(input);
  return r.from && r.from === r.to && !r.approx ? r.from : null;
}

/** Interpretează date genealogice în română sau GEDCOM: "1898", "cca. 1870", "ABT 1870", "12 MAR 1901", "înainte de 1900". */
const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const pad = (n: number) => String(n).padStart(2, "0");

export type DateRange = { from: string | null; to: string | null; year: number | null; approx: boolean };

export function parseFuzzyDate(input: string | null | undefined): DateRange {
  const empty = { from: null, to: null, year: null, approx: false };
  if (!input) return empty;
  const s = input.trim().toUpperCase();
  const approx = /^(ABT|CA\.?|CCA\.?|CIRCA|EST|CAL)\b/.test(s);
  const before = /^(BEF|ÎNAINTE DE|INAINTE DE)\b/.test(s);
  const after = /^(AFT|DUPĂ|DUPA)\b/.test(s);
  const full = s.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/);
  if (full && MONTHS[full[2]]) {
    const d = `${full[3]}-${pad(MONTHS[full[2]])}-${pad(+full[1])}`;
    return { from: d, to: d, year: +full[3], approx };
  }
  const y = s.match(/(\d{4})/);
  if (!y) return empty;
  const year = +y[1];
  const span = approx ? 2 : 0;
  if (before) return { from: `${year - 20}-01-01`, to: `${year}-01-01`, year, approx: true };
  if (after) return { from: `${year}-01-01`, to: `${year + 20}-12-31`, year, approx: true };
  return { from: `${year - span}-01-01`, to: `${year + span}-12-31`, year, approx };
}

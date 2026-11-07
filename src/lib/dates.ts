/**
 * Interpretează date genealogice scrise de mână sau din GEDCOM: "1898", "cca. 1870", "ABT 1870", "12 MAR 1901", "12.03.1985",
 * "12 martie 1985", "1985-03-12", "martie 1985", "înainte de 1900". Și cum le scriu cei din diaspora, în limbile site-ului:
 * „12 März 1970”, „12 de marzo de 1970”, „March 12, 1970”, „1970. március 12.”, „1970. 03. 12.”, „about 1870”, „vor 1900”.
 * Cu cifre, ziua vine întâi (12.03.1985 e 12 martie); doar dacă anul e primul, ordinea e an, lună, zi.
 */
const MONTH_NAMES: string[][] = [
  ["JAN", "JANUARY", "IAN", "IANUARIE", "JANV", "JANVIER", "ENE", "ENERO", "JANUARI", "JANUAR", "JANNER", "GEN", "GENNAIO"],
  ["FEB", "FEBRUARY", "FEBRUARIE", "FEV", "FEVR", "FEVRIER", "FEBRERO", "FEBRUARI", "FEBRUAR", "FEBBRAIO", "FEBR"],
  ["MAR", "MARCH", "MARTIE", "MARS", "MARZO", "MAART", "MRT", "MARZ", "MRZ", "MARC", "MARCIUS"],
  ["APR", "APRIL", "APRILIE", "AVR", "AVRIL", "ABR", "ABRIL", "APRILE", "APRILIS"],
  ["MAY", "MAI", "MAYO", "MEI", "MAG", "MAGGIO", "MAJ", "MAJUS"],
  ["JUN", "JUNE", "IUN", "IUNIE", "JUIN", "JUNIO", "JUNI", "GIU", "GIUGNO", "JUNIUS"],
  ["JUL", "JULY", "IUL", "IULIE", "JUIL", "JUILLET", "JULIO", "JULI", "LUG", "LUGLIO", "JULIUS"],
  ["AUG", "AUGUST", "AOUT", "AGO", "AGOSTO", "AUGUSTUS", "AUGUSZTUS"],
  ["SEP", "SEPT", "SEPTEMBER", "SEPTEMBRIE", "SEPTEMBRE", "SEPTIEMBRE", "SETIEMBRE", "SET", "SETTEMBRE", "SZEPT", "SZEPTEMBER"],
  ["OCT", "OCTOBER", "OCTOMBRIE", "OCTOBRE", "OCTUBRE", "OKT", "OKTOBER", "OTT", "OTTOBRE"],
  ["NOV", "NOVEMBER", "NOI", "NOIEMBRIE", "NOVEMBRE", "NOVIEMBRE"],
  ["DEC", "DECEMBER", "DECEMBRIE", "DECEMBRE", "DIC", "DICIEMBRE", "DEZ", "DEZEMBER", "DICEMBRE"],
];
/** Numele lunilor (litere mari, fără diacritice: „MÄRZ” → „MARZ”), în română, GEDCOM și limbile site-ului. */
const MONTHS: Record<string, number> = Object.fromEntries(MONTH_NAMES.flatMap((names, i) => names.map((n) => [n, i + 1])));
const pad = (n: number) => String(n).padStart(2, "0");

// „Cam”, „înainte”, „după”, în față („ABT 1870”, „um 1870”) sau, în maghiară, după an („1870 körül”, „1900 előtt”).
const APPROX = /^(ABT|ABOUT|AROUND|CA\.?|CCA\.?|CIRCA|C\.|EST|CAL|VERS|ENVIRON|UM|ETWA|HACIA|VERSO|OMSTREEKS|ROND|KB\.?|KORULBELUL)(?=[\s\d]|$)|\bKORUL$/;
const BEFORE = /^(BEF|BEFORE|INAINTE DE|AVANT|VOR|ANTES DE|ANTES|PRIMA DEL|PRIMA DI|VOOR)\b|\bELOTT$/;
const AFTER = /^(AFT|AFTER|DUPA|APRES|NACH|DESPUES DE|DESPUES|DOPO IL|DOPO|NA)\b|\bUTAN$/;

/** `side`: „înainte de 1900” / „după 1900” (în orice limbă), ca să se poată scrie la fel în limba celui care citește. */
export type DateRange = { from: string | null; to: string | null; year: number | null; approx: boolean; side?: "before" | "after" };

/** „1985-03-12”, doar dacă ziua există cu adevărat (nu 31 februarie). */
function day(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
}

export function parseFuzzyDate(input: string | null | undefined): DateRange {
  const empty = { from: null, to: null, year: null, approx: false };
  if (!input) return empty;
  // Litere mari, fără diacritice; pentru zi și lună, și fără „de” spaniol: „12 de marzo de 1970” → „12 MARZO 1970”.
  const u = input.trim().toUpperCase().normalize("NFD").replace(/\p{M}/gu, "");
  const approx = APPROX.test(u);
  const before = BEFORE.test(u);
  const after = AFTER.test(u);
  const s = u.replace(/(\d)\.?\s+DE\s+([A-Z])/g, "$1 $2").replace(/([A-Z])\s+DEL?\s+(\d)/g, "$1 $2");
  const month = (name: string) => MONTHS[name] ?? 0;
  // O zi anume, cu cifre („12.03.1985”, „12/03/1985”, „1985-03-12”, „1970. 03. 12.”) sau cu numele lunii („12 martie 1985”,
  // „12. März 1985”, „1970. március 12.”, „March 12, 1970”).
  const ymd = s.match(/\b(\d{4})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})\b/);
  const dmy = s.match(/\b(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})\b/);
  const dTy = s.match(/\b(\d{1,2})\.?\s*([A-Z]+)\.?,?\s*(\d{4})\b/);
  const yTd = s.match(/\b(\d{4})\.?\s*([A-Z]+)\.?\s*(\d{1,2})\b/);
  const Tdy = s.match(/\b([A-Z]+)\.?\s+(\d{1,2}),?\s+(\d{4})\b/);
  const d = (ymd && day(+ymd[1], +ymd[2], +ymd[3]))
    || (dmy && day(+dmy[3], +dmy[2], +dmy[1]))
    || (dTy && month(dTy[2]) && day(+dTy[3], month(dTy[2]), +dTy[1]))
    || (yTd && month(yTd[2]) && day(+yTd[1], month(yTd[2]), +yTd[3]))
    || (Tdy && month(Tdy[1]) && day(+Tdy[3], month(Tdy[1]), +Tdy[2]))
    || null;
  if (d) return { from: d, to: d, year: +d.slice(0, 4), approx };
  // O lună: „martie 1985”, „03.1985”, „1985-03”, „1985. március”.
  const mNum = s.match(/(?:^|[^\d.])(\d{1,2})[./-](\d{4})\b/);
  const yNum = s.match(/\b(\d{4})\s*[-./]\s*(\d{1,2})\b(?!\s*[-./]\s*\d)/);
  const mTxt = s.match(/\b([A-Z]+)\.?\s+(\d{4})\b/);
  const yTxt = s.match(/\b(\d{4})\.?\s*([A-Z]+)\b/);
  const ok = (m: number) => m >= 1 && m <= 12;
  const [my, mm] = mNum && ok(+mNum[1]) ? [+mNum[2], +mNum[1]]
    : yNum && ok(+yNum[2]) ? [+yNum[1], +yNum[2]]
    : mTxt && month(mTxt[1]) ? [+mTxt[2], month(mTxt[1])]
    : yTxt && month(yTxt[2]) ? [+yTxt[1], month(yTxt[2])]
    : [0, 0];
  if (my && !before && !after) {
    const last = new Date(Date.UTC(my, mm, 0)).getUTCDate();
    return { from: `${my}-${pad(mm)}-01`, to: `${my}-${pad(mm)}-${pad(last)}`, year: my, approx };
  }
  const y = s.match(/(\d{4})/);
  if (!y) return empty;
  const year = +y[1];
  const span = approx ? 2 : 0;
  if (before) return { from: `${year - 20}-01-01`, to: `${year}-01-01`, year, approx: true, side: "before" };
  if (after) return { from: `${year}-01-01`, to: `${year + 20}-12-31`, year, approx: true, side: "after" };
  return { from: `${year - span}-01-01`, to: `${year + span}-12-31`, year, approx };
}

/**
 * Data scrisă de mână, cum o păstrăm. În engleza americană luna vine întâi („03/12/1970” e 12 martie): o scriem 1970-03-12,
 * ca nici rudele, nici site-ul să n-o citească drept 3 decembrie. În celelalte limbi ziua vine întâi, deci rămâne cum e.
 */
export function normalizeTypedDate(text: string, locale: string): string {
  if (locale !== "en-US") return text;
  const m = text.trim().match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})$/);
  return (m && day(+m[3], +m[1], +m[2])) || text;
}

/** Ziua exactă, dacă data e scrisă complet („12.03.1985” → „1985-03-12”); altfel null (doar anul, „cca.”, „înainte de”). */
export function exactDay(input: string | null | undefined): string | null {
  const r = parseFuzzyDate(input);
  return r.from && r.from === r.to && !r.approx ? r.from : null;
}

/**
 * Ce a scris vizitatorul în „Începe chiar acum” de pe prima pagină (src/components/TryTree.tsx), ținut doar în browserul lui
 * până își face contul: atunci primii pași (src/components/QuickStart.tsx) pornesc cu numele deja completate.
 * Nu pleacă nicăieri și nu se numără: după ce se face arborele, se șterge. După 7 zile nu se mai folosește.
 */
export type StartDraft = { given: string; surname: string; father: string; mother: string; at: number };

const KEY = "cn-incepe";
const MAX_AGE = 7 * 24 * 3600 * 1000;
const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 60) : "");

export function readDraft(): StartDraft | null {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<StartDraft> | null;
    if (!raw || typeof raw.at !== "number" || Date.now() - raw.at > MAX_AGE) return null;
    const d = { given: clean(raw.given), surname: clean(raw.surname), father: clean(raw.father), mother: clean(raw.mother), at: raw.at };
    return d.given ? d : null;
  } catch { return null; }
}

export function saveDraft(d: Omit<StartDraft, "at">) {
  try { window.localStorage.setItem(KEY, JSON.stringify({ ...d, at: Date.now() })); } catch { /* fără loc în browser: pornește de la zero */ }
}

export function clearDraft() {
  try { window.localStorage.removeItem(KEY); } catch { /* nimic */ }
}

import type { Faq } from "../tipuri";
import type { Ui, XUi } from "../ui";

/**
 * O limbă nouă a paginilor de diaspora (Daniel, 24.11.2026: „tradu în limbile noi cele 9”): textele comune (ui, x), numele
 * țărilor pentru prima pagină și, pentru țara limbii (Portugalia → pt, Grecia și Cipru → el …), pagina ei întreagă și orașele ei.
 * Faptele sunt cele din textul românesc verificat (tari.ts, extins*.ts, orase*.ts); nimic nou, nicio cifră în plus.
 */
export type NewCountry = {
  where: string; size?: string; icr?: string;
  history: string[];
  /** Notele arhivelor țării (c.records), în aceeași ordine. */
  records?: string[];
  guide: string[]; specifics: string[]; faq: Faq[];
  /** Nota sursei cu cifrele comunității (ex.stats). */
  stats?: string;
};
export type NewRegion = { name: string; where: string; notes: string[] };
export type NewLang = {
  ui: Ui; x: XUi;
  /** Notele celor 4 surse din România (ROMANIA_LINKS), în aceeași ordine. */
  romania: [string, string, string, string];
  /** Numele țărilor (slug → nume), pentru prima pagină și legături. */
  names: Record<string, string>;
  countries: Record<string, NewCountry>;
  /** „<țară>/<slug>” → orașul sau regiunea. */
  regions?: Record<string, NewRegion>;
};

/**
 * Cine ține site-ul și cum i se scrie, plus versiunile textelor la care oamenii își dau acordul.
 *
 * Numele și adresa de contact vin din variabilele de mediu OPERATOR_NAME și CONTACT_EMAIL (puse pe Vercel), ca adresa de email
 * să nu stea în codul public și să se poată schimba fără o nouă versiune (de pildă când în locul omului vine o firmă).
 */
export const LEGAL_UPDATED = "6 noiembrie 2026";
export const TERMS_VERSION = "2026-11-06";
export const FAITH_VERSION = "2026-11-06";

/** Acordurile păstrate în tabelul `consent`: termenii (la crearea contului) și capitolul „Credința” (date ocrotite mai strict). */
export type ConsentPurpose = "terms" | "faith";
export const CONSENT_VERSION: Record<ConsentPurpose, string> = { terms: TERMS_VERSION, faith: FAITH_VERSION };

/** Textul acordului pentru capitolul „Credința”, așa cum îl bifează omul. */
export const FAITH_CONSENT_TEXT = "Sunt de acord ca ce scriu despre credința mea să fie păstrat în Cartea Neamului și văzut doar de cei pe care îi aleg. "
  + "Îmi pot retrage acordul oricând, din „Datele mele”, iar atunci răspunsurile din acest capitol se șterg.";

/** Cine răspunde de date: numele și adresa de contact, dacă sunt puse. */
export function operator() {
  return { name: process.env.OPERATOR_NAME?.trim() || null, email: process.env.CONTACT_EMAIL?.trim() || null };
}

/** Vârsta de la care cineva își poate face cont. */
export const MIN_AGE = 16;

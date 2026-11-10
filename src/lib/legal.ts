/**
 * Cine ține site-ul și cum i se scrie, plus versiunile textelor la care oamenii își dau acordul.
 *
 * Cât timp site-ul e în probă, fără firmă, de el răspunde Daniel Igna, ca persoană fizică. Variabilele de mediu OPERATOR_NAME
 * și CONTACT_EMAIL (puse pe Vercel) le înlocuiesc fără o nouă versiune, de pildă când în locul omului vine o firmă.
 */
/** Ziua ultimei schimbări a Termenilor (scrisă în limba cititorului pe pagină). */
export const TERMS_DATE = new Date("2026-11-06T12:00:00Z");
/** Ultima schimbare a Politicii de confidențialitate (partenerul PropManage și cookie-ul `limba`); Termenii au rămas din 6 noiembrie. */
export const PRIVACY_DATE = new Date("2026-11-10T12:00:00Z");
export const TERMS_VERSION = "2026-11-06";
export const FAITH_VERSION = "2026-11-06";
export const USAGE_VERSION = "2026-11-06";

/**
 * Acordurile păstrate în tabelul `consent`: termenii (la crearea contului), capitolul „Credința” (date ocrotite mai strict) și
 * măsurarea timpului petrecut în site („usage”, cerută o singură dată, cu „Bine” sau „Nu vreau”).
 */
export type ConsentPurpose = "terms" | "faith" | "usage";
export const CONSENT_VERSION: Record<ConsentPurpose, string> = { terms: TERMS_VERSION, faith: FAITH_VERSION, usage: USAGE_VERSION };
export const CONSENT_LABEL: Record<ConsentPurpose, string> = {
  terms: "Termenii și Politica de confidențialitate", faith: "Capitolul „Credința”", usage: "Cât timp folosesc site-ul și ce părți din el",
};

/** Ce află cel care ține site-ul dacă omul spune „Bine”, cum îl citește omul în anunț. */
export const USAGE_CONSENT_TEXT = "Ca să facem Cartea Neamului mai bună, am vrea să știm cât timp stai în site și ce părți din el folosești "
  + "(arborele, lada cu amintiri, harta...). Doar timpul și numele părții, nu ce scrii și nici pe ce apeși. Poți opri oricând, din „Datele mele”.";

/** Textul acordului pentru capitolul „Credința”, așa cum îl bifează omul. */
export const FAITH_CONSENT_TEXT = "Sunt de acord ca ce scriu despre credința mea să fie păstrat în Cartea Neamului și văzut doar de cei pe care îi aleg. "
  + "Îmi pot retrage acordul oricând, din „Datele mele”, iar atunci răspunsurile din acest capitol se șterg.";

/**
 * Site-ul e în probă (beta): îl folosesc doar familia și prietenii apropiați, ca să spună ce merge și ce nu. Înainte să se
 * deschidă tuturor (sau să coste ceva) vin firma, datele ANPC și textele citite de un avocat; atunci se pune `false`.
 */
export const BETA = true;

// Puse aici la cererea lui Daniel (6 noiembrie 2026), care a ales ca adresa să fie publică, pe site și în cod.
const OPERATOR_DEFAULT = "Daniel Igna";
const CONTACT_DEFAULT = "danieligna1@gmail.com";

/** Cine răspunde de date: numele (`person`: omul însuși, nu o firmă) și adresa de contact. */
export function operator() {
  const name = process.env.OPERATOR_NAME?.trim();
  return { name: name || OPERATOR_DEFAULT, person: !name, email: process.env.CONTACT_EMAIL?.trim() || CONTACT_DEFAULT };
}

/** Vârsta de la care cineva își poate face cont. */
export const MIN_AGE = 16;

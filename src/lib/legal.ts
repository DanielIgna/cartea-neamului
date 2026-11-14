/**
 * Cine ține site-ul și cum i se scrie, plus versiunile textelor la care oamenii își dau acordul.
 *
 * Din 12 noiembrie 2026 seara de site răspunde PFA-ul lui Daniel, IGNA IOAN DANIEL PERSOANĂ FIZICĂ AUTORIZATĂ (cerut de el, cu
 * certificatul de înregistrare; înainte, în aceeași zi, era VINTAGE FURNITURE SRL). Variabilele de mediu OPERATOR_NAME și CONTACT_EMAIL (puse pe Vercel) le înlocuiesc fără o nouă versiune.
 */
/** Ziua ultimei schimbări a Termenilor (scrisă în limba cititorului pe pagină). */
// 14 noiembrie 2026: §5 spune cum merg cardurile cadou vândute în magazine (doar informativ, fără acord nou).
export const TERMS_DATE = new Date("2026-11-14T10:00:00Z");
/**
 * Ultima schimbare a Politicii de confidențialitate (14 noiembrie: cardurile cadou din magazine, codul și amprenta IP de o zi; 13 noiembrie seara: vizitele numărate anonim, fără cookie-uri, pentru Admin → Analiză; ora 15: emailurile site-ului pleacă prin Resend, inclusiv Contactul și cererile ADN, FormSubmit rămâne doar rezervă; după-amiază: siguranța contului, adică verificarea în 2 pași, jurnalul de securitate, cookie-ul cn_dispozitiv și Cloudflare Turnstile; la prânz: „Raportează o problemă”, cu pozele ecranului; 13 noiembrie: Păstrarea arborelui și cookie-ul anunțului ei; tot pe 13, după auditul juridic: plățile și darurile, temeiul obligației legale,
 * contabilul și ANAF, Resend, transferurile spuse exact (FormSubmit fără contract), păstrarea plăților, opoziția, copiii, cookie-urile Stripe; 12 noiembrie: operatorul e PFA-ul lui Daniel, plățile prin Stripe; 11 noiembrie:
 * pozele propuse pentru prima pagină, pagina Contact și WhatsApp, serverul din Frankfurt, istoricul schimbărilor văzut de admin,
 * lista întreagă a cookie-urilor și a ce ține browserul).
 */
export const PRIVACY_DATE = new Date("2026-11-14T10:00:00Z");
export const TERMS_VERSION = "2026-11-13-pastrare";
export const FAITH_VERSION = "2026-11-06";
export const USAGE_VERSION = "2026-11-06";
/** Sfaturile pe email de bun venit (14 noiembrie 2026), cu dezabonare dintr-un clic. */
export const NEWS_VERSION = "2026-11-14";

/**
 * Acordurile păstrate în tabelul `consent`: termenii (la crearea contului), capitolul „Credința” (date ocrotite mai strict) și
 * măsurarea timpului petrecut în site („usage”, cerută o singură dată, cu „Bine” sau „Nu vreau”).
 */
export type ConsentPurpose = "terms" | "faith" | "usage" | "withdrawal" | "news";
export const WITHDRAWAL_VERSION = "2026-11-12";
export const CONSENT_VERSION: Record<ConsentPurpose, string> = { terms: TERMS_VERSION, faith: FAITH_VERSION, usage: USAGE_VERSION, withdrawal: WITHDRAWAL_VERSION, news: NEWS_VERSION };
export const CONSENT_LABEL: Record<ConsentPurpose, string> = {
  terms: "Termenii și Politica de confidențialitate", faith: "Capitolul „Credința”", usage: "Cât timp folosesc site-ul și ce părți din el",
  withdrawal: "La plată: accesul începe imediat, fără cele 14 zile de retragere (OUG 34/2014, art. 16 lit. m)",
  news: "Sfaturi pe email în primele trei săptămâni (cu dezabonare dintr-un clic)",
};

/** Ce află cel care ține site-ul dacă omul spune „Bine”, cum îl citește omul în anunț. */
export const USAGE_CONSENT_TEXT = "Ca să facem Cartea Neamului mai bună, am vrea să știm cât timp stai în site și ce părți din el folosești "
  + "(arborele, lada cu amintiri, harta...). Doar timpul și numele părții, nu ce scrii și nici pe ce apeși. Poți opri oricând, din „Datele mele”.";

/** Textul acordului pentru capitolul „Credința”, așa cum îl bifează omul. */
export const FAITH_CONSENT_TEXT = "Sunt de acord ca ce scriu despre credința mea să fie păstrat în Cartea Neamului și văzut doar de cei pe care îi aleg. "
  + "Îmi pot retrage acordul oricând, din „Datele mele”, iar atunci răspunsurile din acest capitol se șterg.";

/**
 * Site-ul e în probă (beta): îl folosesc doar familia și prietenii apropiați, ca să spună ce merge și ce nu. Înainte să se
 * deschidă tuturor (sau să coste ceva) vin datele ANPC și textele citite de un avocat; atunci se pune `false`.
 */
// 13 noiembrie 2026: vânzarea e pornită, deci textele „doar familia și prietenii” nu mai sunt adevărate (auditul juridic).
export const BETA = false;

/** PFA-ul care răspunde de site și de date (operator GDPR), cu datele din certificatul de înregistrare (ONRC Cluj, 13.02.2025). */
const OPERATOR_DEFAULT = {
  name: "IGNA IOAN DANIEL PERSOANĂ FIZICĂ AUTORIZATĂ",
  cui: "51278711",
  regCom: "F2025004245004",
  euid: "ROONRC.F2025004245004",
  address: "Aleea Negoiu nr. 8D, ap. 25, 400676 Cluj-Napoca, jud. Cluj, România",
};
// Adresa site-ului pentru cererile despre date (aceeași în care ajung și mesajele din pagina Contact).
const CONTACT_DEFAULT = "contact.carteaneamului@gmail.com";

/** Cine răspunde de date: firma, cu sediul și numerele ei, și adresa de contact. */
export function operator() {
  return { ...OPERATOR_DEFAULT, name: process.env.OPERATOR_NAME?.trim() || OPERATOR_DEFAULT.name, email: process.env.CONTACT_EMAIL?.trim() || CONTACT_DEFAULT };
}

/** Vârsta de la care cineva își poate face cont. */
export const MIN_AGE = 16;

/** Cookie-ul pus de „Am înțeles” pe anunțul despre cookie-uri, ca anunțul să nu mai apară pe acel dispozitiv (un an). */
export const COOKIE_NOTICE_COOKIE = "cn-cookie-uri";

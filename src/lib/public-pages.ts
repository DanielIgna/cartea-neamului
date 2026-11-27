import { LOCALES, NEW_LOCALES, type Locale } from "@/i18n/locales";
import { SHOP_PATH } from "@/lib/invitatii-nunta";

/**
 * Paginile publice pe care le vrem în Google: din ele se fac sitemap.xml, robots.txt și lista din Admin → SEO.
 * (Fără importuri de pe server, ca să poată fi folosit oriunde.)
 */
/** `roOnly`: conținutul e doar în română; adresele pe limbi (/it/…) trimit canonic la cea românească și nu intră în sitemap. */
export const PUBLIC_PAGES: { path: string; label: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly"; roOnly?: boolean }[] = [
  { path: "/", label: "Prima pagină", priority: 1, changeFrequency: "weekly" },
  { path: "/istoria-umanitatii", label: "Istoria umanității", priority: 0.7, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/crize", label: "Crizele care au schimbat lumea", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/primul-razboi-mondial", label: "Primul Război Mondial (1914–1918)", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/gripa-spaniola", label: "Gripa spaniolă (1918–1920)", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/anii-interbelici", label: "Între războaie (1919–1939)", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/al-doilea-razboi-mondial", label: "Al Doilea Război Mondial (1939–1945)", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/istoria-umanitatii/tiparul-istoriei", label: "Tiparul istoriei: ce a fost va mai fi", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/genealogii-vechi", label: "Genealogii vechi", priority: 0.6, changeFrequency: "monthly", roOnly: true },
  { path: "/libertatea-de-a-crede", label: "Libertatea de a crede", priority: 0.6, changeFrequency: "monthly" },
  { path: "/cadou-de-sarbatori", label: "Cadou de sărbători", priority: 0.7, changeFrequency: "monthly" },
  // Invitații de nuntă (Daniel, 27.11.2026): lista, în toate limbile. Paginile modelelor vin din baza de date (publicate din Admin)
  // și intră în sitemap de acolo (src/lib/invitatii-nunta-sitemap.ts).
  { path: SHOP_PATH, label: "Invitații de nuntă", priority: 0.7, changeFrequency: "weekly" },
  // Magazinul (Daniel, 27.11.2026): toate produsele și serviciile, cu linkul „Magazin” din antet.
  { path: "/produse", label: "Produse și servicii", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resurse-genealogie", label: "Resurse gratuite pentru genealogie", priority: 0.6, changeFrequency: "monthly" },
  { path: "/surse-publice", label: "Unde îți cauți strămoșii gratuit (surse publice)", priority: 0.7, changeFrequency: "monthly", roOnly: true },
  { path: "/contact", label: "Contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/parteneri", label: "Parteneri", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialitate", label: "Confidențialitate", priority: 0.3, changeFrequency: "yearly" },
  { path: "/termeni", label: "Termeni", priority: 0.3, changeFrequency: "yearly" },
];

/** Părțile private: arborii, invitațiile, mesajele, datele cuiva, intrarea în cont, plata și panoul de admin nu au ce căuta în Google. */
export const PRIVATE_PREFIXES = ["/admin", "/api/", "/invitatie/", "/arbore/", "/arbore-nou", "/primii-pasi", "/scoala-cod/", "/cod/", "/scoala/fisa/", "/datele-mele", "/mesaje", "/a/", "/intrare", "/intrare/eroare", "/plata", "/parteneri/dezabonare", "/dezabonare", "/cadou/", "/activeaza", "/magazin/", "/card/", "/card-imagine/", "/r/", "/widget/", "/invitatii-nunta/gata", "/api/invitatii-nunta/"];

/** Paginile din PUBLIC_PAGES care au text în limbile site-ului (toate sau, pentru limbile noi, cele din pageLocales). */
export const TRANSLATED_PAGES = PUBLIC_PAGES.filter((p) => !p.roOnly);

/**
 * Paginile încă netraduse în limbile adăugate pe 19.11.2026 (până atunci textul lor ar ieși în engleză): în acele limbi nu
 * au adresă proprie, nu intră în sitemap, iar /pt/termeni trimite la /termeni. Se scoate pagina de aici când e tradusă.
 */
const NOT_YET_TRANSLATED: Record<string, readonly Locale[]> = {
};

/** Limbile în care o pagină publică are text adevărat (româna mereu). */
export function pageLocales(path: string): readonly Locale[] {
  const page = PUBLIC_PAGES.find((p) => p.path === path);
  if (!page || page.roOnly) return ["ro"];
  const missing = NOT_YET_TRANSLATED[path] ?? [];
  return LOCALES.filter((l) => !missing.includes(l));
}

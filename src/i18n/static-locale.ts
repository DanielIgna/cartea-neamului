import { cache } from "react";
import type { Locale } from "./locales";

/**
 * Limba fixată pentru o pagină pregătită dinainte (fără cookie-uri): o pun layout-ul, pagina și generateMetadata din
 * app/(public), înainte de orice text. `cache` o ține doar pentru randarea în curs. Fișier separat, fără importuri de pe
 * server, ca page-metadata.ts s-o poată citi fără baza de date.
 */
const staticLocale = cache((): { locale: Locale | null } => ({ locale: null }));
export function setStaticLocale(locale: Locale) {
  staticLocale().locale = locale;
}
/** Limba fixată pentru pagina pregătită dinainte (null în paginile făcute pe loc). */
export const staticLocaleNow = (): Locale | null => staticLocale().locale;

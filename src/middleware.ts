import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUGGEST_DISMISSED_COOKIE, isLocale, localeFromAcceptLanguage } from "@/i18n/locales";
import { COOKIE_NOTICE_COOKIE } from "@/lib/legal";
import { PUBLIC_PREFIX, isPublicPath, variantKey } from "@/lib/public-variant";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

/**
 * Paginile publice, pentru cine nu e intrat în cont, vin gata făcute din cache (app/(public)/pub/[v]): aici cererea e
 * trimisă la varianta potrivită (limbă, temă, anunțul de cookie-uri închis sau nu), iar adresa din browser rămâne aceeași.
 * Rămân la pagina obișnuită, făcută pe loc: cine e intrat în cont, adresele cu parametri (?cont=sters, ?tipar=…) și cine
 * trebuie întrebat o dată dacă vrea site-ul în limba browserului.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  // Adresa internă nu se deschide direct (ar fi o a doua adresă pentru aceeași pagină).
  if (pathname === PUBLIC_PREFIX || pathname.startsWith(`${PUBLIC_PREFIX}/`)) return NextResponse.rewrite(new URL("/pagina-inexistenta", req.url));
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();
  if (!isPublicPath(pathname)) return NextResponse.next();
  if ([...searchParams.keys()].some((k) => k !== "_rsc")) return NextResponse.next();
  const cookies = req.cookies;
  // Sesiunea (better-auth.session_token, cu sau fără prefixul __Secure-): pagina se face pe loc, cu antetul contului.
  if (cookies.getAll().some((c) => c.name.endsWith("session_token"))) return NextResponse.next();
  const chosen = cookies.get(LOCALE_COOKIE)?.value;
  let locale = DEFAULT_LOCALE;
  if (isLocale(chosen)) locale = chosen;
  else if (!cookies.get(SUGGEST_DISMISSED_COOKIE)?.value) {
    // Aceeași regulă ca suggestedLocale() din i18n/server.ts: cine are browserul în altă limbă pe care o avem e întrebat o dată.
    const header = req.headers.get("accept-language");
    const first = localeFromAcceptLanguage(header?.split(",")[0]);
    const l = localeFromAcceptLanguage(header);
    if (first !== DEFAULT_LOCALE && l && l !== DEFAULT_LOCALE) return NextResponse.next();
  }
  const key = variantKey({ locale, theme: parseTheme(cookies.get(THEME_COOKIE)?.value), cookieSeen: cookies.has(COOKIE_NOTICE_COOKIE) });
  const url = req.nextUrl.clone();
  url.pathname = `${PUBLIC_PREFIX}/${key}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/istoria-umanitatii", "/genealogii-vechi", "/libertatea-de-a-crede", "/contact", "/parteneri", "/confidentialitate", "/termeni", "/resurse-genealogie", "/cadou-de-sarbatori",
    // Secțiunile publice (src/lib/public-sections.ts): hubul și paginile din el.
    "/ghid", "/ghid/:slug", "/glosar", "/glosar/:slug", "/nume", "/nume/:slug",
    "/localitati", "/localitati/:judet", "/localitati/:judet/:localitate",
    "/pub", "/pub/:path*"],
};

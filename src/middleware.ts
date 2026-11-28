import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUGGEST_DISMISSED_COOKIE, detectLocale, isCrawler, isLocale, splitLocalePath, type Locale } from "@/i18n/locales";
import { COOKIE_NOTICE_COOKIE } from "@/lib/legal";
import { PUBLIC_PREFIX, isPublicPath, variantKey } from "@/lib/public-variant";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { hasRealTranslation, pathForLocale } from "@/lib/traduceri-reale";

/**
 * Paginile publice, pentru cine nu e intrat în cont, vin gata făcute din cache (app/(public)/pub/[v]): aici cererea e
 * trimisă la varianta potrivită (limbă, temă, anunțul de cookie-uri închis sau nu), iar adresa din browser rămâne aceeași.
 *
 * Limba (Daniel, 2026-11-14):
 * - fiecare limbă are adresa ei (/it/contact, /en, /he/termeni): limba din adresă câștigă mereu, pentru oricine;
 * - fără prefix: limba aleasă (cookie-ul „limba”), altfel româna; cine vine prima dată cu browserul sau țara în altă limbă
 *   primește pagina făcută pe loc, cu întrebarea „Vezi site-ul în …?” (nu e trimis nicăieri cu forța);
 * - roboții (Googlebot, Bingbot…) nu sunt niciodată redirecționați și nu primesc întrebarea: văd mereu pagina adresei.
 * - o adresă pe o limbă în care pagina nu are text (ghidurile, numele, localitățile sunt doar în română) trimite cu 308 la
 *   pagina cu text (src/lib/traduceri-reale.ts);
 * Rămân la pagina obișnuită, făcută pe loc: cine e intrat în cont și adresele cu parametri (?cont=sters, ?tipar=…).
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  // Adresa internă nu se deschide direct (ar fi o a doua adresă pentru aceeași pagină).
  if (pathname === PUBLIC_PREFIX || pathname.startsWith(`${PUBLIC_PREFIX}/`)) return NextResponse.rewrite(new URL("/pagina-inexistenta", req.url));
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();
  const { locale: inUrl, path } = splitLocalePath(pathname);
  if (!isPublicPath(path)) return inUrl ? NextResponse.rewrite(new URL("/pagina-inexistenta", req.url)) : NextResponse.next();
  const cookies = req.cookies;
  const ua = req.headers.get("user-agent");
  const chosen = cookies.get(LOCALE_COOKIE)?.value;
  const live = [...searchParams.keys()].some((k) => k !== "_rsc")
    // Sesiunea (better-auth.session_token, cu sau fără prefixul __Secure-): pagina se face pe loc, cu antetul contului.
    || cookies.getAll().some((c) => c.name.endsWith("session_token"));

  if (inUrl) {
    // O adresă pe o limbă în care pagina nu e scrisă (/en/nume/pop, /nl/ghid) trimite, pentru oricine, la pagina cu text (308),
    // în loc să arate text românesc sub <html lang="en"> (planul SEO, 18.11.2026).
    if (!hasRealTranslation(path, inUrl)) {
      const url = req.nextUrl.clone();
      url.pathname = pathForLocale(path, inUrl);
      return NextResponse.redirect(url, 308);
    }
    const res = live ? liveIn(req, path, inUrl) : rewriteTo(req, path, inUrl);
    // Cine intră pe o adresă într-o limbă și n-a ales încă nimic rămâne în ea și pe paginile următoare (un an).
    if (!isLocale(chosen) && !isCrawler(ua)) res.cookies.set(LOCALE_COOKIE, inUrl, { path: "/", maxAge: 31_536_000, sameSite: "lax", secure: req.nextUrl.protocol === "https:" });
    return res;
  }
  if (live) return NextResponse.next();
  let locale: Locale = DEFAULT_LOCALE;
  if (isLocale(chosen)) locale = chosen;
  else if (!isCrawler(ua) && !cookies.get(SUGGEST_DISMISSED_COOKIE)?.value) {
    // Prima vizită: limba browserului, apoi țara. Dacă alta decât româna, pagina se face pe loc, cu întrebarea (aceeași regulă ca
    // suggestedLocale() din i18n/server.ts).
    const guess = detectLocale({ acceptLanguage: req.headers.get("accept-language"), country: req.headers.get("x-vercel-ip-country") });
    if (guess !== DEFAULT_LOCALE) return NextResponse.next();
  }
  return rewriteTo(req, path, locale);
}

/** Varianta gata făcută a paginii, în limba dată. */
function rewriteTo(req: NextRequest, path: string, locale: Locale) {
  const c = req.cookies;
  const key = variantKey({ locale, theme: parseTheme(c.get(THEME_COOKIE)?.value), cookieSeen: c.has(COOKIE_NOTICE_COOKIE) });
  const url = req.nextUrl.clone();
  url.pathname = `${PUBLIC_PREFIX}/${key}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
}

/** Pagina făcută pe loc (cont, parametri), în limba din adresă: cererea primește cookie-ul limbii, ca serverul s-o vadă. */
function liveIn(req: NextRequest, path: string, locale: Locale) {
  const headers = new Headers(req.headers);
  const rest = (req.headers.get("cookie") ?? "").split(/;\s*/).filter((p) => p && !p.startsWith(`${LOCALE_COOKIE}=`));
  headers.set("cookie", [...rest, `${LOCALE_COOKIE}=${locale}`].join("; "));
  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers } });
}

// Prefixele de limbă trebuie scrise de mână aici (Next citește lista la build); testul din tests/limba-detectata.test.ts verifică
// că sunt aceleași ca URL_PREFIX din src/i18n/locales.ts.
export const config = {
  matcher: ["/", "/istoria-umanitatii", "/istoria-umanitatii/crize", "/istoria-umanitatii/primul-razboi-mondial", "/istoria-umanitatii/gripa-spaniola", "/istoria-umanitatii/anii-interbelici", "/istoria-umanitatii/al-doilea-razboi-mondial", "/istoria-umanitatii/tiparul-istoriei", "/genealogii-vechi", "/libertatea-de-a-crede", "/contact", "/parteneri", "/confidentialitate", "/termeni", "/resurse-genealogie", "/cadou-de-sarbatori", "/surse-publice", "/invitatii-nunta", "/invitatii-nunta/:slug", "/produse", "/design-by-cartea-neamului",
    // Secțiunile publice (src/lib/public-sections.ts): hubul și paginile din el.
    "/ghid", "/ghid/:slug", "/glosar", "/glosar/:slug", "/nume", "/nume/:slug",
    "/localitati", "/localitati/:judet", "/localitati/:judet/:localitate",
    "/diaspora", "/diaspora/:a", "/diaspora/:a/:b",
    "/genealogie", "/genealogie/:oras", "/genealogie/:oras/:b",
    // Aceleași pagini, în celelalte limbi.
    "/:lang(en|en-us|fr|es|nl|de|it|hu|he|pt|el|sv|da|no|ua|sr|bg|tr)", "/:lang(en|en-us|fr|es|nl|de|it|hu|he|pt|el|sv|da|no|ua|sr|bg|tr)/:path*",
    "/pub", "/pub/:path*"],
};

import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/locales";
import { suggestFor } from "@/lib/zona/registru";

/**
 * Sugestiile după zonă (src/lib/zona/registru.ts), cerute din browser după ce pagina s-a încărcat: pagina rămâne aceeași
 * pentru toți (și pentru Google), doar blocul de sugestii se potrivește zonei. Nu se salvează nimic despre vizitator.
 * `?tara=US&regiune=OH` doar pentru verificare (Admin, teste locale), altfel antetele cererii.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const l = url.searchParams.get("l");
  const locale = isLocale(l) ? l : "ro";
  const country = url.searchParams.get("tara") ?? req.headers.get("x-vercel-ip-country");
  const region = url.searchParams.get("regiune") ?? req.headers.get("x-vercel-ip-country-region");
  const s = suggestFor(country, region, locale);
  return NextResponse.json(s, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}

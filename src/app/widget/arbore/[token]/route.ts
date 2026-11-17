import { db } from "@/db";
import { SITE_URL } from "@/lib/site-url";
import { renderWidget, widgetData } from "@/lib/widget-arbore";

export const dynamic = "force-dynamic";

/**
 * Fișa „Arborele meu” pusă în <iframe> pe alte site-uri (src/lib/widget-arbore.ts). Singura adresă a site-ului care poate fi
 * pusă în cadrul altui site (next.config.ts o scoate din regula frame-ancestors 'self'); nu are scripturi și nu intră în Google.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await widgetData(db, token).catch(() => null);
  return new Response(renderWidget(data, SITE_URL), {
    status: data ? 200 : 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors *; base-uri 'none'; form-action 'none'",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

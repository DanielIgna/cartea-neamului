import { indexNowKey } from "@/lib/seo/indexnow";

/**
 * Fișierul cheii IndexNow, servit la /<cheie>.txt (rewrite în next.config.ts): doar cheia corectă primește răspuns.
 * La rewrite, cererea păstrează adresa originală (/<cheie>.txt), deci cheia se citește din ea; ?k= rămâne pentru apelul direct.
 */
export function GET(req: Request) {
  const key = indexNowKey();
  const u = new URL(req.url);
  const asked = u.pathname.match(/^\/([a-zA-Z0-9-]+)\.txt$/)?.[1] ?? u.searchParams.get("k");
  if (!key || asked !== key) return new Response("Nu există.", { status: 404 });
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}

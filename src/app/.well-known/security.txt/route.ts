import { operator } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-url";

/** Unde se pot semnala probleme de securitate (RFC 9116): adresa de contact din paginile legale. */
export function GET() {
  const expires = new Date(Date.now() + 365 * 864e5).toISOString().replace(/\.\d+Z$/, "Z");
  const body = [
    `Contact: mailto:${operator().email}`,
    `Expires: ${expires}`,
    "Preferred-Languages: ro, en",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/termeni`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}

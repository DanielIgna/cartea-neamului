import { headers } from "next/headers";

/**
 * Adresa publică a site-ului, pentru legăturile care se tipăresc (codurile QR din carte): adresa de producție când e știută,
 * altfel cea din cererea de acum (pe calculatorul de dezvoltare).
 */
export async function siteOrigin() {
  const fixed = process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  if (fixed) return fixed.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Adresa publică a site-ului, fără cereri la server: pentru previzualizarea linkurilor, robots.txt, sitemap și adresa canonică.
 * (Fișierul nu importă nimic de pe server, ca să poată fi folosit și în paginile statice.)
 */
export const SITE_URL = (process.env.BETTER_AUTH_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  || "https://cartea-neamului.vercel.app").replace(/\/+$/, "");

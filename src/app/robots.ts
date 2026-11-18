import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { PRIVATE_PREFIXES } from "@/lib/public-pages";

/**
 * Ce pot citi motoarele de căutare: tot site-ul public, nu arborii, invitațiile, datele cuiva sau panoul de admin.
 * Pe lângă părțile private, nu irosim vizitele robotului pe căutarea din site (/cauta?q=…, oricum „noindex”) și pe adresele cu
 * parametri de urmărire (?src=…, ?utm_…), care sunt aceeași pagină ca adresa curată (planul SEO, 18.11.2026).
 * Fără „Host:” (Google n-o folosește); adresa principală o spun canonicele și sitemap-ul.
 */
export const CRAWL_WASTE = ["/cauta?", "/*?src=", "/*&src=", "/*?utm_", "/*&utm_"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PREFIXES, ...CRAWL_WASTE] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { PRIVATE_PREFIXES, PUBLIC_PAGES } from "@/lib/public-pages";

/** Ce pot citi motoarele de căutare: paginile publice, nu arborii, invitațiile, datele cuiva sau panoul de admin. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: PUBLIC_PAGES.map((p) => p.path), disallow: PRIVATE_PREFIXES }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

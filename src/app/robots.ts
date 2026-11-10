import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Ce pot citi motoarele de căutare: paginile publice, nu arborii, invitațiile, datele cuiva sau panoul de admin. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/confidentialitate", "/termeni"],
      disallow: ["/admin", "/api/", "/invitatie/", "/arbore/", "/datele-mele"],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { PRIVACY_DATE, TERMS_DATE } from "@/lib/legal";

/** Când s-a publicat ultima versiune a site-ului (harta se face la publicare); textele legale au data lor. */
const BUILT_AT = new Date();
const LAST_MODIFIED: Record<string, Date> = { "/confidentialitate": PRIVACY_DATE, "/termeni": TERMS_DATE };

/** Doar paginile publice (PUBLIC_PAGES), cu adresa principală fără www. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path === "/" ? "" : p.path}`,
    lastModified: LAST_MODIFIED[p.path] ?? BUILT_AT,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}

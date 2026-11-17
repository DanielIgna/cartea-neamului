import { diasporaSitemapUrls, urlsetXml, xmlResponse } from "@/lib/continut/sitemap";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Paginile de diaspora, în toate limbile lor (cu hreflang), trimise din indexul de la /sitemap.xml. */
export async function GET() {
  return xmlResponse(urlsetXml(diasporaSitemapUrls()));
}

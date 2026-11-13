import { mainSitemapXml, xmlResponse } from "@/lib/continut/sitemap";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Harta site-ului pentru Google (vezi src/lib/continut/sitemap.ts). */
export function GET() {
  return xmlResponse(mainSitemapXml());
}

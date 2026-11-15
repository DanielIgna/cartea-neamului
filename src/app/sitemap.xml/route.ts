import { mainSitemapXml, sitemapGroups, xmlResponse } from "@/lib/continut/sitemap";
import { publishedMap } from "@/lib/motor-seo/motor";
import { db } from "@/db";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Harta site-ului pentru Google (vezi src/lib/continut/sitemap.ts), cu comunele publicate de motorul SEO. */
export async function GET() {
  return xmlResponse(mainSitemapXml(sitemapGroups(await publishedMap(db))));
}

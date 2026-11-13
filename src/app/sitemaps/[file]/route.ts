import { sitemapGroups, urlsetXml, xmlResponse } from "@/lib/continut/sitemap";

export const dynamic = "force-static";
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return sitemapGroups().map((g) => ({ file: `${g.name}.xml` }));
}

/** O parte din harta site-ului (o secțiune), trimisă din indexul de la /sitemap.xml. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const g = sitemapGroups().find((x) => `${x.name}.xml` === file);
  if (!g) return new Response("Nu există", { status: 404 });
  return xmlResponse(urlsetXml(g.urls));
}

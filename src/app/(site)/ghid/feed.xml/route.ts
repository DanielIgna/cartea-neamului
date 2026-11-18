import { guideFeedXml } from "@/lib/continut/rss";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Fluxul RSS al ghidurilor, anunțat în <head> pe /ghid. */
export function GET() {
  return new Response(guideFeedXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}

import { loadCollection } from "@/lib/continut/colectii";
import { lastmodOf } from "@/lib/seo/versiuni";
import { SITE_URL } from "@/lib/site-url";

/** Fluxul RSS 2.0 al ghidurilor (planul SEO, 18.11.2026): cele mai noi 30, după data ultimei schimbări reale. */
export const GUIDE_FEED_PATH = "/ghid/feed.xml";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function guideFeedXml(): string {
  const items = loadCollection("ghid")
    .map((e) => ({ e, date: lastmodOf(e.path, e.updated) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.e.title.localeCompare(b.e.title, "ro"))
    .slice(0, 30);
  const newest = items[0]?.date ?? new Date("2026-11-13T00:00:00Z");
  const url = (p: string) => `${SITE_URL}${p}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Ghiduri de genealogie – Cartea Neamului</title>
<link>${url("/ghid")}</link>
<description>Ghiduri practice pentru istoria familiei: acte, registre, arhive și povești de familie.</description>
<language>ro</language>
<lastBuildDate>${newest.toUTCString()}</lastBuildDate>
<atom:link href="${url(GUIDE_FEED_PATH)}" rel="self" type="application/rss+xml"/>
${items.map(({ e, date }) => `<item>
<title>${esc(e.title)}</title>
<link>${url(e.path)}</link>
<guid isPermaLink="true">${url(e.path)}</guid>
<pubDate>${date.toUTCString()}</pubDate>
<category>${esc(e.category)}</category>
<description>${esc(e.description)}</description>
</item>`).join("\n")}
</channel>
</rss>
`;
}

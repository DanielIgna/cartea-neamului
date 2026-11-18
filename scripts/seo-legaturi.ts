/**
 * Scrie src/data/seo-legaturi.json: câte legături interne primește fiecare pagină din sitemap (vezi src/lib/seo/legaturi.ts).
 * Rulare cu site-ul pornit local (npm run build && npx next start -p 3200):
 *   npx tsx scripts/seo-legaturi.ts            (implicit http://localhost:3200)
 *   BASE=http://localhost:3100 npx tsx scripts/seo-legaturi.ts
 */
import { writeFileSync } from "node:fs";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { bodyLinks, linkStats, pagingLinks } from "@/lib/seo/legaturi";

const BASE = (process.env.BASE ?? "http://localhost:3200").replace(/\/$/, "");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());

async function main() {
  const paths = [...new Set(["/", ...sitemapGroups().flatMap((g) => g.urls.map((u) => u.path))])].sort();
  const out = new Map<string, string[]>();
  const failed: string[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < paths.length) {
      const p = paths[i++];
      try {
        const r = await fetch(`${BASE}${p}`, { redirect: "follow" });
        if (!r.ok) { failed.push(`${p} (${r.status})`); out.set(p, []); continue; }
        const html = await r.text();
        const links = new Set(bodyLinks(html, p));
        // Hubul împărțit în pagini: legăturile de pe /nume?pagina=2… sunt tot ale hubului.
        for (const next of pagingLinks(html, p)) {
          const rn = await fetch(`${BASE}${next}`);
          if (rn.ok) for (const l of bodyLinks(await rn.text(), p)) links.add(l);
        }
        out.set(p, [...links]);
      } catch (e) {
        failed.push(`${p} (${(e as Error).message})`);
        out.set(p, []);
      }
    }
  }));
  if (failed.length > paths.length / 10) throw new Error(`Prea multe pagini nu s-au deschis (${failed.length}); e pornit site-ul la ${BASE}?\n${failed.slice(0, 10).join("\n")}`);
  const pages = linkStats(out);
  writeFileSync("src/data/seo-legaturi.json", `${JSON.stringify({ generated: today, pages }, null, 0).replace(/\},"/g, '},\n"')}\n`);
  const orphans = Object.entries(pages).filter(([p, s]) => p !== "/" && s.in === 0).map(([p]) => p);
  console.log(`seo-legaturi.json: ${paths.length} pagini, ${orphans.length} orfane${failed.length ? `, ${failed.length} nedeschise: ${failed.join(", ")}` : ""}`);
  if (orphans.length) console.log(orphans.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });

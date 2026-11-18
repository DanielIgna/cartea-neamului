/**
 * Scrie src/data/seo-versiuni.json: pentru fiecare adresă din sitemap, amprenta conținutului și ziua în care s-a schimbat ultima
 * dată. O pagină neschimbată își păstrează data; una schimbată (sau nouă) primește ziua de azi (ora României).
 * Rulare după orice schimbare de conținut public: npx tsx scripts/seo-versiuni.ts
 * Prima dată, cu --seed: datele vin din ce se știa deja (data din ghid, data secțiunii, ultima schimbare din git a paginii).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { rawGroups } from "@/lib/continut/sitemap";
import { contentFingerprints } from "@/lib/seo/amprente";
import { splitLocalePath } from "@/i18n/locales";

const FILE = "src/data/seo-versiuni.json";
const seed = process.argv.includes("--seed");
// Ziua în UTC: sitemap-ul nu are voie să arate o dată din viitor (între 00:00 la București și 00:00 UTC, data românească e încă „mâine”).
const today = new Date().toISOString().slice(0, 10);

const gitDateOf = (file: string): string | null => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
};
const gitDate = (p: string) => gitDateOf(p === "/" ? "src/app/(site)/page.tsx" : `src/app/(site)${p}/page.tsx`);

async function main() {
  const old: Record<string, string> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
  const groups = rawGroups();
  const urls = groups.flatMap((g) => g.urls.map((u) => ({ ...u, group: g.name })));
  const prints = await contentFingerprints(urls.map((u) => u.path));
  const next: Record<string, string> = {};
  let changed = 0, added = 0;
  for (const u of urls.sort((a, b) => a.path.localeCompare(b.path))) {
    const hash = prints.get(u.path)!;
    const prev = old[u.path];
    if (prev && prev.split(" ")[0] === hash) { next[u.path] = prev; continue; }
    let date = today;
    if (seed && !prev) {
      const own = u.group === "pagini" || u.group === "limbi" ? gitDate(splitLocalePath(u.path).path)
        : u.group.startsWith("diaspora-") ? gitDateOf("src/lib/diaspora") : null;
      date = own ?? u.lastModified.toISOString().slice(0, 10);
    }
    if (prev) changed++; else added++;
    next[u.path] = `${hash} ${date}`;
  }
  writeFileSync(FILE, `${JSON.stringify(next, null, 0).replace(/","/g, '",\n"').replace(/^\{/, "{\n").replace(/\}$/, "\n}")}\n`);
  console.log(`seo-versiuni: ${Object.keys(next).length} adrese, ${added} noi, ${changed} schimbate (data ${today}).`);
}
main();

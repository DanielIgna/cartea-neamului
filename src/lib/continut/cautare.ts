import { loadCollection } from "./colectii";
import { countyPath, isCapital, loadCounties } from "./localitati";
import { loadNames } from "./nume";
import { nameGate, uatThin } from "./prag";
import { KIND_NAME, loadUats, uatPath } from "./uat";
import { SCHOOL_PAGES } from "@/lib/scoala";
import { GIFTS_HUB, GIFTS_TITLE, GIFT_PAGES, giftPath } from "@/lib/cadouri";
import { KIN_PAGES, TOOLS_HUB, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { TOOLS, toolPath } from "@/lib/unelte/unelte";

/**
 * Căutarea din site (/cauta?q=…, Daniel, 17.11.2026): numele de familie, județele, orașele și comunele, ghidurile, glosarul și
 * paginile pentru școli, toate din fișierele din repo (fără bază de date). Tot ea e ținta „SearchAction” din datele WebSite,
 * ca Google să poată arăta o casetă de căutare sub rezultat. Fără diacritice și fără deosebire între litere mari și mici.
 */
export type Hit = { href: string; title: string; kind: string; score: number };

/** „Sânmartin” → „sanmartin”, „Târgu-Mureș” → „targu mures”. */
export const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-‐–—'’`".,:;()]/g, " ").replace(/\s+/g, " ").trim();

type Doc = { href: string; title: string; kind: string; keys: string[]; boost: number };
let index: Doc[] | null = null;

function build(): Doc[] {
  const out: Doc[] = [];
  for (const n of loadNames()) if (!nameGate(n)) out.push({ href: `/nume/${n.slug}`, title: `Numele ${n.name}`, kind: "Nume de familie", keys: [n.name, ...n.variants], boost: 3 });
  const counties = new Map(loadCounties().map((c) => [c.slug, c]));
  for (const c of counties.values()) out.push({ href: countyPath(c), title: isCapital(c) ? "București" : `Județul ${c.name}`, kind: "Județ", keys: [c.name, `judetul ${c.name}`], boost: 2 });
  for (const u of loadUats()) {
    if (uatThin(u)) continue;
    const c = counties.get(u.countySlug);
    out.push({
      href: uatPath(u), title: `${KIND_NAME[u.kind].title} ${u.name}${c ? ` (${c.name})` : ""}`, kind: KIND_NAME[u.kind].one,
      keys: [u.name, ...u.villages.map((v) => v.name)], boost: u.kind === "c" ? 1 : 2,
    });
  }
  for (const c of ["ghid", "glosar"] as const) for (const e of loadCollection(c)) {
    out.push({ href: e.path, title: e.title, kind: c === "ghid" ? "Ghid" : "Glosar", keys: [e.title, ...e.alt, e.description], boost: c === "ghid" ? 2 : 1 });
  }
  for (const p of SCHOOL_PAGES) out.push({ href: p.path, title: p.h1, kind: "Pentru școli", keys: [p.title, "scoala arbore genealogic", p.description], boost: 1 });
  out.push({ href: GIFTS_HUB, title: GIFTS_TITLE, kind: "Cadouri", keys: ["cadou", "cadouri", "cadou pentru familie", "cadou craciun"], boost: 2 });
  for (const p of GIFT_PAGES) out.push({ href: giftPath(p), title: p.h1, kind: "Cadouri", keys: [p.title, p.name, `cadou ${p.name}`], boost: 1 });
  out.push({ href: TOOLS_HUB, title: "Unelte gratuite de genealogie", kind: "Unelte", keys: ["unelte", "calculator", "gratuit", "arbore de completat"], boost: 2 });
  for (const t of TOOLS) out.push({ href: toolPath(t), title: t.h1, kind: "Unelte", keys: [t.title, t.name], boost: 2 });
  for (const p of KIN_PAGES) out.push({ href: kinPagePath(p), title: p.h1, kind: "Rudenie", keys: [p.title, p.name, `ce este ${p.name}`], boost: 2 });
  return out.map((d) => ({ ...d, keys: d.keys.map(plain) }));
}

/** Cele mai potrivite pagini pentru `q`: potrivirea întreagă întâi, apoi începutul unui cuvânt, apoi orice potrivire. */
export function searchSite(q: string, limit = 30): Hit[] {
  const query = plain(q).slice(0, 80);
  if (query.length < 2) return [];
  index ??= build();
  const words = query.split(" ");
  const hits: Hit[] = [];
  for (const d of index) {
    let best = 0;
    d.keys.forEach((k, i) => {
      const main = i === 0 ? 1 : 0.6;
      let s = 0;
      if (k === query) s = 100;
      else if (k.startsWith(query)) s = 60;
      else if (` ${k}`.includes(` ${query}`)) s = 40;
      else if (words.every((w) => k.includes(w))) s = 15;
      best = Math.max(best, s * main);
    });
    if (best) hits.push({ href: d.href, title: d.title, kind: d.kind, score: best + d.boost });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ro")).slice(0, limit);
}

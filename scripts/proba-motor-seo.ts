/**
 * Proba motorului SEO fără bază de date: ia următoarele N comune din coadă (cele mai mari, ca motorul), aduce datele din
 * Wikipedia, face textul și controlul de calitate exact ca la publicare și scrie un raport Markdown. Nu publică nimic.
 *
 *   npx tsx scripts/proba-motor-seo.ts [N=20] [raport.md]
 *
 * Rulează și pe GitHub (.github/workflows/proba-seo.yml), unde raportul apare în rezumatul rulării.
 */
import { writeFileSync } from "node:fs";
import { loadUats, uatPath } from "@/lib/continut/uat";
import { getCounty } from "@/lib/continut/localitati";
import { uatThin } from "@/lib/continut/prag";
import { evaluate } from "@/lib/motor-seo/motor";
import { fetchWiki, wikiLines, hasFacts } from "@/lib/motor-seo/wikipedia";
import { MAX_SIMILARITY, MIN_FACTS, MIN_UNIQUE_WORDS } from "@/lib/motor-seo/calitate";

const n = Number(process.argv[2] ?? 20);
const out = process.argv[3] ?? "proba-motor-seo.md";
const next = loadUats().filter((u) => u.kind === "c" && !uatThin(u)).sort((a, b) => b.pop - a.pop).slice(0, n);

(async () => {
  const rows: string[] = [];
  const examples: string[] = [];
  let ok = 0;
  for (const u of next) {
    const c = getCounty(u.countySlug)!;
    let wiki = null, err = "";
    try { wiki = await fetchWiki(u, c); } catch (e) { err = e instanceof Error ? e.message : String(e); }
    const { quality, facts } = evaluate(u, c, { wiki });
    if (quality.ok) ok++;
    rows.push(`| [${u.name} (${c.name})](https://carteaneamului.ro${uatPath(u)}) | ${quality.ok ? "✅ publicată" : "⏸ noindex"} | ${quality.words} / **${quality.unique}** | ${quality.facts} | ${quality.similarity}% | ${wiki ? (hasFacts(wiki) ? "da" : "fără date") : err ? "eroare" : "negăsit"} | ${quality.reasons.join("; ") || err} |`);
    if (wiki && hasFacts(wiki) && examples.length < 3) examples.push(`### ${u.name}, județul ${c.name}\n\n${wikiLines(u, wiki).lines.map((l) => `> ${l}`).join("\n>\n")}\n\n_${facts.join(", ")}_`);
    await new Promise((r) => setTimeout(r, 300));
  }
  const md = `# Proba motorului SEO: ${n} pagini\n\nControl: cel puțin ${MIN_UNIQUE_WORDS} de cuvinte unice, ${MIN_FACTS} date proprii, cel mult ${MAX_SIMILARITY}% asemănare cu paginile vecine.\n\n**${ok} din ${next.length} ar fi publicate**, restul ar rămâne noindex.\n\n| Pagina | Rezultat | Cuvinte / unice | Date proprii | Asemănare | Wikipedia | De ce |\n|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## Exemple de text nou (scris de noi din datele Wikipedia)\n\n${examples.join("\n\n")}\n`;
  writeFileSync(out, md);
  console.log(md);
})();

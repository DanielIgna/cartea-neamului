/** Scrie ciornele de pagini de rudenie ca text de citit pentru aprobarea lui Daniel. */
import { mkdirSync, writeFileSync } from "node:fs";
import { KIN_DRAFTS } from "../src/lib/unelte/rudenie-pagini";

const out = process.argv[2] ?? "/mnt/project-files/rudenie/ciorne-rudenie.md";
const parts = ["# Pagini noi de rudenie (ciornă)", "", "Nu apar pe site până nu le aprobi. Fiecare va fi o pagină /unelte/rudenie/<nume>, ca cele de acum.", ""];
for (const p of KIN_DRAFTS) {
  parts.push(`## ${p.h1}`, "", `_${p.description}_`, "", `**Grad:** ${p.degree}`, "", p.lead, "");
  for (const b of p.body) parts.push(`### ${b.h}`, "", ...b.p.map((x) => `${x}\n`));
  parts.push("### Întrebări frecvente", "", ...p.faq.map((f) => `**${f.q}** ${f.a}\n`));
}
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(out, parts.join("\n"));
console.log(`${KIN_DRAFTS.length} pagini → ${out}`);

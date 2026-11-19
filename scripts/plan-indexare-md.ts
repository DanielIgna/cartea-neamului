/** Scrie planul de indexare SUA și Canada ca fișier pentru Daniel (aceeași listă ca în Admin → SEO → Indexare). */
import { writeFileSync, mkdirSync } from "node:fs";
import { planDays, planItemsEurope } from "../src/lib/seo/plan-indexare";

const out = process.argv[2] ?? "/mnt/project-files/seo-sua-canada/plan-indexare.md";
const days = planDays();
const lines = [
  "# Plan de indexare: SUA și Canada",
  "",
  "Câte 10 adrese pe zi. În Google Search Console, lipește adresa în bara de sus „Inspectează orice adresă URL”, apoi apasă „Solicită indexarea”. Aceeași listă, cu bife, e în Admin → SEO → Indexare.",
  "",
  ...days.flatMap((d) => [`## Ziua ${d.day}`, "", ...d.items.map((x) => `- [ ] https://carteaneamului.ro${x.path} · ${x.label}`), ""]),
];
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(out, lines.join("\n"));
console.log(`${days.length} zile, ${days.reduce((n, d) => n + d.items.length, 0)} adrese → ${out}`);

// Planul pentru Europa, după mărimea comunităților (19.11.2026).
const outEu = process.argv[3] ?? "/mnt/project-files/seo-europa/plan-indexare.md";
const daysEu = planDays(planItemsEurope());
mkdirSync(outEu.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(outEu, [
  "# Plan de indexare: Europa",
  "",
  "Câte 10 adrese pe zi, după mărimea comunităților: Marea Britanie, Spania, Italia, Germania, Austria, Franța, apoi celelalte. Fiecare pagină în limba țării (pentru copii) și în română (pentru părinți). Aceeași listă, cu bife, e în Admin → SEO → Indexare.",
  "",
  ...daysEu.flatMap((d) => [`## Ziua ${d.day}`, "", ...d.items.map((x) => `- [ ] https://carteaneamului.ro${x.path} · ${x.label}`), ""]),
].join("\n"));
console.log(`Europa: ${daysEu.length} zile, ${daysEu.reduce((n, d) => n + d.items.length, 0)} adrese → ${outEu}`);

/** Scrie planul de indexare SUA și Canada ca fișier pentru Daniel (aceeași listă ca în Admin → SEO → Indexare). */
import { writeFileSync, mkdirSync } from "node:fs";
import { planDays } from "../src/lib/seo/plan-indexare";

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

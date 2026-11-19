/**
 * Scrie ciorna istoriei pe state și provincii ca text de citit (pentru aprobarea lui Daniel):
 *   npx tsx scripts/istorie-locala-md.ts [fișier]   (implicit /mnt/project-files/seo-sua-canada/istorie-state-ciorna.md)
 */
import { writeFileSync } from "node:fs";
import { ISTORIE_LOCALA } from "@/lib/diaspora/istorie-locala";
import { REGIONS } from "@/lib/diaspora/america";

const out = process.argv[2] ?? "/mnt/project-files/seo-sua-canada/istorie-state-ciorna.md";
const name = (slug: string) => REGIONS.find((r) => (r.country === "us" || r.country === "ca") && r.slug === slug && r.kind !== "city");
const parts = ["# Istoria românilor pe state și provincii (ciornă)", "", "Nu apare pe site până nu o aprobi. Statele fără text de mai jos rămân în afara Google.", ""];
for (const [slug, h] of Object.entries(ISTORIE_LOCALA)) {
  const r = name(slug);
  parts.push(`## ${r?.name.ro ?? slug} (${r?.country === "ca" ? "Canada" : "SUA"})`, "", "**Română**", "", ...h.ro.map((p) => `${p}\n`), "**English**", "", ...h.en.map((p) => `${p}\n`), `_Surse: ${h.sources.join("; ")}_`, "");
}
const missing = REGIONS.filter((r) => (r.country === "us" || r.country === "ca") && r.kind !== "city" && !(r.notes.ro?.length) && !ISTORIE_LOCALA[r.slug]).map((r) => r.name.ro ?? r.slug);
parts.push("## Fără istorie documentată (rămân în afara Google)", "", missing.join(", "), "");
writeFileSync(out, parts.join("\n"));
console.log(`Scris ${out}: ${Object.keys(ISTORIE_LOCALA).length} state și provincii, ${missing.length} fără text.`);

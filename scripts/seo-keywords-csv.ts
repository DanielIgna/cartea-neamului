/** Scrie src/data/seo-keywords.csv din lista de cuvinte cheie (ciornă): `npx tsx scripts/seo-keywords-csv.ts`. */
import { writeFileSync } from "node:fs";
import { seoKeywords, toCsv } from "../src/data/seo-keywords";

const rows = seoKeywords();
writeFileSync("src/data/seo-keywords.csv", toCsv(rows));
console.log(`seo-keywords.csv: ${rows.length} rânduri`);

/** Ciornele pentru echilibrul diasporei (19.11.2026): orașele în limba țării și Norvegia, ca fișier de citit pentru Daniel. */
import { writeFileSync, mkdirSync } from "node:fs";
import { CITY_LANG_DRAFTS, cityLangKey } from "../src/lib/diaspora/ciorne/limbi-orase";
import { PENDING } from "../src/lib/diaspora/ciorne";
import { APROBATE } from "../src/lib/diaspora/ciorne/aprobate";

const out = process.argv[2] ?? "/mnt/project-files/diaspora/ciorne-echilibru.md";
const langs = CITY_LANG_DRAFTS.filter((c) => !APROBATE.has(cityLangKey(c)));
const countries = PENDING.countries.filter((c) => c.slug === "norvegia");
const lines = [
  "# Ciorne: paginile de diaspora în limba țării",
  "",
  "Texte scrise pentru copiii românilor crescuți acolo, din aceleași fapte verificate ca paginile în română. Nu sunt pe site până nu le aprobi.",
  "",
  ...langs.flatMap((c) => [`## ${c.name} (${c.lang}) · /${c.lang === "en" ? "en" : c.lang}/diaspora/…/${c.slug}`, "", ...c.notes.flatMap((p) => [p, ""])]),
  ...countries.flatMap((c) => [`## ${c.name.ro} (pagină nouă de țară)`, "", `**Mărime:** ${c.size?.ro}`, "", ...(c.history.ro ?? []).flatMap((p) => [p, ""]), "**Surse:**", "", ...c.records.map((r) => `- ${r.name}: ${r.url}`), ""]),
];
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(out, lines.join("\n"));
console.log(`${langs.length} orașe, ${countries.length} țări → ${out}`);

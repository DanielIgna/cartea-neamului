/**
 * Scrie src/lib/diaspora/limbi-generat.ts: pentru fiecare pagină de diaspora, limbile în care e scrisă. Lista mică e citită de
 * middleware (care nu poate încărca toate textele de diaspora) ca să știe ce adrese pe limbi au traducere reală.
 * Rulare: npx tsx scripts/diaspora-limbi.ts (testul tests/traduceri-reale.test.ts spune când trebuie rulat din nou).
 */
import { writeFileSync } from "node:fs";
import { diasporaLangsSource } from "@/lib/diaspora/limbi-sursa";

writeFileSync("src/lib/diaspora/limbi-generat.ts", diasporaLangsSource());
console.log("Scris src/lib/diaspora/limbi-generat.ts");

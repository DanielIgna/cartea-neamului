import { entries } from "@/lib/diaspora";

/** Conținutul fișierului src/lib/diaspora/limbi-generat.ts, din paginile de diaspora (vezi scripts/diaspora-limbi.ts). */
export function diasporaLangsSource(): string {
  const rows = entries().map((e) => `  ${JSON.stringify(e.path)}: ${JSON.stringify(e.langs.join(" "))},`).join("\n");
  return `// Fișier generat de scripts/diaspora-limbi.ts. Nu-l schimba de mână.\n/** Limbile în care e scrisă fiecare pagină de diaspora (adresa fără prefix de limbă → limbile, despărțite prin spațiu). */\nexport const DIASPORA_LANGS: Record<string, string> = {\n${rows}\n};\n`;
}

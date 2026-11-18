import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Întrebările pentru bunici, pe teme, luate din ghidul content/ghid/intrebari-pentru-bunici.md (lista numerotată, până la
 * „Cum folosești lista”). Așa foaia de tipărit și ghidul spun mereu aceleași întrebări.
 */
export function grandparentQuestions(): { theme: string; questions: string[] }[] {
  const md = readFileSync(path.join(process.cwd(), "content", "ghid", "intrebari-pentru-bunici.md"), "utf8");
  const out: { theme: string; questions: string[] }[] = [];
  for (const line of md.split("\n")) {
    const h = /^## (.+)$/.exec(line);
    if (h) {
      if (/cum folosești/i.test(h[1])) break;
      out.push({ theme: h[1].trim(), questions: [] });
      continue;
    }
    const q = /^\d+\.\s+(.+)$/.exec(line);
    if (q && out.length) out[out.length - 1].questions.push(q[1].trim());
  }
  return out.filter((t) => t.questions.length);
}

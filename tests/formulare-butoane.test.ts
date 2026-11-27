import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Un câmp numit „id” într-un formular acoperă form.id în browser; React pune atunci valoarea butonului apăsat (name/value) într-un
 * câmp legat de un formular care nu există și acțiunea n-o mai primește (Admin → CRM → Aprobări, 27.11.2026: „Trimite acum” nu
 * trimitea, iar textul schimbat revenea). În formularele cu butoane care au „name”, id-ul stă în „rid”.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

describe("formularele cu două butoane", () => {
  it("nu au un câmp numit „id” lângă un buton cu „name”", () => {
    const bad: string[] = [];
    for (const f of files("src")) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<form\b[\s\S]*?<\/form>/g)) {
        const form = m[0];
        if (/name="id"/.test(form) && /<button\b[^>]*\bname=/.test(form)) bad.push(`${f}: ${form.slice(0, 80)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

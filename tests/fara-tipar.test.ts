import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Oferta din 18.11.2026: site-ul nu vinde și nu promite carte tipărită (omul își poate tipări singur PDF-ul cumpărat).
 * Cardul de cadou de tipărit și fișele pentru școli rămân; istoria tiparului (Coresi, Gutenberg) nu e o promisiune.
 */
const RO = /cartea tipărită|ca PDF sau tipărit|gata de tipărit|reducere la tipar|tipărești cartea|tipărită pentru toată familia|tipărirea cărții|tipărit ca o carte/i;
const EN = /the printed book|ready to print|discount on printing|\bin print\b|printed for the whole family|print it all as/i;

const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
const strip = (s: string) => s.replace(/^\s*(\/\/|\*|\/\*\*).*$/gm, ""); // comentariile din cod nu se văd în site

describe("nicio promisiune de carte tipărită în textele publice", () => {
  const all = files("src").filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("/cunostinte/") && !f.includes("/admin/") && !/(crm|scoala|scoli)/.test(f));
  it("româna: textele site-ului, emailurile, Termenii, ghidurile", () => {
    const ro = [...all.filter((f) => !/messages\/([a-z-]+\/)?(de|es|fr|nl|it|hu|he|en-GB|en-US)\.ts$/.test(f)), ...files("content")];
    const bad = ro.filter((f) => RO.test(strip(readFileSync(f, "utf8")))).map((f) => `${f}: ${strip(readFileSync(f, "utf8")).match(RO)?.[0]}`);
    expect(bad).toEqual([]);
  });
  it("engleza (și, prin aceleași chei, celelalte limbi)", () => {
    const en = all.filter((f) => /messages\/([a-z-]+\/)?en-(GB|US)\.ts$/.test(f) && !f.includes("/biserica/"));
    const bad = en.filter((f) => EN.test(readFileSync(f, "utf8"))).map((f) => `${f}: ${readFileSync(f, "utf8").match(EN)?.[0]}`);
    expect(bad).toEqual([]);
  });
  it("nicio cerere de ofertă pentru tipar din pagina de contact și niciun „de la X lei” la tipar", () => {
    expect(readFileSync("src/app/(site)/contact/page.tsx", "utf8")).not.toContain("printRequest");
    expect(readFileSync("src/components/admin/PlanForms.tsx", "utf8")).not.toMatch(/printFrom|Print`/);
  });
});

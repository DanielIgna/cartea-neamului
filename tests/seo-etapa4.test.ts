import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scorePages, sentenceKey, TARGET_MAX_COMMON, TARGET_OWN_WORDS } from "@/lib/seo/quality";
import { getName, loadNames } from "@/lib/continut/nume";
import { nameDescription, nameFaq, nameQuality, nameRecords, nameRegionGuides, nameTitle } from "@/lib/continut/nume-extra";
import { getEntry } from "@/lib/continut/colectii";
import { GEN_REGIONS } from "@/lib/genealogie-regiuni";

/** Planul SEO, etapa 4: scorul de calitate și îmbogățirea paginilor de nume. */
describe("scorul de calitate", () => {
  it("o frază care diferă doar prin nume e comună, una cu date proprii nu", () => {
    expect(sentenceKey("Numele Pop apare des.", ["Pop"])).toBe(sentenceKey("Numele Popa apare des.", ["Popa"]));
    const pages = ["Pop", "Popa", "Popescu", "Popovici", "Ionescu"].map((n, i) => ({
      path: `/nume/${i}`, names: [n], facts: 1, links: 0, faq: 0,
      paragraphs: [`Numele ${n} apare des în acte. Frază doar a paginii ${["unu", "doi", "trei", "patru", "cinci"][i]} cu ceva propriu.`],
    }));
    const s = scorePages(pages).get("/nume/0")!;
    expect(s.words).toBe(14);
    expect(s.own).toBe(8);
    expect(s.commonPct).toBe(43);
    expect(s.meetsTarget).toBe(false);
  });
  it("ținta din plan e 400 de cuvinte proprii și sub 40% fraze comune", () => {
    expect([TARGET_OWN_WORDS, TARGET_MAX_COMMON]).toEqual([400, 40]);
  });
});

describe("paginile de nume, îmbogățite din date", () => {
  it("titlul are 40–60 de caractere fără sufix și diferă după felul numelui", () => {
    const titles = loadNames().map((n) => nameTitle(n).replace(" | Cartea Neamului", ""));
    for (const t of titles) expect(t.length, t).toBeLessThanOrEqual(62);
    expect(new Set(loadNames().map((n) => nameTitle(n).replace(n.name, "X"))).size).toBeGreaterThanOrEqual(6);
  });
  it("descrierea e unică și sub 160 de caractere", () => {
    const d = loadNames().map(nameDescription);
    for (const x of d) expect(x.length, x).toBeLessThanOrEqual(160);
    expect(new Set(d).size).toBe(d.length);
  });
  it("întrebările frecvente folosesc datele numelui", () => {
    const pop = getName("popescu")!;
    const faq = nameFaq(pop);
    expect(faq[0].q).toBe("Ce înseamnă numele Popescu?");
    expect(faq.length).toBeGreaterThanOrEqual(3);
    for (const n of loadNames()) expect(nameFaq(n).length, n.slug).toBeGreaterThanOrEqual(2);
  });
  it("actele tipice și ghidurile regiunii există pentru fiecare nume", () => {
    for (const n of loadNames()) {
      expect(nameRecords(n).length, n.slug).toBeGreaterThan(0);
      for (const g of nameRegionGuides(n)) expect(getEntry("ghid", g), g).toBeTruthy();
    }
  });
  it("fiecare pagină de nume are scor", () => {
    for (const n of loadNames()) expect(nameQuality(n).score, n.slug).toBeGreaterThanOrEqual(0);
  });
  it("nu inventăm: niciun număr de purtători sau procent în textele noi", () => {
    const all = loadNames().flatMap((n) => [...nameFaq(n).flatMap((f) => [f.q, f.a]), ...nameRecords(n)]).join(" ");
    expect(all).not.toMatch(/\d+\s*(%|de purtători|purtători)/);
  });
});

describe("ghidul FamilySearch și sursa butoanelor", () => {
  it("ghidul FamilySearch leagă toate regiunile, iar fiecare regiune îl leagă", () => {
    const md = readFileSync("content/ghid/familysearch-pentru-romania.md", "utf8");
    for (const r of GEN_REGIONS) expect(md, r.slug).toContain(`/genealogie/regiune/${r.slug}`);
    expect(readFileSync("src/components/continut/GenealogieRegiuni.tsx", "utf8")).toContain('"familysearch-pentru-romania"');
  });
  it("butoanele de cont nou din paginile de conținut poartă sursa paginii", () => {
    for (const f of ["NamePages", "LocalityPages", "UatPages", "ArticlePages"]) {
      const src = readFileSync(`src/components/continut/${f}.tsx`, "utf8");
      expect(src, f).not.toMatch(/<CtaArbore \/>|<CtaSus \/>/);
    }
  });
});

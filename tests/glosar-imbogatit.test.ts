import { describe, expect, it } from "vitest";
import { loadCollection } from "@/lib/continut/colectii";
import { plainText } from "@/lib/continut/markdown";

/** Planul SEO, secțiunea 4: fiecare termen din glosar arată cum apare într-un act și în ce regiune și perioadă. */
describe("glosarul îmbogățit", () => {
  const terms = loadCollection("glosar");
  const section = (e: (typeof terms)[number], h: string) => {
    const i = e.blocks.findIndex((b) => b.t === "h2" && b.v === h);
    return i < 0 ? "" : plainText(e.blocks.slice(i + 1, i + 2));
  };

  it("fiecare termen are „Cum apare într-un act” și „Unde și când”, cu text propriu", () => {
    for (const e of terms) {
      expect(section(e, "Cum apare într-un act").split(/\s+/).length, e.slug).toBeGreaterThanOrEqual(30);
      expect(section(e, "Unde și când").split(/\s+/).length, e.slug).toBeGreaterThanOrEqual(20);
    }
  });

  it("textele noi nu se repetă de la un termen la altul", () => {
    const seen = new Map<string, string>();
    for (const e of terms) for (const h of ["Cum apare într-un act", "Unde și când"]) {
      const t = section(e, h);
      expect(seen.get(t), `${e.slug} repetă ${seen.get(t)}`).toBeUndefined();
      seen.set(t, e.slug);
    }
  });

  it("fiecare termen are acum cel puțin 150 de cuvinte", () => {
    expect(terms.filter((e) => e.words < 150).map((e) => `${e.slug} (${e.words})`)).toEqual([]);
  });
});

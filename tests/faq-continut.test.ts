import { describe, expect, it } from "vitest";
import { faqItems, parseBlocks } from "@/lib/continut/markdown";
import { loadCollection } from "@/lib/continut/colectii";

describe("întrebările frecvente din ghiduri și glosar (FAQPage)", () => {
  it("citește întrebările ### și pe cele îngroșate, doar din secțiunea lor", () => {
    const b = parseBlocks([
      "## Altceva", "", "### Nu e întrebare din FAQ?", "", "Text care nu intră în întrebările frecvente.", "",
      "## Întrebări frecvente", "", "### Ce înseamnă cuscru?", "", "Tatăl unuia dintre soți, privit din partea celeilalte familii.", "",
      "**Cuscrii sunt rude?** Nu, după lege nu au un grad de rudenie.", "", "## Surse", "", "### Nu intră nici asta?", "", "Text lung de după secțiune, ignorat.",
    ].join("\n"));
    expect(faqItems(b)).toEqual([
      { q: "Ce înseamnă cuscru?", a: "Tatăl unuia dintre soți, privit din partea celeilalte familii." },
      { q: "Cuscrii sunt rude?", a: "Nu, după lege nu au un grad de rudenie." },
    ]);
  });
  it("paginile cu secțiune de întrebări au cel puțin două întrebări cu răspuns", () => {
    let pages = 0;
    for (const c of ["ghid", "glosar"] as const) for (const e of loadCollection(c)) {
      const f = faqItems(e.blocks);
      if (f.length >= 2) pages++;
      for (const x of f) { expect(x.q.endsWith("?"), `${e.path}: ${x.q}`).toBe(true); expect(x.a.length, `${e.path}: ${x.q}`).toBeGreaterThanOrEqual(20); }
    }
    expect(pages).toBeGreaterThanOrEqual(100);
    for (const s of ["cuscri", "arbore-genealogic", "grad-de-rudenie"]) expect(faqItems(loadCollection("glosar").find((e) => e.slug === s)!.blocks).length, s).toBeGreaterThanOrEqual(3);
  });
});

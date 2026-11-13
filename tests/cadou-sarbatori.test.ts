import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LOCALES } from "@/i18n/locales";
import { loadMessages } from "@/i18n/messages";
import { GIFT_PATH, giftJsonLd, giftSeason } from "@/lib/cadou-sarbatori";
import { PRIVATE_PREFIXES, PUBLIC_PAGES } from "@/lib/public-pages";

const at = (iso: string) => new Date(iso);

describe("Cadou de sărbători", () => {
  it("banda se vede din 1 noiembrie până pe 6 ianuarie inclusiv, după ora României", () => {
    expect(giftSeason(at("2026-11-13T12:00:00Z"))).toBe(true);
    expect(giftSeason(at("2026-12-25T12:00:00Z"))).toBe(true);
    expect(giftSeason(at("2027-01-06T21:30:00Z"))).toBe(true); // 23:30 în România
    expect(giftSeason(at("2027-01-06T22:30:00Z"))).toBe(false); // deja 7 ianuarie în România
    expect(giftSeason(at("2027-03-01T12:00:00Z"))).toBe(false);
    expect(giftSeason(at("2026-10-31T21:30:00Z"))).toBe(false); // 31 octombrie, 23:30
    expect(giftSeason(at("2026-10-31T22:30:00Z"))).toBe(true); // 1 noiembrie, 00:30
  });

  it("e pagină publică, în sitemap și în middleware, fără să fie prinsă de prefixele private (ex. /cadou/)", () => {
    expect(PUBLIC_PAGES.some((p) => p.path === GIFT_PATH)).toBe(true);
    expect(PRIVATE_PREFIXES.some((p) => GIFT_PATH.startsWith(p))).toBe(false);
    expect(readFileSync("src/middleware.ts", "utf8")).toContain(`"${GIFT_PATH}"`);
    // Paginile cardului de tipărit și ale darului rămân private.
    expect(PRIVATE_PREFIXES).toContain("/cadou/");
  });

  it("titlul și descrierea au prețul din Admin (nu scris în text) și diferă de ale celorlalte pagini, în toate limbile", async () => {
    for (const l of LOCALES) {
      const m = (await loadMessages(l)) as unknown as Record<string, Record<string, string>>;
      const g = m.GiftPage;
      expect(g.metaTitle, l).toContain("{price}");
      expect(g.metaDescription, l).toContain("{price}");
      expect(g.title, l).toContain("{price}");
      expect(g.metaTitle, l).not.toMatch(/\d/);
      const others = Object.entries(m).filter(([ns]) => ns !== "GiftPage").map(([, v]) => v?.metaTitle).filter(Boolean);
      expect(others, l).not.toContain(g.metaTitle);
    }
    const ro = (await loadMessages("ro")) as unknown as Record<string, Record<string, string>>;
    expect(ro.GiftPage.metaTitle).toBe("Cadou de Crăciun pentru părinți și bunici – arborele familiei, {price}");
  });

  it("datele structurate: WebPage, BreadcrumbList și FAQPage cu toate întrebările", () => {
    const d = giftJsonLd({ title: "T", description: "D", home: "Acasă", crumb: "Cadou", lang: "ro", faq: [{ q: "Q1", a: "A1" }, { q: "Q2", a: "A2" }] });
    const types = d["@graph"].map((x) => x["@type"]);
    expect(types).toEqual(["WebPage", "BreadcrumbList", "FAQPage"]);
    const faq = d["@graph"][2] as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual([["Q1", "A1"], ["Q2", "A2"]]);
    const crumbs = d["@graph"][1] as { itemListElement: { item: string }[] };
    expect(crumbs.itemListElement.at(-1)?.item).toMatch(/\/cadou-de-sarbatori$/);
  });

  it("prețul nu e scris în pagină: vine din Admin → Manager control", () => {
    const src = readFileSync("src/app/(site)/cadou-de-sarbatori/page.tsx", "utf8");
    expect(src).not.toMatch(/\b49\b/);
    expect(src).toContain("publicPlanSettings");
  });
});

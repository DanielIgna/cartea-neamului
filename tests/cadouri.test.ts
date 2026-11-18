import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../next.config";
import { CHRISTMAS, GIFT_PAGES, GIFTS_DESCRIPTION, GIFTS_TITLE, giftPage, giftPath, giftWords } from "@/lib/cadouri";
import { inSeason, orthodoxEaster, seasonalOrder } from "@/lib/seo/sezon";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { searchSite } from "@/lib/continut/cautare";

/** Etapa 2 a planului SEO (Daniel, 18.11.2026): /cadouri, cu Crăciunul primul în sezon. */
describe("/cadouri: paginile", () => {
  it("24 de pagini: 14 ocazii (Crăciunul e /cadou-de-sarbatori) și 10 destinatari", () => {
    expect(GIFT_PAGES.filter((p) => p.kind === "ocazie")).toHaveLength(14);
    expect(GIFT_PAGES.filter((p) => p.kind === "destinatar")).toHaveLength(10);
    expect(giftPage("craciun")).toBeNull();
  });

  it("titluri de cel mult 60 de semne, descrieri 120–155, toate unice", () => {
    for (const p of [{ title: GIFTS_TITLE, description: GIFTS_DESCRIPTION }, ...GIFT_PAGES]) {
      expect(p.title.length, p.title).toBeLessThanOrEqual(60);
      expect(p.description.length, p.title).toBeGreaterThanOrEqual(120);
      expect(p.description.length, p.title).toBeLessThanOrEqual(155);
    }
    expect(new Set(GIFT_PAGES.map((p) => p.title)).size).toBe(GIFT_PAGES.length);
    expect(new Set(GIFT_PAGES.map((p) => p.description)).size).toBe(GIFT_PAGES.length);
    expect(new Set(GIFT_PAGES.map((p) => p.h1)).size).toBe(GIFT_PAGES.length);
  });

  it("fiecare pagină are text propriu, idei, un bilet și întrebări", () => {
    for (const p of GIFT_PAGES) {
      expect(giftWords(p), p.slug).toBeGreaterThanOrEqual(250);
      expect(p.ideas.items.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.faq.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(p.more, p.slug).toBeDefined();
    }
  });

  it("legăturile „Vezi și” duc la pagini care există, nu la ea însăși", () => {
    for (const p of GIFT_PAGES) for (const r of p.related) {
      expect(giftPage(r), `${p.slug} → ${r}`).not.toBeNull();
      expect(r).not.toBe(p.slug);
    }
  });

  it("fără prețuri scrise de mână și fără carte tipărită, livrare sau recenzii", () => {
    const src = readFileSync("src/lib/cadouri.ts", "utf8") + readFileSync("src/components/cadouri/GiftPages.tsx", "utf8");
    expect(src).not.toMatch(/\d+\s*(lei|€|euro)/i);
    expect(src).not.toMatch(/carte tipărită (livrată|acasă)|livrăm|livrare|curier gratuit|recenzi|aggregateRating/i);
    expect(src).not.toMatch(/\bAI\b|inteligen[țt]ă artificială|ChatGPT|Claude/);
  });
});

describe("calendarul sezonier", () => {
  it("Paștele ortodox", () => {
    expect(orthodoxEaster(2026).toISOString().slice(0, 10)).toBe("2026-04-12");
    expect(orthodoxEaster(2027).toISOString().slice(0, 10)).toBe("2027-05-02");
  });

  it("acum (18 noiembrie) Crăciunul e în sezon și primul în hub", () => {
    const now = new Date("2026-11-18T10:00:00Z");
    expect(inSeason("craciun", now)).toBe(true);
    const items = [{ key: null, n: "x" }, { key: "paste" as const, n: "p" }, { key: "craciun" as const, n: "c" }];
    expect(seasonalOrder(items, now)[0].n).toBe("c");
  });

  it("în februarie ies în față 1 și 8 Martie; Crăciunul nu mai e în sezon", () => {
    const now = new Date("2027-02-10T10:00:00Z");
    expect(inSeason("craciun", now)).toBe(false);
    expect(inSeason("martie", now)).toBe(true);
    const ordered = seasonalOrder([{ key: "craciun" as const }, ...GIFT_PAGES.filter((p) => p.kind === "ocazie").map((p) => ({ key: p.season ?? null, slug: p.slug }))], now);
    expect(["1-martie", "8-martie"]).toContain((ordered[0] as { slug?: string }).slug);
  });

  it("Ziua Mamei și Ziua Tatălui: în aprilie", () => {
    expect(inSeason("ziua-mamei", new Date("2027-04-20T10:00:00Z"))).toBe(true);
    expect(inSeason("ziua-mamei", new Date("2027-06-20T10:00:00Z"))).toBe(false);
  });
});

describe("/cadouri în site", () => {
  it("/cadouri/craciun trimite la pagina de Crăciun", async () => {
    const r = (await config.redirects!()).find((x) => x.source === "/cadouri/craciun")!;
    expect(r.destination).toBe(CHRISTMAS.path);
    expect(r.permanent).toBe(true);
  });

  it("toate paginile sunt în sitemap", () => {
    const g = sitemapGroups().find((x) => x.name === "cadouri")!;
    expect(g.urls.map((u) => u.path)).toEqual(["/cadouri", ...GIFT_PAGES.map(giftPath)]);
  });

  it("se găsesc în căutarea din site", () => {
    expect(searchSite("cadou bunici").some((h) => h.href === "/cadouri/pentru-bunici")).toBe(true);
  });

  it("legătură în subsol (română)", () => {
    expect(readFileSync("src/components/SiteFooter.tsx", "utf8")).toContain('href="/cadouri"');
  });
});

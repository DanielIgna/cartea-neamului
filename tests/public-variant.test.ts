import { describe, expect, it } from "vitest";
import { SHOP_MODELS, SHOP_PATH } from "@/lib/invitatii-nunta";
import { readFileSync } from "node:fs";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { sectionOf } from "@/lib/public-sections";
import { parseVariant, variantKey } from "@/lib/public-variant";

describe("paginile publice gata făcute", () => {
  it("varianta se scrie și se citește la fel", () => {
    const v = { locale: "fr", theme: "dark", cookieSeen: true } as const;
    expect(parseVariant(variantKey(v))).toEqual(v);
    expect(parseVariant("xx.auto.0")).toBeNull();
    expect(parseVariant("ro.blue.0")).toBeNull();
    expect(parseVariant("ro.auto.2")).toBeNull();
    expect(parseVariant("ro.auto.0.x")).toBeNull();
  });

  it("middleware-ul prinde exact paginile din PUBLIC_PAGES și fiecare are variantă în app/(public)", () => {
    const src = readFileSync("src/middleware.ts", "utf8");
    const list = src.slice(src.indexOf("matcher:"));
    const matcher = [...list.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]).filter((p) => !p.startsWith("/pub") && !p.startsWith("/:lang(") && !sectionOf(p.replace(/:\w+/g, "x")));
    // Modelele de invitații de nuntă au o singură rută dinamică (/invitatii-nunta/:slug), câte o adresă pe model în PUBLIC_PAGES.
    const shop = (p: string) => p.startsWith(`${SHOP_PATH}/`) && SHOP_MODELS.some((m) => p === `${SHOP_PATH}/${m.slug}`);
    expect(new Set(matcher.flatMap((p) => (p === `${SHOP_PATH}/:slug` ? SHOP_MODELS.map((m) => `${SHOP_PATH}/${m.slug}`) : [p])))).toEqual(new Set(PUBLIC_PAGES.map((p) => p.path)));
    for (const p of PUBLIC_PAGES) {
      const file = `src/app/(public)/pub/[v]${p.path === "/" ? "" : shop(p.path) ? `${SHOP_PATH}/[slug]` : p.path}/page.tsx`;
      expect(() => readFileSync(file), file).not.toThrow();
    }
  });
});

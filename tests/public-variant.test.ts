import { describe, expect, it } from "vitest";
import { SHOP_PATH } from "@/lib/invitatii-nunta";
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
    // Modelele de invitații de nuntă vin din baza de date: o singură rută dinamică (/invitatii-nunta/:slug), cu varianta ei.
    expect(matcher).toContain(`${SHOP_PATH}/:slug`);
    expect(() => readFileSync(`src/app/(public)/pub/[v]${SHOP_PATH}/[slug]/page.tsx`)).not.toThrow();
    expect(new Set(matcher.filter((p) => p !== `${SHOP_PATH}/:slug`))).toEqual(new Set(PUBLIC_PAGES.map((p) => p.path)));
    for (const p of PUBLIC_PAGES) {
      const file = `src/app/(public)/pub/[v]${p.path === "/" ? "" : p.path}/page.tsx`;
      expect(() => readFileSync(file), file).not.toThrow();
    }
  });
});

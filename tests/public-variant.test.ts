import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PUBLIC_PAGES } from "@/lib/public-pages";
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
    const matcher = [...list.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]).filter((p) => !p.startsWith("/pub"));
    expect(new Set(matcher)).toEqual(new Set(PUBLIC_PAGES.map((p) => p.path)));
    for (const p of PUBLIC_PAGES) {
      const file = `src/app/(public)/pub/[v]${p.path === "/" ? "" : p.path}/page.tsx`;
      expect(() => readFileSync(file), file).not.toThrow();
    }
  });
});

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { images, parseBlocks } from "@/lib/continut/markdown";
import { loadCollection } from "@/lib/continut/colectii";
import { sitemapGroups, urlsetXml } from "@/lib/continut/sitemap";

describe("imaginile din ghiduri și glosar", () => {
  it("se citesc din markdown, cu text alternativ și legendă", () => {
    const b = parseBlocks('![Schema gradelor](/imagini/x.svg "Legenda")');
    expect(b).toEqual([{ t: "img", alt: "Schema gradelor", src: "/imagini/x.svg", v: "Legenda" }]);
  });
  it("fiecare imagine există în public/ și are text alternativ descriptiv", () => {
    for (const c of ["ghid", "glosar"] as const) for (const e of loadCollection(c)) for (const im of images(e.blocks)) {
      expect(existsSync(path.join("public", im.src)), im.src).toBe(true);
      expect(im.alt.split(/\s+/).length, im.src).toBeGreaterThanOrEqual(5);
    }
  });
  it("intră în sitemap ca image:image", () => {
    const g = sitemapGroups().find((x) => x.name === "glosar")!;
    const xml = urlsetXml(g.urls);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain("/imagini/grade-de-rudenie-schema.svg</image:loc>");
  });
});

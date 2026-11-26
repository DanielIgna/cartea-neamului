import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { compareGroups, pagesWithImages } from "@/lib/seo-imagini";
import { KIN_PAGES } from "@/lib/unelte/rudenie-pagini";
import { sitemapGroups, urlsetXml } from "@/lib/continut/sitemap";
import { imgKey } from "@/components/continut/Figura";

const row = (page: string, impressions: number, clicks: number, position: number) => ({ keys: [`https://carteaneamului.ro${page}`], impressions, clicks, ctr: clicks / impressions, position });

describe("Admin → SEO → Imagini", () => {
  it("găsește paginile cu desene din ghiduri, glosar și paginile de rudenie", () => {
    const list = pagesWithImages();
    const paths = list.map((x) => x.path);
    expect(paths).toContain("/glosar/livret-militar");
    expect(paths).toContain("/ghid/scrierea-chirilica-romaneasca");
    expect(paths).toContain("/unelte/rudenie/cumnat");
    expect(list.length).toBeGreaterThanOrEqual(15);
  });
  it("compară paginile cu desene cu celelalte, doar în română, cu locul ponderat", () => {
    const cur = [row("/glosar/a", 100, 5, 4), row("/glosar/a/", 100, 5, 8), row("/glosar/b", 50, 0, 10), row("/en/glosar/a", 999, 99, 1)];
    const prev = [row("/glosar/a", 80, 2, 6), row("/glosar/b", 40, 1, 9)];
    const g = compareGroups(cur, prev, new Set(["/glosar/a"]));
    expect(g.with).toMatchObject({ pages: 1, seen: 1, impressions: 200, clicks: 10, prevImpressions: 80, prevClicks: 2 });
    expect(g.with.position).toBe(6);
    expect(g.with.ctr).toBeCloseTo(0.05);
    expect(g.without).toMatchObject({ seen: 1, impressions: 50, clicks: 0, prevClicks: 1 });
  });
  it("desenele paginilor de rudenie există, au text alternativ și intră în sitemap", () => {
    const withImg = KIN_PAGES.filter((p) => p.image);
    expect(withImg.length).toBeGreaterThanOrEqual(3);
    for (const p of withImg) {
      expect(existsSync(path.join("public", p.image!.src)), p.image!.src).toBe(true);
      expect(p.image!.alt.split(/\s+/).length).toBeGreaterThanOrEqual(5);
    }
    const xml = urlsetXml(sitemapGroups().find((x) => x.name === "unelte")!.urls);
    expect(xml).toContain("/imagini/cumnat-cumnata-schema.svg</image:loc>");
  });
  it("numele desenului pentru clic e scurt și curat", () => {
    expect(imgKey("/imagini/cumnat-cumnata-schema.svg")).toBe("cumnat-cumnata-schema");
    expect(imgKey("/imagini/cumnat-cumnata-schema.svg")).toMatch(/^[a-z0-9-]{2,60}$/);
  });
  it("fiecare desen din public/imagini are titlu și descriere pentru cititoarele de ecran", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    for (const f of readdirSync("public/imagini").filter((x) => x.endsWith(".svg"))) {
      const svg = readFileSync(path.join("public/imagini", f), "utf8");
      expect(svg, f).toMatch(/<title id="t">[^<]{10,}<\/title>/);
      expect(svg, f).toMatch(/<desc id="d">[^<]{20,}<\/desc>/);
    }
  });
});

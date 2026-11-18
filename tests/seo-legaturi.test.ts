import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { bodyLinks, indexRequests, inspectLink, internalPath, linkReport, linkStats, pagingLinks, type LinkData } from "@/lib/seo/legaturi";
import { auditPages } from "@/lib/seo-audit";
import LINKS from "@/data/seo-legaturi.json";

describe("legăturile interne", () => {
  it("curăță adresele și lasă afară alte site-uri, fișiere și ancore", () => {
    expect(internalPath("/ghid/x/?a=1#b")).toBe("/ghid/x");
    expect(internalPath("https://carteaneamului.ro/nume/pop")).toBe("/nume/pop");
    expect(internalPath("https://www.carteaneamului.ro")).toBe("/");
    expect(internalPath("https://familysearch.org/x")).toBeNull();
    expect(internalPath("#sus")).toBeNull();
    expect(internalPath("mailto:a@b.ro")).toBeNull();
    expect(internalPath("/sigla.png")).toBeNull();
    expect(internalPath("//cdn.x/y")).toBeNull();
  });

  it("numără doar legăturile din corpul paginii, fără meniu, subsol și pagina însăși", () => {
    const html = `<header><a href="/contact">c</a></header><main><a href="/ghid/a">a</a><a class="x" href='/ghid/b?x=1'>b</a><a href="/ghid">self</a><a href="/ghid/a#z">a2</a></main><footer><a href="/presa">p</a></footer>`;
    expect(bodyLinks(html, "/ghid").sort()).toEqual(["/ghid/a", "/ghid/b"]);
    expect(pagingLinks(`<a href="/nume?pagina=2">2</a><a href="/nume?pagina=3">3</a><a href="/ghid?pagina=2">x</a>`, "/nume")).toEqual(["/nume?pagina=2", "/nume?pagina=3"]);
  });

  it("socotește legăturile primite și găsește orfanele", () => {
    const stats = linkStats(new Map([["/", ["/a", "/b"]], ["/a", ["/b"]], ["/b", []], ["/c", ["/a"]]]));
    expect(stats["/b"]).toEqual({ in: 2, out: 0, from: ["/", "/a"] });
    expect(stats["/c"].in).toBe(0);
    const pages = auditPages();
    const data: LinkData = { generated: "2026-11-18", pages: Object.fromEntries(pages.map((p) => [p.path, { in: p.path === "/ghid" ? 0 : 5, out: 1, from: [] }])) };
    const r = linkReport(data, pages)!;
    expect(r.orphans.map((p) => p.path)).toEqual(["/ghid"]);
    expect(linkReport(null, pages)).toBeNull();
  });

  it("fișierul cu legături e făcut și nicio pagină bună din sitemap nu e orfană", () => {
    const r = linkReport(LINKS as LinkData, auditPages())!;
    expect(r.measured).toBeGreaterThan(500);
    expect(r.orphans.map((p) => p.path)).toEqual([]);
  });
});

describe("De cerut indexare", () => {
  const pages = auditPages();
  it("dă cel mult 15 pagini indexabile, hub-urile întâi, fără cele care apar deja în Google", () => {
    const list = indexRequests(pages, { lastmod: () => null });
    expect(list).toHaveLength(15);
    expect(list.every((p) => p.indexable && p.inSitemap)).toBe(true);
    expect(list[0].path).toBe("/");
    expect(list.map((p) => p.path)).toContain("/cadou-de-sarbatori");
    const seen = new Map(list.slice(0, 3).map((p) => [p.path, { impressions: 10 }]));
    expect(indexRequests(pages, { lastmod: () => null, gscPages: seen }).map((p) => p.path)).not.toContain(list[0].path);
  });

  it("leagă spre Inspectarea adresei din Search Console", () => {
    expect(inspectLink("https://carteaneamului.ro/cadouri")).toBe("https://search.google.com/search-console/inspect?resource_id=sc-domain%3Acarteaneamului.ro&id=https%3A%2F%2Fcarteaneamului.ro%2Fcadouri");
    expect(readFileSync("src/app/(site)/admin/seo/page.tsx", "utf8")).toContain("De cerut indexare (primele 15)");
  });
});

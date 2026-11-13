import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { loadCollection } from "@/lib/continut/colectii";
import { links, parseBlocks, parseFrontmatter, parseInline } from "@/lib/continut/markdown";
import { INDEX_LIMIT, indexXml, mainSitemapXml, sitemapGroups, urlsetXml, type SitemapGroup } from "@/lib/continut/sitemap";
import { hubMetadata, entryMetadata } from "@/components/continut/ArticlePages";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { sectionOf, PUBLIC_SECTIONS } from "@/lib/public-sections";
import { isPublicPath } from "@/lib/public-variant";

const guides = loadCollection("ghid");
const terms = loadCollection("glosar");
const all = [...guides, ...terms];
const known = new Set([...PUBLIC_PAGES.map((p) => p.path), ...PUBLIC_SECTIONS.map((s) => s.hub), ...all.map((e) => e.path)]);

describe("ghiduri și glosar: conținutul din content/", () => {
  it("sunt destule pagini și fiecare are titlu, descriere bună și dată", () => {
    expect(guides.length).toBeGreaterThanOrEqual(30);
    expect(terms.length).toBeGreaterThanOrEqual(40);
    for (const e of all) {
      expect(e.title, e.slug).toBeTruthy();
      expect(e.description.length, `${e.path}: ${e.description.length} caractere`).toBeGreaterThanOrEqual(70);
      expect(e.description.length, `${e.path}: ${e.description.length} caractere`).toBeLessThanOrEqual(170);
      expect(Number.isNaN(e.updated.getTime()), e.path).toBe(false);
      expect(e.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      // Nu pagini subțiri: un ghid are măcar 150 de cuvinte, un termen măcar 50.
      expect(e.words, e.path).toBeGreaterThanOrEqual(e.collection === "ghid" ? 150 : 50);
    }
    for (const g of guides) expect(g.category, g.path).not.toBe("Altele");
  });

  it("un singur H1 pe pagină: în fișiere nu există titluri de nivel 1", () => {
    for (const c of ["ghid", "glosar"]) {
      for (const f of readdirSync(`content/${c}`)) {
        const { body } = parseFrontmatter(readFileSync(`content/${c}/${f}`, "utf8"));
        expect(body, `${c}/${f}`).not.toMatch(/^#\s/m);
      }
    }
  });

  it("titlurile și descrierile sunt unice pe tot site-ul (fără duplicate pentru Google)", () => {
    const metas = [
      hubMetadata("ghid", 1), hubMetadata("glosar", 1),
      ...guides.map((e) => entryMetadata("ghid", e.slug)), ...terms.map((e) => entryMetadata("glosar", e.slug)),
    ];
    const titles = metas.map((m) => String(m.title));
    const descs = metas.map((m) => String(m.description));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    for (const [i, m] of metas.entries()) {
      expect(m.alternates?.canonical, titles[i]).toMatch(/^https:\/\//);
      expect(m.openGraph?.title).toBe(m.title);
      expect(titles[i].length, titles[i]).toBeLessThanOrEqual(80);
    }
  });

  it("legăturile din text, ghidurile înrudite și termenii duc la pagini care există", () => {
    for (const e of all) {
      for (const href of links(e.blocks)) {
        if (!href.startsWith("/")) { expect(href, e.path).toMatch(/^https:\/\//); continue; }
        expect(known.has(href.split("#")[0]), `${e.path} → ${href}`).toBe(true);
      }
      for (const s of e.related) expect(guides.some((g) => g.slug === s), `${e.path}: ghid ${s}`).toBe(true);
      for (const s of e.terms) expect(terms.some((t) => t.slug === s), `${e.path}: termen ${s}`).toBe(true);
    }
  });

  it("fiecare termen din glosar e legat din cel puțin o altă pagină", () => {
    const targets = new Set(all.flatMap((e) => [...links(e.blocks), ...e.terms.map((s) => `/glosar/${s}`)]).filter(Boolean));
    for (const t of terms) expect(targets.has(t.path), t.path).toBe(true);
  });

  it("markdown-ul: titluri, liste, note și legături", () => {
    const b = parseBlocks("## Unu doi\n\nText cu **bold** și [link](/ghid/x).\n\n- a\n- b\n\n1. x\n\n> notă");
    expect(b.map((x) => x.t)).toEqual(["h2", "p", "ul", "ol", "note"]);
    expect(b[0]).toMatchObject({ id: "unu-doi" });
    expect(parseInline("a *b* [c](/d)")).toEqual([{ t: "text", v: "a " }, { t: "i", v: "b" }, { t: "text", v: " " }, { t: "a", v: "c", href: "/d" }]);
  });
});

describe("adresele secțiunilor și cache-ul public", () => {
  it("hubul și paginile sunt publice; adresele greșite sau prea adânci nu", () => {
    expect(sectionOf("/ghid")).toBe("ghid");
    expect(sectionOf("/ghid/cum-incepi-arborele-genealogic")).toBe("ghid");
    expect(sectionOf("/glosar/naș")).toBeNull();
    expect(sectionOf("/ghid/a/b")).toBeNull();
    expect(sectionOf("/ghidx")).toBeNull();
    expect(isPublicPath("/glosar/conscriptie")).toBe(true);
    expect(isPublicPath("/arbore/123")).toBe(false);
  });

  it("fiecare secțiune are paginile ei gata făcute în app/(public)", () => {
    for (const s of PUBLIC_SECTIONS) {
      expect(() => readFileSync(`src/app/(public)/pub/[v]${s.hub}/page.tsx`)).not.toThrow();
      const param = s.key === "localitati" ? "[judet]" : "[slug]";
      expect(() => readFileSync(`src/app/(public)/pub/[v]${s.hub}/${param}/page.tsx`)).not.toThrow();
      expect(readFileSync("src/middleware.ts", "utf8")).toContain(`"${s.hub}/:${param.slice(1, -1)}"`);
    }
  });
});

describe("sitemap.xml", () => {
  const groups = sitemapGroups();
  const urls = groups.flatMap((g) => g.urls);

  it("are toate paginile publice, ghidurile și termenii, fiecare o singură dată", () => {
    const paths = urls.map((u) => u.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of PUBLIC_PAGES) expect(paths).toContain(p.path);
    for (const e of all) expect(paths).toContain(e.path);
    expect(paths).toContain("/ghid");
    expect(paths).toContain("/glosar");
  });

  it("data ultimei schimbări vine din fișier, iar hubul are data celei mai noi pagini", () => {
    const g = groups.find((x) => x.name === "ghid")!;
    const newest = Math.max(...guides.map((e) => e.updated.getTime()));
    expect(g.urls[0].lastModified.getTime()).toBe(newest);
    expect(g.urls.find((u) => u.path === guides[0].path)?.lastModified.getTime()).toBe(guides[0].updated.getTime());
  });

  it("e un singur fișier până la INDEX_LIMIT adrese, apoi un index pe secțiuni", () => {
    const xml = mainSitemapXml(groups);
    if (urls.length <= INDEX_LIMIT) expect(xml).toContain("<urlset");
    else expect(xml).toContain("<sitemapindex");
    const many: SitemapGroup[] = [
      { name: "a", label: "A", urls: Array.from({ length: INDEX_LIMIT }, (_, i) => ({ path: `/a/${i}`, lastModified: new Date("2026-01-01"), changeFrequency: "monthly", priority: 0.5 })) },
      { name: "b", label: "B", urls: [{ path: "/b", lastModified: new Date("2026-11-13"), changeFrequency: "monthly", priority: 0.5 }] },
    ];
    const idx = mainSitemapXml(many);
    expect(idx).toBe(indexXml(many));
    expect(idx).toContain("/sitemaps/a.xml</loc>");
    expect(idx).toContain("<lastmod>2026-11-13T00:00:00.000Z</lastmod>");
    expect(urlsetXml(many[1].urls)).toContain("<loc>");
    expect(urlsetXml([{ path: "/x?a=1&b=2", lastModified: new Date(0), changeFrequency: "yearly", priority: 0.1 }])).toContain("a=1&amp;b=2");
  });
});

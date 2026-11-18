import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { BYLINE, ORG, pageCardUrl } from "@/lib/seo/organizatie";
import { publicPageMetadata } from "@/lib/page-metadata";
import { versionEntries } from "@/lib/seo/versiuni";
import { auditPages } from "@/lib/seo-audit";
import { GET } from "@/app/api/card/route";

/** Planul SEO, secțiunea 7: poza de previzualizare a fiecărui tip de pagină și autorul „echipa Cartea Neamului”. */
describe("pozele de previzualizare", () => {
  it("fiecare tip de pagină din sitemap are cardul ei; prima pagină, ebraica și paginile traduse păstrează poza comună", () => {
    for (const p of ["/ghid/cum-ceri-un-act-de-stare-civila", "/glosar", "/cadouri/botez", "/unelte/calculator-grad-de-rudenie", "/genealogie/regiune/banat", "/genealogie/cluj-napoca", "/scoala/clasa-4", "/en/diaspora/italy"]) {
      if (!versionEntries()[p]) continue;
      expect(pageCardUrl(p), p).toMatch(/^\/api\/card\?pagina=.+&v=[0-9a-f]+$/);
    }
    expect(pageCardUrl("/cadouri/botez")).toBeTruthy();
    expect(pageCardUrl("/")).toBeNull();
    expect(pageCardUrl("/en/contact")).toBeNull();
    expect(Object.keys(versionEntries()).filter((p) => p.startsWith("/he/")).every((p) => pageCardUrl(p) === null)).toBe(true);
    expect(pageCardUrl("/nu-exista")).toBeNull();
  });

  it("fiecare card cerut de o pagină are de unde să-și ia titlul", () => {
    const known = new Set(auditPages().map((p) => p.path));
    const missing = Object.keys(versionEntries()).filter((p) => pageCardUrl(p) && !known.has(p));
    expect(missing).toEqual([]);
  });

  it("metadatele paginii pun cardul în Open Graph și Twitter", () => {
    const m = publicPageMetadata({ path: "/cadouri/botez", title: "Cadou de botez", description: "x", locale: "ro" });
    const og = (m.openGraph?.images as { url: string }[])[0];
    expect(og.url).toBe(pageCardUrl("/cadouri/botez"));
    expect((m.twitter?.images as { url: string }[])[0].url).toBe(og.url);
    const home = publicPageMetadata({ path: "/", title: "Acasă", description: "x", locale: "ro" });
    expect((home.openGraph?.images as { url: string }[])[0].url).toBe("/opengraph-image.png");
  });

  // Desenul (PNG 1200×630) se verifică pe site-ul pornit; aici, doar că adresele străine sau private nu primesc card.
  it("o adresă necunoscută sau privată dă 404", async () => {
    expect((await GET(new Request("https://carteaneamului.ro/api/card?pagina=%2Fadmin"))).status).toBe(404);
    expect((await GET(new Request("https://carteaneamului.ro/api/card?pagina=%2Fen%2Fcontact"))).status).toBe(404);
  });
});

describe("autorul în datele pentru Google", () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : []; });

  it("e organizația Cartea Neamului, fără nume de persoană, telefon sau adresă", () => {
    expect(ORG.name).toBe("Cartea Neamului");
    expect(ORG["@id"]).toMatch(/\/#organization$/);
    expect(JSON.stringify(ORG)).not.toMatch(/telephone|address|Igna|Daniel/i);
    expect(BYLINE).toBe("echipa Cartea Neamului");
    const bad = files("src/components").concat(files("src/app")).filter((f) => /author:\s*\{\s*"@type":\s*"Person"/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });

  it("ghidurile poartă semnătura echipei, vizibil și în JSON-LD", () => {
    const src = readFileSync("src/components/continut/ArticlePages.tsx", "utf8");
    expect(src).toContain("De {BYLINE}");
    expect(src).toContain("author: PUBLISHER");
    expect(src).toContain("const PUBLISHER = ORG;");
  });
});

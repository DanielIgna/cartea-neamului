import { describe, expect, it } from "vitest";
import { auditAlerts, auditPages, sitemapCheck } from "@/lib/seo-audit";
import { ownPath, readHtml } from "@/lib/seo-inspector";
import { explainGscError } from "@/lib/seo";
import { loadNames } from "@/lib/continut/nume";
import { nameGate } from "@/lib/continut/prag";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { clusterOf } from "@/lib/seo-clustere";
import { TARGET_KEYWORDS, matchTarget } from "@/lib/seo-cuvinte";
import { attributionFromMetadata, attributionToMetadata, sessionStartOf, UNKNOWN } from "@/lib/conversii";
import { ctaTarget } from "@/lib/cta";

describe("pragul de indexare", () => {
  it("paginile de nume subțiri nu intră în sitemap, celelalte da", () => {
    const urls = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
    for (const n of loadNames()) expect(urls.has(`/nume/${n.slug}`), n.slug).toBe(!nameGate(n));
    expect(loadNames().filter((n) => !nameGate(n)).length).toBeGreaterThan(200);
  });
  it("inventarul are fiecare adresă din sitemap și nimic dublu", () => {
    const pages = auditPages();
    const paths = pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const g of sitemapGroups()) for (const u of g.urls) expect(paths, u.path).toContain(u.path);
    expect(pages.filter((p) => !p.indexable).every((p) => !p.inSitemap && !!p.gate)).toBe(true);
  });
  it("sitemap-ul e curat: fără dubluri, fără pagini private, adrese simple", () => {
    const s = sitemapCheck();
    expect(s.duplicates).toEqual([]);
    expect(s.privateIn).toEqual([]);
    expect(s.badSlugs).toEqual([]);
  });
  it("alertele nu au nimic critic din conținut", () => {
    expect(auditAlerts(auditPages()).filter((a) => a.level === "critic")).toEqual([]);
    expect(auditAlerts(auditPages(), { gscState: "fara-cheie" }).some((a) => a.code === "GSC_NELEGAT")).toBe(true);
  });
});

describe("grupele paginilor", () => {
  it("recunoaște secțiunile și zona privată", () => {
    expect(clusterOf("/ghid/cum-incepi-arborele-genealogic").key).toBe("ghid");
    expect(clusterOf("/nume/popescu").key).toBe("nume");
    expect(clusterOf("/localitati/cluj/cluj-napoca").key).toBe("localitati");
    expect(clusterOf("/").key).toBe("pagini");
    expect(clusterOf("/arbore/…").indexable).toBe(false);
  });
});

describe("inspectorul", () => {
  it("primește doar adrese de pe site", () => {
    expect(ownPath("/ghid/x/")).toBe("/ghid/x");
    expect(ownPath("https://www.carteaneamului.ro/nume/pop")).toBe("/nume/pop");
    expect(ownPath("carteaneamului.ro")).toBe("/");
    expect(ownPath("https://exemplu.com/x")).toBeNull();
    expect(ownPath("")).toBeNull();
  });
  it("citește titlul, canonicul, H1, JSON-LD și textul", () => {
    const r = readHtml(`<html><head><title>Titlu &amp; test</title><meta name="description" content="O descriere"><link rel="canonical" href="https://carteaneamului.ro/x"><meta name="robots" content="noindex, follow"><meta property="og:image" content="/a.png"><script type="application/ld+json">{"@type":"Article"}</script></head><body><main><h1>Unu</h1><p>trei cuvinte aici</p><a href="/y">y</a></main></body></html>`);
    expect(r.title).toBe("Titlu & test");
    expect(r.description).toBe("O descriere");
    expect(r.canonical).toBe("https://carteaneamului.ro/x");
    expect(r.robots).toContain("noindex");
    expect(r.h1).toEqual(["Unu"]);
    expect(r.jsonLd).toEqual(["Article"]);
    expect(r.links).toBe(1);
    expect(r.words).toBeGreaterThanOrEqual(4);
  });
});

describe("Search Console", () => {
  it("explică invalid_grant pe românește", () => {
    expect(explainGscError("Google nu a primit cheia: invalid_grant").title).toContain("invalid_grant");
    expect(explainGscError("User does not have sufficient permission for site").fix).toContain("Utilizatori");
  });
  it("potrivește cuvintele țintă cu căutările", () => {
    const k = TARGET_KEYWORDS.find((x) => x.keyword === "arbore genealogic online")!;
    const m = matchTarget(k, [{ query: "arbore genealogic online gratuit", position: 12, impressions: 50, clicks: 1 }]);
    expect(m.exact).toBeNull();
    expect(m.best?.query).toBe("arbore genealogic online gratuit");
  });
});

describe("conversiile", () => {
  it("găsește începutul vizitei (pauză de peste 30 de minute)", () => {
    const v = (min: number, path: string) => ({ at: new Date(Date.UTC(2026, 10, 14, 10, min)), path, source: path === "/a" ? "google" : "direct", medium: null, campaign: null, referrer: null, device: "telefon", country: "RO" });
    // cele mai noi întâi: /c la 10:50, /b la 10:40, /a la 10:20 (aceeași vizită), /vechi la 9:00 (altă vizită)
    const s = sessionStartOf([v(50, "/c"), v(40, "/b"), v(20, "/a"), { ...v(0, "/vechi"), at: new Date(Date.UTC(2026, 10, 14, 9, 0)) }]);
    expect(s?.path).toBe("/a");
    expect(sessionStartOf([])).toBeNull();
  });
  it("sursa trece prin Stripe fără nimic despre om", () => {
    const a = { source: "google", medium: null, campaign: "iarna", referrer: null, landing: "/nume/pop", device: "telefon", country: "RO", attributed: true };
    const md = attributionToMetadata(a);
    expect(Object.keys(md).every((k) => k.startsWith("metadata[a_"))).toBe(true);
    const back = Object.fromEntries(Object.entries(md).map(([k, v]) => [k.slice(9, -1), v]));
    expect(attributionFromMetadata(back)).toEqual(a);
    expect(attributionFromMetadata({})).toBeNull();
    expect(attributionFromMetadata({ a_src: "necunoscut" })).toEqual(UNKNOWN);
  });
  it("numără doar butoanele de început", () => {
    expect(ctaTarget("/intrare?r=1")).toBe("/intrare");
    expect(ctaTarget("https://carteaneamului.ro/plata/")).toBe("/plata");
    expect(ctaTarget("/ghid/x")).toBeNull();
    expect(ctaTarget("https://exemplu.com/intrare")).toBeNull();
  });
});

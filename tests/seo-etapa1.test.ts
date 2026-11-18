import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import config from "../next.config";
import robots, { CRAWL_WASTE } from "@/app/robots";
import { PRIVATE_PREFIXES } from "@/lib/public-pages";
import { hasRealTranslation, pathForLocale } from "@/lib/traduceri-reale";
import { diasporaLangsSource } from "@/lib/diaspora/limbi-sursa";
import { mainSitemapXml, rawGroups, sitemapGroups, urlsetXml } from "@/lib/continut/sitemap";
import { contentFingerprints, unknownSources } from "@/lib/seo/amprente";
import VERSIONS from "@/data/seo-versiuni.json";
import { guideFeedXml } from "@/lib/continut/rss";
import { loadCollection } from "@/lib/continut/colectii";

/** Etapa 1 a planului SEO (Daniel, 18.11.2026): redirecturi, limbi fără traducere, robots, lastmod real, H1, RSS. */
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
function visit(p: string, ua = CHROME) {
  const res = middleware(new NextRequest(new URL(p, "https://carteaneamului.ro"), { headers: new Headers({ "user-agent": ua }) }));
  const rewrite = res.headers.get("x-middleware-rewrite");
  return { status: res.status, location: res.headers.get("location"), to: rewrite ? new URL(rewrite).pathname : null };
}

describe("redirecturi spre adresa principală, fără www", () => {
  it("/preturi și /planuri duc direct pe carteaneamului.ro, într-un singur salt", async () => {
    const r = await config.redirects!();
    for (const src of ["/preturi", "/planuri"]) {
      const x = r.find((y) => y.source === src)!;
      expect(x.destination).toBe("https://carteaneamului.ro/#preturi");
    }
  });

  it("nicio adresă cu www.carteaneamului.ro în cod (doar lista de origini acceptate la intrarea în cont)", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const full = path.join(dir, f);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx|json|md)$/.test(f) && readFileSync(full, "utf8").includes("www.carteaneamului.ro")) hits.push(full);
      }
    };
    for (const d of ["src", "content"]) walk(d);
    walk("."+path.sep+"public");
    expect(hits.map((h) => h.replace(/\\/g, "/"))).toEqual(["src/lib/auth.ts"]);
    expect(readFileSync("next.config.ts", "utf8")).not.toContain("www.carteaneamului.ro");
  });
});

describe("pagini fără traducere pe alte limbi: 308 spre pagina cu text", () => {
  it("ghiduri, glosar, nume, localități, genealogie: doar româna", () => {
    for (const p of ["/en/nume", "/en/nume/clucer", "/en/ghid", "/fr/glosar/catagrafie", "/de/localitati/cluj/cluj-napoca", "/it/genealogie/regiune/banat"]) {
      const r = visit(p);
      expect(r.status, p).toBe(308);
      expect(r.location).toBe(`https://carteaneamului.ro${p.replace(/^\/[a-z]{2}(-[a-z]{2})?/, "")}`);
    }
  });

  it("și pentru roboți (Google nu mai vede text românesc sub lang=en)", () => {
    expect(visit("/en/nume/clucer", GOOGLEBOT)).toMatchObject({ status: 308, location: "https://carteaneamului.ro/nume/clucer" });
  });

  it("parametrii din adresă rămân", () => {
    expect(visit("/en/ghid?pagina=2").location).toBe("https://carteaneamului.ro/ghid?pagina=2");
  });

  it("paginile traduse rămân pe limba lor", () => {
    expect(visit("/en/contact").to).toBe("/pub/en-GB.auto.0/contact");
    expect(visit("/it").to).toBe("/pub/it.auto.0");
    expect(visit("/de/cadou-de-sarbatori").status).not.toBe(308);
  });

  it("paginile doar în română (istoria umanității) trimit la română", () => {
    expect(visit("/en/istoria-umanitatii")).toMatchObject({ status: 308, location: "https://carteaneamului.ro/istoria-umanitatii" });
  });

  it("diaspora: limbile în care e scrisă pagina rămân, celelalte trimit la română", () => {
    expect(hasRealTranslation("/diaspora/italia", "it")).toBe(true);
    expect(hasRealTranslation("/diaspora/italia", "en-US")).toBe(true);
    expect(hasRealTranslation("/diaspora/italia", "nl")).toBe(false);
    expect(visit("/it/diaspora/italia").status).not.toBe(308);
    expect(visit("/nl/diaspora/italia")).toMatchObject({ status: 308, location: "https://carteaneamului.ro/diaspora/italia" });
  });

  it("selectorul de limbă duce doar spre traduceri care există", () => {
    expect(pathForLocale("/nume/pop", "en-GB")).toBe("/nume/pop");
    expect(pathForLocale("/contact", "it")).toBe("/it/contact");
    expect(pathForLocale("/diaspora/italia", "it")).toBe("/it/diaspora/italia");
    expect(pathForLocale("/diaspora/italia", "hu")).toBe("/diaspora/italia");
  });

  it("lista limbilor de diaspora din middleware e la zi (altfel: npx tsx scripts/diaspora-limbi.ts)", () => {
    expect(readFileSync("src/lib/diaspora/limbi-generat.ts", "utf8")).toBe(diasporaLangsSource());
  });

  it("sitemap-ul nu are adrese pe limbi fără traducere", () => {
    for (const g of sitemapGroups()) for (const u of g.urls) {
      const m = u.path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
      if (!m || !["en", "en-us", "fr", "es", "nl", "de", "it", "hu", "he"].includes(m[1])) continue;
      const visitR = visit(u.path);
      expect(visitR.status, u.path).not.toBe(308);
    }
  });
});

describe("robots.txt", () => {
  const r = robots();
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
  it("un singur Allow: /, fără Host", () => {
    expect(rule.allow).toBe("/");
    expect(r.host).toBeUndefined();
  });
  it("părțile private rămân oprite, plus căutarea din site și parametrii de urmărire", () => {
    const dis = rule.disallow as string[];
    for (const p of PRIVATE_PREFIXES) expect(dis).toContain(p);
    for (const p of ["/cauta?", "/*?src=", "/*?utm_"]) expect(dis).toContain(p);
    expect(CRAWL_WASTE.length).toBeGreaterThan(2);
  });
});

describe("lastmod real în sitemap", () => {
  it("fără changefreq și priority", () => {
    const xml = urlsetXml(sitemapGroups().flatMap((g) => g.urls));
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
  });

  it("aceeași dată la două generări (nu ora cererii)", () => {
    const a = mainSitemapXml(sitemapGroups());
    const b = mainSitemapXml(sitemapGroups());
    expect(a).toBe(b);
    for (const g of sitemapGroups().filter((x) => x.name === "pagini" || x.name === "limbi")) for (const u of g.urls) expect(Date.now() - u.lastModified.getTime(), u.path).toBeGreaterThan(60_000);
  });

  it("fiecare adresă din sitemap are data ei în src/data/seo-versiuni.json", () => {
    const v = VERSIONS as Record<string, string>;
    for (const g of sitemapGroups()) for (const u of g.urls) {
      expect(v[u.path], u.path).toMatch(/^[0-9a-f]{12} \d{4}-\d{2}-\d{2}$/);
      expect(u.lastModified.toISOString().slice(0, 10)).toBe(v[u.path].split(" ")[1]);
    }
  });

  it("datele sunt la zi cu conținutul (dacă pică: npx tsx scripts/seo-versiuni.ts)", async () => {
    const v = VERSIONS as Record<string, string>;
    const paths = rawGroups().flatMap((g) => g.urls.map((u) => u.path));
    const prints = await contentFingerprints(paths);
    const stale = paths.filter((p) => v[p]?.split(" ")[0] !== prints.get(p));
    expect(stale).toEqual([]);
  }, 60_000);

  it("fiecare adresă din sitemap are o sursă pentru amprentă (altfel data nu s-ar schimba niciodată)", () => {
    expect(unknownSources(rawGroups().flatMap((g) => g.urls.map((u) => u.path)))).toEqual([]);
  });

  it("schimbarea unui ghid schimbă doar amprenta lui", async () => {
    const [a, b] = loadCollection("ghid");
    const before = await contentFingerprints([a.path, b.path]);
    expect(before.get(a.path)).not.toBe(before.get(b.path));
  });
});

describe("prima pagină și RSS", () => {
  it("H1: sloganul și numele site-ului nu se lipesc („taleCartea”)", () => {
    const src = readFileSync("src/components/Landing.tsx", "utf8");
    expect(src).toMatch(/<h1 className="lp-h1"><span className="lp-tagline">\{t\("eyebrow"\)\}<\/span><span className="sr-only"> – <\/span><span className="lp-name">/);
  });

  it("/ghid/feed.xml: RSS 2.0 cu ghidurile, adrese canonice", () => {
    const xml = guideFeedXml();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain("<atom:link href=\"https://carteaneamului.ro/ghid/feed.xml\"");
    const items = xml.match(/<item>/g) ?? [];
    expect(items.length).toBe(Math.min(30, loadCollection("ghid").length));
    expect(xml).not.toContain("www.carteaneamului");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { LOCALES, REGIONAL_HREFLANG, URL_PREFIXES, detectLocale, isCrawler, localizedPath, splitLocalePath } from "@/i18n/locales";
import { languageAlternates } from "@/lib/page-metadata";
import { sitemapGroups, urlsetXml } from "@/lib/continut/sitemap";
import { convertEur, currencyFor, money, priceFor } from "@/lib/plati";
import { DEFAULT_SETTINGS } from "@/lib/plans";

/**
 * Limba ghicită la prima vizită și adresele pe limbă (Daniel, 2026-11-14). Vizitele sunt simulate: antetul Accept-Language
 * al browserului și țara pe care o pune Vercel (x-vercel-ip-country).
 */
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BINGBOT = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";

function visit(path: string, o: { al?: string; country?: string; ua?: string; cookie?: string } = {}) {
  const h = new Headers({ "user-agent": o.ua ?? CHROME });
  if (o.al) h.set("accept-language", o.al);
  if (o.country) h.set("x-vercel-ip-country", o.country);
  if (o.cookie) h.set("cookie", o.cookie);
  const res = middleware(new NextRequest(new URL(path, "https://carteaneamului.ro"), { headers: h }));
  const rewrite = res.headers.get("x-middleware-rewrite");
  return {
    status: res.status,
    location: res.headers.get("location"),
    /** Unde a fost trimisă cererea în interior (fără domeniu), sau null = pagina făcută pe loc (cu întrebarea despre limbă). */
    to: rewrite ? new URL(rewrite).pathname : null,
    setCookie: res.headers.get("set-cookie"),
  };
}

const VISITS = [
  { who: "Italia", al: "it-IT,it;q=0.9,en;q=0.8", country: "IT", locale: "it" },
  { who: "Spania", al: "es-ES,es;q=0.9", country: "ES", locale: "es" },
  { who: "Germania", al: "de-DE,de;q=0.9,en;q=0.7", country: "DE", locale: "de" },
  { who: "SUA", al: "en-US,en;q=0.9", country: "US", locale: "en-US" },
  { who: "Israel", al: "he-IL,he;q=0.9,en;q=0.8", country: "IL", locale: "he" },
  { who: "un român din Italia (it+ro)", al: "it-IT,it;q=0.9,ro;q=0.8", country: "IT", locale: "ro" },
] as const;

describe("limba ghicită: browserul, apoi țara", () => {
  for (const v of VISITS) it(`${v.who} → ${v.locale}`, () => expect(detectLocale({ acceptLanguage: v.al, country: v.country })).toBe(v.locale));

  it("fără limbă știută în browser, după țară", () => {
    expect(detectLocale({ acceptLanguage: "pl-PL,pl;q=0.9", country: "IT" })).toBe("it");
    expect(detectLocale({ country: "AT" })).toBe("de");
    expect(detectLocale({ country: "BE" })).toBe("fr");
    expect(detectLocale({ country: "CA" })).toBe("en-US");
    expect(detectLocale({ country: "GB" })).toBe("en-GB");
    expect(detectLocale({ country: "IE" })).toBe("en-GB");
    expect(detectLocale({ country: "MD" })).toBe("ro");
    expect(detectLocale({ country: "RO" })).toBe("ro");
    // Limbile adăugate pe 19.11.2026: Portugalia, Grecia, Scandinavia, Ucraina, Serbia, Bulgaria, Turcia.
    expect(detectLocale({ acceptLanguage: "pt-PT,pt;q=0.9", country: "PT" })).toBe("pt");
    expect(detectLocale({ country: "NO" })).toBe("nb");
    expect(detectLocale({ country: "UA" })).toBe("uk");
    expect(detectLocale({ country: "CY" })).toBe("el");
    expect(detectLocale({ country: "FI" })).toBe("en-GB");
    // Un român din Grecia cu „el,ro” rămâne pe română.
    expect(detectLocale({ acceptLanguage: "el-GR,ro;q=0.8", country: "GR" })).toBe("ro");
    expect(detectLocale({ acceptLanguage: "ja-JP", country: "JP" })).toBe("ro");
    expect(detectLocale({})).toBe("ro");
  });

  it("limba browserului bate țara; româna oriunde în browser bate tot", () => {
    expect(detectLocale({ acceptLanguage: "en-US,en;q=0.9", country: "IT" })).toBe("en-US");
    expect(detectLocale({ acceptLanguage: "de-DE,de;q=0.9,en;q=0.8,ro;q=0.1", country: "DE" })).toBe("ro");
    expect(detectLocale({ acceptLanguage: "ro-RO", country: "IL" })).toBe("ro");
    expect(detectLocale({ acceptLanguage: "ro;q=0", country: "IT" })).toBe("it");
  });

  it("roboții sunt recunoscuți", () => {
    expect(isCrawler(GOOGLEBOT)).toBe(true);
    expect(isCrawler(BINGBOT)).toBe(true);
    expect(isCrawler("Mozilla/5.0 (compatible; Google-InspectionTool/1.0)")).toBe(true);
    expect(isCrawler(CHROME)).toBe(false);
  });
});

describe("prima vizită simulată pe /", () => {
  for (const v of VISITS) {
    it(`${v.who}: fără redirect; ${v.locale === "ro" ? "pagina în română, fără întrebare" : "pagina făcută pe loc, cu întrebarea"}`, () => {
      const r = visit("/", { al: v.al, country: v.country });
      expect(r.status).toBeLessThan(300);
      expect(r.location).toBeNull();
      // null = pagina făcută pe loc, care arată „Vezi site-ul în …?” (suggestedLocale în i18n/server.ts).
      expect(r.to).toBe(v.locale === "ro" ? "/pub/ro.auto.0" : null);
    });
  }

  it("Googlebot și Bingbot nu sunt niciodată trimiși în altă parte și nu primesc întrebarea", () => {
    for (const v of VISITS) for (const ua of [GOOGLEBOT, BINGBOT]) {
      for (const path of ["/", "/contact", "/ghid"]) {
        const r = visit(path, { ...v, ua });
        expect(r.status).toBeLessThan(300);
        expect(r.location).toBeNull();
        expect(r.to).toBe(`/pub/ro.auto.0${path === "/" ? "" : path}`);
        expect(r.setCookie).toBeNull();
      }
      const it = visit("/it/contact", { ...v, ua });
      expect(it.to).toBe("/pub/it.auto.0/contact");
      expect(it.setCookie).toBeNull();
    }
  });

  it("limba aleasă (cookie, un an) e respectată mereu, oricare ar fi browserul", () => {
    expect(visit("/", { al: "it-IT", country: "IT", cookie: "limba=ro" }).to).toBe("/pub/ro.auto.0");
    expect(visit("/contact", { al: "ro-RO", country: "RO", cookie: "limba=he" }).to).toBe("/pub/he.auto.0/contact");
  });

  it("închisă cu ✕: nu mai întreabă, rămâne pe română", () => {
    expect(visit("/", { al: "it-IT", country: "IT", cookie: "limba_intrebare=1" }).to).toBe("/pub/ro.auto.0");
  });
});

describe("adresele pe limbă", () => {
  it("prefixele din middleware sunt aceleași ca URL_PREFIX", () => {
    const src = readFileSync("src/middleware.ts", "utf8");
    const lists = [...src.matchAll(/"\/:lang\(([^)]+)\)/g)].map((m) => m[1].split("|").sort());
    expect(lists.length).toBe(2);
    for (const l of lists) expect(l).toEqual([...URL_PREFIXES].sort());
  });

  it("localizedPath și splitLocalePath merg dus-întors", () => {
    expect(localizedPath("/", "ro")).toBe("/");
    expect(localizedPath("/", "it")).toBe("/it");
    expect(localizedPath("/contact", "en-US")).toBe("/en-us/contact");
    expect(localizedPath("/termeni", "he")).toBe("/he/termeni");
    for (const l of LOCALES) for (const p of ["/", "/contact", "/localitati/cluj/huedin"]) {
      const s = splitLocalePath(localizedPath(p, l));
      expect(s.path).toBe(p);
      expect(s.locale).toBe(l === "ro" ? null : l);
    }
    expect(splitLocalePath("/it/").path).toBe("/");
    // Un cuvânt care doar începe ca o limbă nu e prefix.
    expect(splitLocalePath("/istoria-umanitatii").locale).toBeNull();
    expect(splitLocalePath("/hello").locale).toBeNull();
  });

  it("/it/contact, /he, /en-us/termeni: pagina gata făcută în limba din adresă; omul rămâne în ea (cookie un an)", () => {
    const r = visit("/it/contact", { al: "ro-RO", country: "RO" });
    expect(r.to).toBe("/pub/it.auto.0/contact");
    expect(r.setCookie).toMatch(/limba=it/);
    expect(r.setCookie).toMatch(/Max-Age=31536000/i);
    expect(visit("/he").to).toBe("/pub/he.auto.0");
    expect(visit("/en-us/termeni").to).toBe("/pub/en-US.auto.0/termeni");
    // Limba aleasă deja nu se schimbă de la sine.
    expect(visit("/it", { cookie: "limba=ro" }).setCookie).toBeNull();
  });

  it("o pagină netradusă (ghiduri) în altă limbă: 308 spre pagina românească (planul SEO, 18.11.2026)", () => {
    expect(visit("/it/ghid")).toMatchObject({ status: 308, location: "https://carteaneamului.ro/ghid" });
    expect(visit("/de/localitati/cluj")).toMatchObject({ status: 308, location: "https://carteaneamului.ro/localitati/cluj" });
  });

  it("cu cont: pagina făcută pe loc, cu limba din adresă trimisă serverului", () => {
    const r = visit("/it/contact", { cookie: "limba=ro; better-auth.session_token=x" });
    expect(r.to).toBe("/contact");
  });

  it("adrese private sub un prefix nu există", () => {
    expect(visit("/it/admin").to).toBe("/pagina-inexistenta");
  });

  it("canonical și hreflang: fiecare limbă cu adresa ei, româna e x-default", () => {
    const a = languageAlternates("/contact", "it");
    expect(a.alternates?.canonical).toBe("https://carteaneamului.ro/it/contact");
    const langs = a.alternates?.languages as Record<string, string>;
    expect(langs["x-default"]).toBe("https://carteaneamului.ro/contact");
    expect(langs.ro).toBe("https://carteaneamului.ro/contact");
    expect(langs.he).toBe("https://carteaneamului.ro/he/contact");
    expect(langs["en-US"]).toBe("https://carteaneamului.ro/en-us/contact");
    // Limbile site-ului, x-default și etichetele regionale (en-CA, ro-US, ro-CA și cele europene), care nu au adresă proprie.
    expect(Object.keys(langs)).toHaveLength(LOCALES.length + 1 + Object.keys(REGIONAL_HREFLANG).length);
    expect(langs["de-AT"]).toBe(langs.de);
    expect(langs["fr-BE"]).toBe(langs.fr);
    expect(langs["en-IE"]).toBe(langs["en-GB"]);
    expect(langs["ro-MD"]).toBe(langs.ro);
    expect(langs["en-CA"]).toBe(langs["en-US"]);
    expect(langs["ro-US"]).toBe(langs.ro);
    expect(langs["ro-CA"]).toBe(langs.ro);
    expect(languageAlternates("/", "ro").alternates?.canonical).toBe("https://carteaneamului.ro/");
    expect(languageAlternates("/", "de").alternates?.canonical).toBe("https://carteaneamului.ro/de");
    // Netradusă: canonical spre română și afară din Google în celelalte limbi.
    const g = languageAlternates("/ghid/cum-incepi", "it");
    expect(g.alternates?.canonical).toBe("https://carteaneamului.ro/ghid/cum-incepi");
    expect(g.robots).toEqual({ index: false, follow: true });
    expect(languageAlternates("/ghid/cum-incepi", "ro").robots).toBeUndefined();
  });

  it("sitemap: paginile traduse în fiecare limbă, cu hreflang", () => {
    const g = sitemapGroups().find((x) => x.name === "limbi")!;
    const it = g.urls.find((u) => u.path === "/it/contact")!;
    expect(it.alternates?.["x-default"]).toBe("/contact");
    expect(g.urls.some((u) => u.path.startsWith("/ro"))).toBe(false);
    const xml = urlsetXml([it]);
    expect(xml).toContain(`xmlns:xhtml="http://www.w3.org/1999/xhtml"`);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="he" href="https://carteaneamului.ro/he/contact"/>`);
  });
});

describe("prețurile în moneda locală", () => {
  const on = { ...DEFAULT_SETTINGS, localCurrency: true };
  it("româna plătește în lei; cu moneda locală oprită, ceilalți în euro", () => {
    expect(currencyFor("ro", "US", on)).toBe("ron");
    expect(currencyFor("en-US", "US", DEFAULT_SETTINGS)).toBe("eur");
  });
  it("după țară, apoi după limbă", () => {
    expect(currencyFor("en-US", "US", on)).toBe("usd");
    expect(currencyFor("en-US", "CA", on)).toBe("cad");
    expect(currencyFor("en-GB", "GB", on)).toBe("gbp");
    expect(currencyFor("he", "IL", on)).toBe("ils");
    expect(currencyFor("it", "IT", on)).toBe("eur");
    expect(currencyFor("he", "DE", on)).toBe("eur");
    expect(currencyFor("he", null, on)).toBe("ils");
  });
  it("suma în euro trecută în altă monedă, rotunjită în sus la prețurile întregi", () => {
    expect(convertEur(10, 1.1)).toBe(11);
    expect(convertEur(30, 0.86)).toBe(26);
    expect(convertEur(12.34, 1.1)).toBe(13.57);
    const p = priceFor("an", "en-US", true, on, "basic", "usd");
    expect(p).toMatchObject({ currency: "usd", amount: 1600 });
    expect(p.label).toContain("$");
    expect(money(20, "he", "ils", on)).toMatchObject({ currency: "ils", amount: 8000 });
    expect(money(10, "it", "eur", on)).toMatchObject({ currency: "eur", amount: 1000, label: "10 €" });
    expect(money(49, "ro")).toMatchObject({ currency: "ron", label: "49 lei" });
  });
});

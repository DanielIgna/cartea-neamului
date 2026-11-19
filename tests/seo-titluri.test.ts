import { describe, expect, it } from "vitest";
import { auditPages } from "@/lib/seo-audit";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { languageAlternates, webPageJsonLd } from "@/lib/page-metadata";
import { searchSite, plain } from "@/lib/continut/cautare";
import { homeFaq, homeJsonLd } from "@/lib/seo/home-faq";
import { DEFAULT_SETTINGS } from "@/lib/plans";
import { TRANSLATED_PAGES, PUBLIC_PAGES } from "@/lib/public-pages";

/** Etapa 2 (Daniel, 17.11.2026): titluri unice de cel mult 60 de semne, descrieri de 120–155, canonical curat, noindex în afara sitemap-ului. */
const pages = auditPages().filter((p) => p.indexable);

describe("titlurile și descrierile paginilor publice", () => {
  it("niciun titlu peste 60 de semne", () => {
    const long = pages.filter((p) => p.title.length > 60).map((p) => `${p.path}: ${p.title}`);
    expect(long).toEqual([]);
  });
  it("titlurile paginilor în română sunt unice", () => {
    // /en-us/… are aceleași titluri ca /en/… (aceeași pagină, alt hreflang), deci nu intră la numărat dublurile.
    const ro = pages.filter((p) => p.category !== "limbă" && !p.path.startsWith("/en-us/"));
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const p of ro) { const k = p.title.replace(/ \| Cartea Neamului$/, ""); if (seen.has(k)) dup.push(`${p.path} = ${seen.get(k)}`); else seen.set(k, p.path); }
    expect(dup).toEqual([]);
  });
  it("descrierile cunoscute au 120–155 de semne", () => {
    const bad = pages.filter((p) => p.description && (p.description.length < 120 || p.description.length > 155)).map((p) => `${p.path}: ${p.description!.length}`);
    expect(bad).toEqual([]);
  });
});

describe("canonical, hreflang și sitemap", () => {
  it("paginile doar în română nu au adrese pe limbi în sitemap și trimit canonic la română", () => {
    const roOnly = PUBLIC_PAGES.filter((p) => p.roOnly).map((p) => p.path);
    expect(roOnly).toEqual(expect.arrayContaining(["/istoria-umanitatii", "/genealogii-vechi"]));
    const urls = new Set(sitemapGroups().flatMap((g) => g.urls.map((u) => u.path)));
    for (const p of roOnly) expect(urls.has(`/it${p}`)).toBe(false);
    const it = languageAlternates("/istoria-umanitatii", "it");
    expect(it.alternates?.canonical).toBe("https://carteaneamului.ro/istoria-umanitatii");
    expect(it.robots).toEqual({ index: false, follow: true });
    expect(TRANSLATED_PAGES.some((p) => p.path === "/resurse-genealogie")).toBe(true);
    expect(languageAlternates("/resurse-genealogie", "it").alternates?.canonical).toBe("https://carteaneamului.ro/it/resurse-genealogie");
  });
  it("nicio pagină noindex nu e în sitemap", () => {
    const all = auditPages();
    expect(all.filter((p) => !p.indexable && p.inSitemap).map((p) => p.path)).toEqual([]);
  });
});

const NAMES = { app: "Cartea Neamului", book: "Cartea neamului în PDF", tiers: { basic: "Basic", familie: "Familie", premium: "Premium" } };
const homeLd = (l: "ro" | "en-US" | "it", on = true) => {
  const s = { ...DEFAULT_SETTINGS, on };
  return homeJsonLd(l, s, "descriere", homeFaq(l, s), NAMES);
};

describe("datele schema.org", () => {
  it("prima pagină: limba paginii, oferte din Admin (doar cu vânzarea pornită) și FAQ doar în română și engleză", () => {
    const en = homeLd("en-US")["@graph"] as Record<string, unknown>[];
    const app = en.find((x) => x["@type"] === "WebApplication") as { offers: { price: string; priceCurrency: string }[]; url: string };
    expect(app.url).toBe("https://carteaneamului.ro/en-us");
    expect(app.offers.map((o) => o.price)).toEqual([DEFAULT_SETTINGS.priceEur, DEFAULT_SETTINGS.familieEur, DEFAULT_SETTINGS.premiumEur, DEFAULT_SETTINGS.bookEur].map(String));
    expect(app.offers[0].priceCurrency).toBe("EUR");
    expect((homeLd("ro")["@graph"] as Record<string, unknown>[]).find((x) => x["@type"] === "WebApplication")).toMatchObject({ offers: [{ priceCurrency: "RON" }, {}, {}, {}] });
    expect(en.find((x) => x["@type"] === "FAQPage")).toBeTruthy();
    expect((homeLd("it")["@graph"] as Record<string, unknown>[]).some((x) => x["@type"] === "FAQPage")).toBe(false);
    // Cu vânzarea oprită: fără oferte și fără întrebarea despre preț.
    const off = homeLd("ro", false)["@graph"] as Record<string, unknown>[];
    expect(off.find((x) => x["@type"] === "WebApplication")).not.toHaveProperty("offers");
    expect(homeFaq("ro", { ...DEFAULT_SETTINGS, on: false }).some((f) => /cost/i.test(f.q))).toBe(false);
  });
  it("întrebările frecvente nu promit carte tipărită și nu au prețuri scrise de mână", () => {
    for (const l of ["ro", "en-US"] as const) for (const f of homeFaq(l, { ...DEFAULT_SETTINGS, on: true })) {
      expect(f.a).not.toMatch(/tipărit|printed|hardcover|livrare|delivery/i);
    }
  });
  it("WebSite are SearchAction spre /cauta", () => {
    const site = homeLd("ro")["@graph"].find((x) => x["@type"] === "WebSite") as { potentialAction?: { target: { urlTemplate: string } } };
    expect(site.potentialAction?.target.urlTemplate).toBe("https://carteaneamului.ro/cauta?q={search_term_string}");
  });
  it("paginile simple au WebPage și BreadcrumbList, cu adresa limbii", () => {
    const d = webPageJsonLd({ path: "/contact", title: "Contatti", description: "x", locale: "it" });
    const types = d["@graph"].map((x) => x["@type"]);
    expect(types).toEqual(["WebPage", "BreadcrumbList"]);
    expect(d["@graph"][0].url).toBe("https://carteaneamului.ro/it/contact");
  });
});

describe("căutarea din site", () => {
  it("găsește fără diacritice nume, județe și ghiduri", () => {
    expect(plain("Târgu-Mureș")).toBe("targu mures");
    expect(searchSite("cluj")[0]?.href).toBe("/localitati/cluj");
    expect(searchSite("registrele militare").some((h) => h.href === "/ghid/registrele-militare")).toBe(true);
    expect(searchSite("a")).toEqual([]);
  });
});

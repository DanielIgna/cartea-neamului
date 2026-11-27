import { describe, expect, it } from "vitest";
import { COUNTRIES, COUNTRY_OF, REGIONS, THEMES, alternatesFor, diasporaAlternates, entries, pickLang, resolve } from "@/lib/diaspora";
import { regionIndexable } from "@/lib/diaspora/america";
import { UI } from "@/lib/diaspora/ui";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { sectionOf } from "@/lib/public-sections";
import { isPublicPath } from "@/lib/public-variant";

describe("diaspora: conținut", () => {
  it("are țările cerute de Daniel, plus SUA și Canada", () => {
    const codes = COUNTRIES.map((c) => c.code).sort();
    expect(codes).toEqual(["AT", "BE", "CA", "CH", "CY", "DE", "DK", "ES", "FR", "GB", "GR", "IE", "IL", "IT", "NL", "NO", "PT", "SE", "UA", "US", "MD", "RS", "BG", "TR", "LU", "AU", "NZ"].sort());
  });

  it("are toate cele 50 de state și cele 13 provincii și teritorii", () => {
    expect(REGIONS.filter((r) => r.kind === "state")).toHaveLength(50);
    expect(REGIONS.filter((r) => r.kind === "province")).toHaveLength(13);
  });

  it("fiecare țară are nume, loc și istorie în fiecare limbă a ei", () => {
    for (const c of COUNTRIES) for (const l of c.langs) {
      expect(c.name[l], `${c.slug} ${l} nume`).toBeTruthy();
      expect(c.where[l], `${c.slug} ${l} loc`).toBeTruthy();
      expect(c.history[l]?.length, `${c.slug} ${l} istorie`).toBeGreaterThanOrEqual(2);
    }
  });

  it("paginile speciale au text în fiecare limbă a lor", () => {
    expect(THEMES.map((t) => t.slug)).toEqual(["radacini-evreiesti", "moldoveni-in-italia-si-israel", "sasi-si-svabi", "maghiari-din-transilvania", "america-de-nord",
      // Daniel, 19.11.2026: valurile de emigrare pe țări (ciornele aprobate).
      ...["italia", "spania", "germania", "austria", "marea-britanie", "franta", "olanda", "belgia", "irlanda"].map((c) => `istoria-romanilor-din-${c}`),
      // Daniel, 19.11.2026: minoritățile din România.
      "aromani", "turci-si-tatari-din-dobrogea", "romi", "rusi-lipoveni", "ucraineni-din-romania", "sarbi-din-romania", "slovaci-din-romania", "bulgari-din-romania"]);
    for (const t of THEMES) for (const l of t.langs) {
      expect(t.name[l] && t.description[l], `${t.slug} ${l}`).toBeTruthy();
      expect(t.body[l]?.length, `${t.slug} ${l} corp`).toBeGreaterThanOrEqual(3);
    }
    expect(THEMES.find((t) => t.slug === "radacini-evreiesti")!.langs).toEqual(expect.arrayContaining(["en", "he"]));
    expect(THEMES.find((t) => t.slug === "sasi-si-svabi")!.langs).toContain("de");
    expect(THEMES.find((t) => t.slug === "maghiari-din-transilvania")!.langs).toContain("hu");
  });

  it("statele cu note au text în fiecare limbă a lor; restul rămân în afara Google", () => {
    for (const r of REGIONS) {
      if (regionIndexable(r)) for (const l of r.langs) expect(r.notes[l]?.length, `${r.slug} ${l}`).toBeGreaterThanOrEqual(2);
      const e = entries().find((x) => x.kind === "region" && x.region === r)!;
      expect(e.indexable).toBe(regionIndexable(r));
    }
    expect(resolve("statele-unite", "wyoming")!.indexable).toBe(false);
    expect(resolve("statele-unite", "ohio")!.indexable).toBe(true);
  });

  it("textele nu se repetă de la o țară la alta", () => {
    const seen = new Set<string>();
    for (const c of COUNTRIES) for (const ps of Object.values(c.history)) for (const p of ps ?? []) {
      expect(seen.has(p), p.slice(0, 60)).toBe(false);
      seen.add(p);
    }
  });

  it("fără limbaj religios de îndemn și fără uneltele cu care e făcut site-ul", () => {
    const all = JSON.stringify([COUNTRIES, REGIONS, THEMES, Object.values(UI).map((u) => [u.docsSteps({ where: "x", eu: true, icr: "y" }), u.communityText({ where: "x", eu: false, icr: null }), u.genealogySteps, u.hubLead])]);
    for (const bad of [/citește biblia/i, /read the bible/i, /next\.js/i, /vercel/i, /\bneon\b/i, /claude/i, /anthropic/i, /supabase/i]) expect(all).not.toMatch(bad);
  });
});

describe("diaspora: adrese și limbi", () => {
  it("toate adresele sunt în secțiunea publică", () => {
    for (const e of entries()) {
      expect(sectionOf(e.path), e.path).toBe("diaspora");
      expect(isPublicPath(e.path)).toBe(true);
      expect(resolve(...(e.path.split("/").slice(2) as [string, string]))).toBe(e);
    }
    expect(resolve("nu-exista")).toBeNull();
    expect(resolve("statele-unite", "nu-exista")).toBeNull();
    expect(resolve("italia", "ohio")).toBeNull();
  });

  it("alege limba omului dacă pagina e scrisă în ea, altfel engleza", () => {
    const it_ = resolve("italia")!;
    expect(pickLang(it_.langs, "it")).toEqual({ lang: "it", native: true });
    expect(pickLang(it_.langs, "nl")).toEqual({ lang: "en", native: false });
    expect(pickLang(it_.langs, "en-US")).toEqual({ lang: "en", native: true });
  });

  it("hreflang: doar limbile paginii, ambele engleze și româna ca x-default", () => {
    const a = alternatesFor("/diaspora/italia", ["it", "ro", "en"]);
    expect(a).toEqual({ it: "/it/diaspora/italia", ro: "/diaspora/italia", "en-GB": "/en/diaspora/italia", "en-US": "/en-us/diaspora/italia", "x-default": "/diaspora/italia",
      // Etichetele regionale (America de Nord, Irlanda, Moldova) trimit la paginile existente, fără adrese noi.
      "en-CA": "/en-us/diaspora/italia", "ro-US": "/diaspora/italia", "ro-CA": "/diaspora/italia", "en-IE": "/en/diaspora/italia", "ro-MD": "/diaspora/italia" });
    expect(alternatesFor("/diaspora/austria", ["de", "ro", "en"])["de-AT"]).toBe("/de/diaspora/austria");
    expect(alternatesFor("/diaspora/radacini-evreiesti", ["en", "he", "ro"]).he).toBe("/he/diaspora/radacini-evreiesti");
  });

  it("o pagină deschisă într-o limbă în care nu e scrisă trimite la engleză și nu intră în Google", () => {
    const m = diasporaAlternates(resolve("italia")!, "hu");
    expect(m.lang).toBe("en");
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toMatch(/\/en\/diaspora\/italia$/);
    const ok = diasporaAlternates(resolve("italia")!, "it");
    expect(ok.robots).toBeUndefined();
    expect(ok.alternates?.canonical).toMatch(/\/it\/diaspora\/italia$/);
    expect(diasporaAlternates(resolve("statele-unite", "wyoming")!, "en-US").robots).toEqual({ index: false, follow: true });
  });

  it("sitemap: câte un fișier pe limbă, doar paginile indexabile", () => {
    const groups = sitemapGroups().filter((g) => g.name.startsWith("diaspora-"));
    expect(groups.map((g) => g.name)).toEqual(expect.arrayContaining(["diaspora-ro", "diaspora-en", "diaspora-it", "diaspora-es", "diaspora-de", "diaspora-fr", "diaspora-he", "diaspora-hu"]));
    const all = groups.flatMap((g) => g.urls.map((u) => u.path));
    expect(all).toContain("/he/diaspora/israel");
    expect(all).toContain("/de/diaspora/sasi-si-svabi");
    expect(all).not.toContain("/diaspora/statele-unite/wyoming");
    expect(all).not.toContain("/he/diaspora/italia");
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("diaspora: pasul 1 (17.11.2026) – cele 7 țări mari", async () => {
  const { EXTRA, ownWords } = await import("@/lib/diaspora/extins");
  const { XUI } = await import("@/lib/diaspora/ui");
  const { indexXml, diasporaSitemapUrls } = await import("@/lib/continut/sitemap");
  const { fitTitle } = await import("@/lib/page-metadata");
  const { titleOf, descriptionOf } = await import("@/lib/diaspora");
  const BIG = ["italia", "spania", "germania", "marea-britanie", "statele-unite", "canada", "israel"];

  it("fiecare are cel puțin 600 de cuvinte proprii în română, ambasada și 5 întrebări", () => {
    for (const slug of BIG) {
      const c = COUNTRIES.find((x) => x.slug === slug)!, ex = EXTRA[slug];
      expect(ex, slug).toBeTruthy();
      const words = ownWords([...(c.history.ro ?? []), ...(ex.guide.ro ?? []), ...(ex.specifics.ro ?? []), ...(ex.faq.ro ?? []).flatMap((f) => [f.q, f.a])]);
      expect(words, `${slug}: ${words} cuvinte`).toBeGreaterThanOrEqual(600);
      expect(ex.faq.ro?.length, slug).toBeGreaterThanOrEqual(5);
      expect(ex.missions.some((m) => m.kind === "embassy"), slug).toBe(true);
    }
  });

  it("engleza are text propriu acolo unde e limba țării", () => {
    for (const slug of ["marea-britanie", "statele-unite", "canada"]) {
      const ex = EXTRA[slug];
      expect(ex.guide.en?.length && ex.specifics.en?.length && ex.faq.en?.length, slug).toBeTruthy();
    }
  });

  it("legăturile oficiale sunt https, iar paginile misiunilor sunt pe mae.ro", () => {
    for (const ex of Object.values(EXTRA)) {
      for (const m of ex.missions) if (m.url) expect(m.url).toMatch(/^https:\/\/[a-z]+\.mae\.ro(\/|$)/);
      for (const l of [ex.missionsSource, ex.stats].filter(Boolean)) expect(l!.url).toMatch(/^https:\/\//);
    }
  });

  it("textele noi nu se repetă și nu vorbesc despre unelte", () => {
    const seen = new Set<string>();
    for (const ex of Object.values(EXTRA)) for (const ps of [...Object.values(ex.guide), ...Object.values(ex.specifics)]) for (const p of ps ?? []) {
      expect(seen.has(p), p.slice(0, 60)).toBe(false);
      seen.add(p);
    }
    const all = JSON.stringify([EXTRA, XUI.ro, XUI.en]);
    for (const bad of [/\bAI\b/, /inteligen[țt]ă artificială/i, /next\.js/i, /vercel/i, /claude/i, /anthropic/i, /citește biblia/i]) expect(all).not.toMatch(bad);
  });

  it("titlurile țărilor încap în 60 de caractere, iar descrierile au 100–160", () => {
    for (const slug of BIG) {
      const e = resolve(slug)!;
      for (const l of e.langs.filter((x) => x === "ro" || x === "en")) {
        expect(fitTitle(titleOf(e, l)).length, `${slug} ${l}`).toBeLessThanOrEqual(60);
        const d = descriptionOf(e, l).length;
        expect(d, `${slug} ${l} descriere`).toBeGreaterThanOrEqual(100);
        expect(d, `${slug} ${l} descriere`).toBeLessThanOrEqual(160);
      }
    }
  });

  it("sitemap-ul de diaspora e un singur fișier în index, fără dubluri", () => {
    const groups = sitemapGroups();
    const idx = indexXml(groups);
    expect(idx).toContain("/sitemap-diaspora.xml");
    expect(idx).not.toContain("/sitemaps/diaspora-");
    const urls = diasporaSitemapUrls(groups).map((u) => u.path);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("/diaspora/italia");
    expect(urls).toContain("/he/diaspora/israel");
  });

  it("butonul de cont nou poartă eticheta ?src a paginii", async () => {
    const { diasporaSrc } = await import("@/components/diaspora/DiasporaPages");
    expect(diasporaSrc(resolve("italia")!)).toBe("diaspora-italia");
    expect(diasporaSrc(resolve("statele-unite", "chicago")!)).toBe("diaspora-chicago");
    expect(diasporaSrc(resolve()!)).toBe("diaspora");
  });
});

describe("diaspora: pasul 2 (17.11.2026) – orașele", async () => {
  const { ownWords, EXTRA } = await import("@/lib/diaspora/extins");
  const { CITY_MIN_WORDS } = await import("@/lib/diaspora/america");
  const { fitTitle } = await import("@/lib/page-metadata");
  const { titleOf, descriptionOf } = await import("@/lib/diaspora");
  const cities = REGIONS.filter((r) => r.kind === "city");

  it("are cel puțin 30 de orașe, cele cerute de Daniel printre ele", () => {
    expect(cities.length).toBeGreaterThanOrEqual(30);
    for (const [a, b] of [["italia", "roma"], ["spania", "madrid"], ["spania", "castellon"], ["germania", "munchen"], ["marea-britanie", "londra"],
      ["statele-unite", "chicago"], ["statele-unite", "new-york-city"], ["statele-unite", "los-angeles"], ["statele-unite", "sacramento"],
      ["canada", "toronto"], ["canada", "montreal"], ["israel", "tel-aviv"], ["israel", "haifa"]]) expect(resolve(a, b), `${a}/${b}`).toBeTruthy();
  });

  it("fiecare oraș are peste 300 de cuvinte proprii în română și intră în Google", () => {
    for (const r of cities) {
      const w = ownWords(r.notes.ro ?? []);
      expect(w, `${r.slug}: ${w}`).toBeGreaterThanOrEqual(CITY_MIN_WORDS);
      expect(resolve(...(regionPathOf(r)))!.indexable, r.slug).toBe(true);
    }
  });

  it("consulatele arătate pe oraș există în lista verificată a țării", () => {
    for (const r of cities) for (const m of r.mission ?? []) {
      const slug = COUNTRY_OF[r.country];
      expect(EXTRA[slug].missions.some((x) => x.city === m), `${r.slug} → ${m}`).toBe(true);
    }
  });

  it("titluri sub 60 de caractere, descrieri 100–160, fără paragrafe lungi repetate", () => {
    const seen = new Set<string>();
    for (const r of cities) {
      const e = resolve(...regionPathOf(r))!;
      expect(fitTitle(titleOf(e, "ro")).length, r.slug).toBeLessThanOrEqual(60);
      const d = descriptionOf(e, "ro").length;
      expect(d, r.slug).toBeGreaterThanOrEqual(100);
      expect(d, r.slug).toBeLessThanOrEqual(160);
      for (const p of r.notes.ro ?? []) if (p.split(/\s+/).length >= 25) { expect(seen.has(p), p.slice(0, 60)).toBe(false); seen.add(p); }
    }
  });
});

function regionPathOf(r: { country: string; slug: string }): [string, string] {
  const c = COUNTRY_OF[r.country as keyof typeof COUNTRY_OF];
  return [c, r.slug];
}

describe("diaspora: pasul 4 (17.11.2026) – toate țările", async () => {
  const { EXTRA, ownWords } = await import("@/lib/diaspora/extins");
  const { fitTitle } = await import("@/lib/page-metadata");
  const { titleOf, descriptionOf } = await import("@/lib/diaspora");

  it("fiecare țară are ghid propriu, ≥600 de cuvinte în română, ambasada și 5 întrebări", () => {
    for (const c of COUNTRIES) {
      const ex = EXTRA[c.slug];
      expect(ex, c.slug).toBeTruthy();
      const words = ownWords([...(c.history.ro ?? []), ...(ex.guide.ro ?? []), ...(ex.specifics.ro ?? []), ...(ex.faq.ro ?? []).flatMap((f) => [f.q, f.a])]);
      expect(words, `${c.slug}: ${words} cuvinte`).toBeGreaterThanOrEqual(600);
      expect(ex.faq.ro?.length, c.slug).toBeGreaterThanOrEqual(5);
      expect(ex.missions.some((m) => m.kind === "embassy"), c.slug).toBe(true);
    }
  });

  it("titlurile încap în 60 de caractere și descrierile au 100–160, în română", () => {
    for (const c of COUNTRIES) {
      const e = resolve(c.slug)!;
      expect(fitTitle(titleOf(e, "ro")).length, c.slug).toBeLessThanOrEqual(60);
      const d = descriptionOf(e, "ro").length;
      expect(d, c.slug).toBeGreaterThanOrEqual(100);
      expect(d, c.slug).toBeLessThanOrEqual(160);
    }
  });
});

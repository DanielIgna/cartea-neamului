import { describe, expect, it } from "vitest";
import { COUNTRIES, REGIONS, THEMES, alternatesFor, diasporaAlternates, entries, pickLang, resolve } from "@/lib/diaspora";
import { regionIndexable } from "@/lib/diaspora/america";
import { UI } from "@/lib/diaspora/ui";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { sectionOf } from "@/lib/public-sections";
import { isPublicPath } from "@/lib/public-variant";

describe("diaspora: conținut", () => {
  it("are țările cerute de Daniel, plus SUA și Canada", () => {
    const codes = COUNTRIES.map((c) => c.code).sort();
    expect(codes).toEqual(["AT", "BE", "CA", "CH", "CY", "DE", "DK", "ES", "FR", "GB", "GR", "IE", "IL", "IT", "NL", "PT", "SE", "US"].sort());
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
    expect(THEMES.map((t) => t.slug)).toEqual(["radacini-evreiesti", "moldoveni-in-italia-si-israel", "sasi-si-svabi", "maghiari-din-transilvania"]);
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
    expect(a).toEqual({ it: "/it/diaspora/italia", ro: "/diaspora/italia", "en-GB": "/en/diaspora/italia", "en-US": "/en-us/diaspora/italia", "x-default": "/diaspora/italia" });
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

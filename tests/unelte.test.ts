import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { kinship, type Step } from "@/lib/unelte/rudenie";
import { KIN_PAGES, kinPagePath, kinWords } from "@/lib/unelte/rudenie-pagini";
import { TOOLS, generationYears, toolPath } from "@/lib/unelte/unelte";
import { grandparentQuestions } from "@/lib/unelte/intrebari";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { clusterOf } from "@/lib/seo-clustere";
import { auditPages } from "@/lib/seo-audit";
import { getEntry } from "@/lib/continut/colectii";

const k = (...p: Step[]) => { const r = kinship(p); if ("error" in r) throw new Error(r.error); return r; };

describe("calculatorul de rudenie (Codul civil, art. 406–407)", () => {
  it("rudele de sânge: nume și grad", () => {
    expect([k("tata").name, k("tata").degree]).toEqual(["tată", 1]);
    expect([k("tata", "tata").name, k("tata", "tata").degree]).toEqual(["bunic", 2]);
    expect([k("frate").name, k("frate").degree, k("frate").line]).toEqual(["frate", 2, "colaterală"]);
    expect([k("mama", "sora").name, k("mama", "sora").degree]).toEqual(["mătușă", 3]);
    expect([k("tata", "frate", "fiu").name, k("tata", "frate", "fiu").degree]).toEqual(["văr primar", 4]);
    expect(k("tata", "frate", "fiu", "fiu").degree).toBe(5);
    expect([k("tata", "tata", "frate", "fiu", "fiu").name, k("tata", "tata", "frate", "fiu", "fiu").degree]).toEqual(["văr de-al doilea", 6]);
    expect(k("fiu", "fiica").name).toBe("nepoată (de bunic)");
  });
  it("fratele vărului e tot văr, de același grad", () => {
    expect(k("tata", "frate", "fiu", "frate").degree).toBe(4);
  });
  it("afinii: socri, cumnați, ginere, noră; cuscrii nu au grad", () => {
    expect([k("sotie", "mama").name, k("sotie", "mama").degree, k("sotie", "mama").affine]).toEqual(["soacră", 1, true]);
    expect(k("sot", "frate").name).toMatch(/^cumnat/);
    expect(k("frate", "sotie").name).toMatch(/^cumnată/);
    expect(k("fiica", "sot").name).toBe("ginere");
    expect(k("fiu", "sotie").name).toBe("noră");
    const c = k("fiu", "sotie", "tata");
    expect([c.name, c.degree]).toEqual(["cuscru", null]);
    expect(k("sot").degree).toBeNull();
  });
  it("drumurile care se întorc sau au soțul la mijloc dau o explicație, nu un rezultat greșit", () => {
    expect("error" in kinship(["fiu", "tata"])).toBe(true);
    expect("error" in kinship(["tata", "sotie", "frate"])).toBe(true);
    expect("error" in kinship([])).toBe(true);
  });
});

describe("paginile despre rude", () => {
  it("drumul din fiecare pagină duce, în calculator, la aceeași relație", () => {
    for (const p of KIN_PAGES) {
      const r = kinship(p.path);
      expect("error" in r, p.slug).toBe(false);
      if (!("error" in r)) expect(r.page, p.slug).toBe(p.slug);
    }
  });
  it("au text propriu, titlu de cel mult 60 de semne și descriere de 120–155", () => {
    for (const p of KIN_PAGES) {
      expect(kinWords(p), p.slug).toBeGreaterThanOrEqual(250);
      expect(`${p.title} | Cartea Neamului`.length <= 60 || p.title.length <= 60, p.slug).toBe(true);
      expect(p.description.length, p.slug).toBeGreaterThanOrEqual(120);
      expect(p.description.length, p.slug).toBeLessThanOrEqual(155);
      for (const r of p.related) expect(KIN_PAGES.some((x) => x.slug === r), r).toBe(true);
    }
  });
});

describe("uneltele", () => {
  it("calculatorul de generații dă intervale crescătoare, în urmă", () => {
    const g = generationYears(1990);
    expect(g[0].likely).toBe(1962);
    for (let i = 1; i < g.length; i++) {
      expect(g[i].likely).toBeLessThan(g[i - 1].likely);
      expect(g[i].to - g[i].from).toBeGreaterThanOrEqual(g[i - 1].to - g[i - 1].from);
    }
  });
  it("întrebările pentru bunici vin din ghid (40, pe teme)", () => {
    const q = grandparentQuestions();
    expect(q.flatMap((t) => t.questions)).toHaveLength(40);
    expect(q[0].theme).toBe("Familia");
  });
  it("descrierile au 120–155 de semne, iar ghidurile legate există", () => {
    for (const t of TOOLS) {
      expect(t.description.length, t.slug).toBeGreaterThanOrEqual(120);
      expect(t.description.length, t.slug).toBeLessThanOrEqual(155);
    }
    const src = readFileSync("src/components/unelte/ToolPages.tsx", "utf8");
    for (const m of src.matchAll(/"([a-z0-9-]+)"/g)) if (/^(cum|grade|nasii|ce-este|intrebari|registrele|recensamintele)/.test(m[1]) && !TOOLS.some((t) => t.slug === m[1])) expect(getEntry("ghid", m[1]), m[1]).toBeTruthy();
  });
  it("sunt în sitemap, în grupa „Unelte gratuite” și în inventarul SEO", () => {
    const all = sitemapGroups().flatMap((g) => g.urls.map((u) => u.path));
    const paths = ["/unelte", ...TOOLS.map(toolPath), ...KIN_PAGES.map(kinPagePath)];
    for (const p of paths) {
      expect(all, p).toContain(p);
      expect(clusterOf(p).key).toBe("unelte");
    }
    const audit = new Set(auditPages().map((p) => p.path));
    for (const p of paths) expect(audit.has(p), p).toBe(true);
  });
  it("nu trimit nimic la server: componentele uneltelor nu fac cereri", () => {
    for (const f of ["KinCalc", "GenCalc", "PrintableTree"]) expect(readFileSync(`src/components/unelte/${f}.tsx`, "utf8"), f).not.toMatch(/fetch\(|axios|sendBeacon/);
  });
});

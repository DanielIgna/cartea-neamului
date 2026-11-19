import { describe, it, expect } from "vitest";
import { ZONES, suggestFor } from "@/lib/zona/registru";

describe("sugestii după zonă (SUA și Canada)", () => {
  it("toate cele 50 de state și 13 provincii au intrare, cu pagina lor de diaspora", () => {
    expect(ZONES.filter((z) => z.country === "US" && z.region)).toHaveLength(50);
    expect(ZONES.filter((z) => z.country === "CA" && z.region)).toHaveLength(13);
    expect(ZONES.find((z) => z.country === "US" && z.region === "OH")?.page).toBe("/diaspora/statele-unite/ohio");
  });
  it("Ohio în engleză: statul, toată țara și ghiduri publicate, cu adrese /en-us", () => {
    const s = suggestFor("US", "OH", "en-US")!;
    expect(s.lang).toBe("en");
    expect(s.region).toEqual({ href: "/en-us/diaspora/statele-unite/ohio", label: "Ohio" });
    expect(s.country.href).toBe("/en-us/diaspora/statele-unite");
    expect(s.guides.length).toBeGreaterThan(0);
    expect(s.guides.length).toBeLessThanOrEqual(4);
    for (const g of s.guides) expect(g.href).toMatch(/^\/ghid\//);
  });
  it("în română, fără regiune cunoscută: doar țara; din România sau fără țară: nimic", () => {
    const s = suggestFor("CA", "", "ro")!;
    expect(s.region).toBeNull();
    expect(s.country).toEqual({ href: "/diaspora/canada", label: "Canada" });
    expect(suggestFor("RO", "CJ", "ro")).toBeNull();
    expect(suggestFor(null, null, "ro")).toBeNull();
  });
  it("ghidurile pentru America de Nord publicate apar ca sugestii", () => {
    const s = suggestFor("US", "IL", "ro")!;
    expect(s.guides.length).toBe(4);
  });
});

import { ISTORIE_LOCALA, ISTORIE_LOCALA_APROBATA } from "@/lib/diaspora/istorie-locala";
import { REGIONS, regionIndexable } from "@/lib/diaspora/america";

describe("istoria locală pe state și provincii", () => {
  it("aprobată (19.11.2026): statele cu istorie verificată au text și intră în Google", () => {
    expect(ISTORIE_LOCALA_APROBATA).toBe(true);
    const nd = REGIONS.find((r) => r.country === "us" && r.slug === "north-dakota" && r.kind === "state")!;
    expect(nd.notes.en?.join(" ")).toMatch(/Dickinson/);
    expect(regionIndexable(REGIONS.find((r) => r.country === "us" && r.slug === "arizona")!)).toBe(true);
    // Statele fără istorie documentată rămân în afara Google (Daniel, 19.11.2026).
    expect(regionIndexable(REGIONS.find((r) => r.country === "us" && r.slug === "wyoming")!)).toBe(false);
  });
  it("fiecare stat are română, engleză și surse, iar slug-ul există", () => {
    for (const [slug, h] of Object.entries(ISTORIE_LOCALA)) {
      expect(REGIONS.some((r) => (r.country === "us" || r.country === "ca") && r.slug === slug), slug).toBe(true);
      expect(h.ro.length, slug).toBe(h.en.length);
      expect(h.sources.length, slug).toBeGreaterThan(0);
    }
  });
});

describe("zonele din Europa", () => {
  it("țările publicate au intrare; regiunile în ciornă nu apar până la aprobare", async () => {
    const { EUROPE_ZONES } = await import("@/lib/zona/europa");
    const { suggestFor } = await import("@/lib/zona/registru");
    expect(EUROPE_ZONES.some((z) => z.country === "IT" && !z.region && z.page === "/diaspora/italia")).toBe(true);
    // Ucraina și regiunile europene sunt încă ciorne: fără pagină publică, fără sugestie.
    expect(EUROPE_ZONES.some((z) => z.country === "UA")).toBe(false);
    expect(EUROPE_ZONES.some((z) => z.region)).toBe(false);
    const it = suggestFor("IT", "62", "it");
    expect(it?.country.href).toBe("/it/diaspora/italia");
    expect(it?.region).toBeNull();
    expect(suggestFor("DE", "BY", "en-GB")?.country.href).toBe("/en/diaspora/germania");
  });
});

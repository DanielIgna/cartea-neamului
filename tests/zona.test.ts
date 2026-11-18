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
  it("ciornele nu apar ca sugestii până nu sunt publicate", () => {
    const s = suggestFor("US", "IL", "ro")!;
    expect(s.guides.map((g) => g.href)).not.toContain("/ghid/romanian-immigration-waves-us-canada");
  });
});

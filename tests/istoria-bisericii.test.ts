import { describe, expect, it } from "vitest";
import { BIBLE_STEPS, CHURCH_ERAS, HEROES, churchEraOf } from "@/lib/istoria-bisericii";

describe("istoria Bisericii", () => {
  it("are epocile în ordine, fără goluri", () => {
    for (let i = 1; i < CHURCH_ERAS.length; i++) expect(CHURCH_ERAS[i].from).toBeLessThanOrEqual(CHURCH_ERAS[i - 1].to + 1);
    expect(new Set(CHURCH_ERAS.map((e) => e.id)).size).toBe(CHURCH_ERAS.length);
  });
  it("fiecare epocă și fiecare erou are verset cu trimitere", () => {
    for (const v of [...CHURCH_ERAS.map((e) => e.verse), ...HEROES.map((h) => h.verse)]) {
      expect(v.text.length).toBeGreaterThan(10);
      expect(v.ref).toMatch(/\d+:\d+/);
    }
  });
  it("are eroii ceruți și pașii Bibliei românești", () => {
    expect(HEROES.map((h) => h.id)).toEqual(expect.arrayContaining(["wurmbrand", "moldoveanu", "dorz"]));
    expect(BIBLE_STEPS.some((b) => b.year === "1688")).toBe(true);
  });
  it("găsește epoca unui an", () => {
    expect(churchEraOf(1521)?.id).toBe("reforma");
    expect(churchEraOf(1950)?.id).toBe("secolul-xx");
  });
});

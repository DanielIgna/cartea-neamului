import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { UNIRE_BANNER, UNIRE_SERIES, inUnireSeason } from "@/lib/sezon-unire";
import { getEntry } from "@/lib/continut/colectii";

describe("Marea Unire pe prima pagină", () => {
  it("bannerul apare de la 26 noiembrie până la 3 decembrie (ora României), apoi dispare singur", () => {
    expect(inUnireSeason(new Date("2026-11-25T21:30:00Z"))).toBe(false); // 25.11, 23:30 la București
    expect(inUnireSeason(new Date("2026-11-25T22:30:00Z"))).toBe(true); // 26.11, 00:30
    expect(inUnireSeason(new Date("2026-12-01T10:00:00Z"))).toBe(true);
    expect(inUnireSeason(new Date("2026-12-03T21:30:00Z"))).toBe(true); // 3.12, 23:30
    expect(inUnireSeason(new Date("2026-12-03T22:30:00Z"))).toBe(false); // 4.12, 00:30
    expect(inUnireSeason(new Date("2027-07-01T10:00:00Z"))).toBe(false);
  });
  it("desenele există și seria are șase ghiduri publicate", () => {
    for (const src of UNIRE_BANNER) expect(existsSync(path.join("public", src)), src).toBe(true);
    expect(UNIRE_SERIES).toHaveLength(6);
    for (const s of UNIRE_SERIES) {
      const e = getEntry("ghid", s);
      expect(e, s).toBeTruthy();
      expect(e!.seoTitle.length, e!.seoTitle).toBeLessThanOrEqual(60);
      expect(e!.description.length, s).toBeGreaterThanOrEqual(120);
      expect(e!.description.length, s).toBeLessThanOrEqual(155);
    }
  });
});

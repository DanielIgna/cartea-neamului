import { describe, expect, it } from "vitest";
import { currentDay, planDays, planItems } from "@/lib/seo/plan-indexare";
import { allPaths, resolve } from "@/lib/diaspora";
import { splitLocalePath } from "@/i18n/locales";

describe("planul de indexare SUA și Canada", () => {
  const items = planItems();
  it("începe cu ghidurile noi și nu are adrese dublate", () => {
    expect(items[0].path).toBe("/ghid/trace-romanian-ancestors-from-us-canada");
    expect(items.slice(0, 6).every((x) => x.kind === "ghid")).toBe(true);
    expect(new Set(items.map((x) => x.path)).size).toBe(items.length);
  });
  it("are doar pagini de diaspora care există și intră în Google", () => {
    for (const x of items.filter((i) => i.kind !== "ghid")) {
      const { path } = splitLocalePath(x.path);
      expect(allPaths()).toContain(path);
      const [, , a, b] = path.split("/");
      expect(resolve(a, b)?.indexable, x.path).toBe(true);
    }
    expect(items.some((x) => x.path.endsWith("/wyoming"))).toBe(false);
    // Ciornele noi (Colorado, Virginia, …) nu intră în Google până nu le aprobă Daniel.
    expect(items.some((x) => x.path.endsWith("/colorado"))).toBe(false);
  });
  it("pune Ohio în engleză înaintea paginilor în română și împarte câte 10 pe zi", () => {
    const i = (p: string) => items.findIndex((x) => x.path === p);
    expect(i("/en-us/diaspora/statele-unite/ohio")).toBeLessThan(i("/diaspora/statele-unite/ohio"));
    const days = planDays(items);
    expect(days.every((d) => d.items.length <= 10)).toBe(true);
    expect(currentDay(days, {})).toBe(1);
    expect(currentDay(days, Object.fromEntries(days[0].items.map((x) => [x.path, "2026-11-19"])))).toBe(2);
  });
});

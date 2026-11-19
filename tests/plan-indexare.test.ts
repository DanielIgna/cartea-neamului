import { describe, expect, it } from "vitest";
import { currentDay, planDays, planItems, planItemsEurope } from "@/lib/seo/plan-indexare";
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
    // Al doilea lot, aprobat la 19.11.2026, intră în plan.
    expect(items.some((x) => x.path === "/en-us/diaspora/statele-unite/colorado")).toBe(true);
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

describe("planul de indexare pentru Europa", () => {
  const items = planItemsEurope();
  it("începe cu Marea Britanie, apoi Spania, și are fiecare țară în limba ei și în română", () => {
    expect(items[0].path).toBe("/en/diaspora/marea-britanie");
    expect(items[1].path).toBe("/diaspora/marea-britanie");
    expect(items[2].path).toBe("/es/diaspora/spania");
    expect(items.some((x) => x.path === "/de/diaspora/germania")).toBe(true);
  });
  it("nu are adrese de două ori și nici pagini din America", () => {
    expect(new Set(items.map((x) => x.path)).size).toBe(items.length);
    expect(items.some((x) => x.path.includes("statele-unite") || x.path.includes("canada"))).toBe(false);
  });
  it("orașele în limba țării vin înaintea orașelor în română", () => {
    const firstRoCity = items.findIndex((x) => x.kind === "oras" && !/^\/[a-z]{2}\//.test(x.path));
    const lastLocal = items.map((x, i) => (x.kind !== "pagina" && x.kind !== "ghid" && /^\/[a-z]{2}\//.test(x.path) ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    expect(lastLocal).toBeLessThan(firstRoCity);
  });
});

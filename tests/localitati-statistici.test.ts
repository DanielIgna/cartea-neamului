import { describe, expect, it } from "vitest";
import { publicAreaStat } from "@/lib/continut/localitati-statistici";

describe("familii cu rădăcini într-o comună (doar totaluri, cu prag)", () => {
  const raw = (trees: number, names: [string, number][]) => ({ trees, surnames: new Map(names.map(([n, t]) => [n.toLowerCase(), { name: n, trees: t }])) });
  it("sub 5 arbori nu arată nimic", () => {
    expect(publicAreaStat(raw(4, [["Pop", 4]]))).toBeNull();
    expect(publicAreaStat(null)).toBeNull();
  });
  it("arată doar numele din cel puțin 5 arbori", () => {
    const s = publicAreaStat(raw(9, [["Pop", 6], ["Igna", 4], ["Todea", 5]]))!;
    expect(s.trees).toBe(9);
    expect(s.surnames.map((x) => x.name)).toEqual(["Pop", "Todea"]);
  });
});

import { describe, expect, it } from "vitest";
import { civilByRegion } from "@/lib/continut/regiuni";

describe("starea civilă pe regiuni", () => {
  it("o singură istorie: textul simplu", () => {
    expect(civilByRegion(["transilvania", "banat"])).toHaveLength(1);
  });
  it("Bucovina și Moldova (județul Suceava): fiecare text spune pentru ce parte e", () => {
    const t = civilByRegion(["bucovina", "moldova"]);
    expect(t[0].startsWith("Pentru locurile din Bucovina: Bucovina")).toBe(true);
    expect(t[1].startsWith("Pentru locurile din Moldova: aici există")).toBe(true);
  });
});

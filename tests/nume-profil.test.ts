import { describe, expect, it } from "vitest";
import { loadNames, getName } from "@/lib/continut/nume";
import { nameProfile } from "@/lib/continut/nume-profil";
import { NAME_MIN_WORDS, nameGate, nameOwnWords, uatGate } from "@/lib/continut/prag";

describe("„Ce spun datele” pe paginile de nume (Etapa 3)", () => {
  it("pragul (etapa 4 SEO): intră în Google exact numele cu destule cuvinte proprii", () => {
    for (const n of loadNames()) expect(!!nameGate(n), n.slug).toBe(nameOwnWords(n) < NAME_MIN_WORDS);
    expect(loadNames().filter((n) => !nameGate(n)).length).toBeGreaterThan(0);
  });
  it("frazele sunt corecte gramatical la singular și spun ortografia variantelor", () => {
    const all = loadNames().flatMap(nameProfile).join(" ");
    expect(all).not.toMatch(/altor 1 /);
    const chis = nameProfile(getName("chis")!).join(" ");
    expect(chis).toContain("Chis e scrierea fără diacritice");
    expect(nameProfile(getName("popescu")!)[0]).toContain("-escu");
  });
});

describe("comunele mici intră în coadă", () => {
  const small = { kind: "c", pop: 900, villages: [{}] };
  it("rămân noindex până le publică motorul, apoi intră", () => {
    expect(uatGate(small, () => false)).toMatch(/un singur sat/);
    expect(uatGate(small, () => true)).toBeNull();
  });
});

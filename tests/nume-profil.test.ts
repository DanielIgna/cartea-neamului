import { describe, expect, it } from "vitest";
import { loadNames, getName } from "@/lib/continut/nume";
import { nameProfile } from "@/lib/continut/nume-profil";
import { nameGate, nameOwnWords, uatGate } from "@/lib/continut/prag";

describe("„Ce spun datele” pe paginile de nume (Etapa 3)", () => {
  it("fiecare nume are cel puțin 120 de cuvinte proprii, iar niciunul nu mai e subțire", () => {
    for (const n of loadNames()) expect(nameOwnWords(n), n.slug).toBeGreaterThanOrEqual(120);
    expect(loadNames().filter((n) => nameGate(n))).toEqual([]);
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

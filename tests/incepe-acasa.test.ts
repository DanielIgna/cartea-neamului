import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { isDatacenter, looksAutomated } from "@/lib/vizite";
import { FUNCTIONS } from "@/lib/cunostinte/functii";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

describe("roboții din centrele de date nu se numără (19.11.2026)", () => {
  it("Boardman și Ashburn din SUA sunt centre de date, nu oameni", () => {
    expect(isDatacenter("US", "Boardman")).toBe(true);
    expect(isDatacenter("US", "Ashburn")).toBe(true);
    expect(isDatacenter("US", "Council%20Bluffs")).toBe(true);
    expect(isDatacenter("US", "Chicago")).toBe(false);
    expect(isDatacenter("RO", "Ashburn")).toBe(false);
    expect(isDatacenter("US", null)).toBe(false);
  });
  it("un browser adevărat trimite limba; fără ea e program", () => {
    expect(looksAutomated({ ua: UA, lang: "ro-RO,ro;q=0.9", country: "RO", city: "Cluj-Napoca" })).toBe(false);
    expect(looksAutomated({ ua: UA, lang: null, country: "RO", city: "Cluj-Napoca" })).toBe(true);
    expect(looksAutomated({ ua: UA, lang: "en-US", country: "US", city: "Boardman" })).toBe(true);
    expect(looksAutomated({ ua: "Googlebot", lang: "en" })).toBe(true);
    // Fără informația despre limbă (apeluri din cod, teste), nu se judecă după ea.
    expect(looksAutomated({ ua: UA })).toBe(false);
  });
});

describe("„Începe chiar acum” pe prima pagină", () => {
  it("bannerul are formularul, iar textele există în toate limbile", () => {
    const landing = readFileSync("src/components/Landing.tsx", "utf8");
    expect(landing).toContain("<TryTree />");
    for (const l of ["ro", "en-GB", "fr", "es", "nl", "de", "it", "hu", "he"]) {
      const f = readFileSync(`src/i18n/messages/activare/${l}.ts`, "utf8");
      for (const k of ["q1", "go1", "q2", "go2", "fbHello", "proof", "saved", "quickKept"]) expect(f, `${l}.${k}`).toMatch(new RegExp(`\\b${k}: `));
    }
  });
  it("ce scrie omul rămâne doar în browser până la cont și completează primii pași", () => {
    expect(readFileSync("src/components/QuickStart.tsx", "utf8")).toContain("readDraft()");
    expect(readFileSync("src/components/TryTree.tsx", "utf8")).not.toMatch(/fetch\(|sendBeacon/);
  });
  it("e trecut în Centrul de cunoștințe", () => {
    expect(FUNCTIONS.some((f) => f.key === "incepe-acasa")).toBe(true);
  });
});

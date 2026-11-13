import { describe, expect, it } from "vitest";
import { AUTOMATIONS, partScore, recommendations, tierOf, totalScore, type Part } from "@/lib/autonomie";

describe("autonomie: scorul", () => {
  it("o parte e procentul punctelor din maxim, fără să iasă din 0–100", () => {
    expect(partScore([{ label: "a", points: 10, max: 20, note: "" }, { label: "b", points: 30, max: 30, note: "" }])).toBe(80);
    expect(partScore([{ label: "a", points: 50, max: 20, note: "" }])).toBe(100);
    expect(partScore([{ label: "a", points: -5, max: 20, note: "" }])).toBe(0);
    expect(partScore([])).toBe(100);
  });
  it("totalul e media ponderată a părților", () => {
    expect(totalScore([{ score: 100, weight: 25 }, { score: 50, weight: 25 }])).toBe(75);
    expect(totalScore([{ score: 80, weight: 3 }, { score: 40, weight: 1 }])).toBe(70);
  });
  it("treptele", () => {
    expect(tierOf(95).key).toBe("autonom");
    expect(tierOf(80).key).toBe("aproape");
    expect(tierOf(60).key).toBe("asistat");
    expect(tierOf(10).key).toBe("manual");
  });
  it("recomandările vin doar din verificări cu puncte lipsă și un pas de făcut, sortate după câștig", () => {
    const parts: Part[] = [
      { key: "tehnic", label: "Tehnic", what: "", weight: 50, target: 90, score: 0, checks: [
        { label: "x", points: 0, max: 50, note: "lipsă", fix: { text: "pune cheia" } },
        { label: "y", points: 50, max: 50, note: "ok", fix: { text: "nu apare" } },
      ] },
      { key: "om", label: "Om", what: "", weight: 50, target: 80, score: 0, checks: [
        { label: "z", points: 15, max: 20, note: "1 așteaptă", fix: { text: "răspunde" } },
        { label: "w", points: 0, max: 20, note: "fără pas" },
      ] },
    ];
    const r = recommendations(parts);
    expect(r.map((x) => x.text)).toEqual(["pune cheia", "răspunde"]);
    expect(r[0].gain).toBe(25);
    expect(r[0].level).toBe("ridicat");
  });
  it("nimic care le scrie oamenilor sau schimbă ce văd ei nu e pornit din prima", () => {
    for (const a of AUTOMATIONS) if (a.risk !== "singur") expect(a.defaultOn).toBe(false);
    expect(AUTOMATIONS.filter((a) => a.risk === "aprobare").map((a) => a.key)).toContain("probleme-vechi");
  });
});

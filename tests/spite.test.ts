import { describe, it, expect } from "vitest";
import { onSide } from "@/components/charts";
import { hourglassUp } from "@/components/lineage-charts";

describe("o singură spiță în Clasic, Evantai și Clepsidră", () => {
  it("știe pe ce spiță e fiecare loc Ahnentafel", () => {
    // tatăl 2, bunicii dinspre tată 4–5, străbunicii 8–11; mama 3, bunicii dinspre mamă 6–7, străbunicii 12–15
    expect([2, 4, 5, 8, 9, 10, 11, 21].every((n) => onSide(n, "father"))).toBe(true);
    expect([3, 6, 7, 12, 13, 14, 15, 29].some((n) => onSide(n, "father"))).toBe(false);
    expect([3, 6, 7, 12, 13, 14, 15, 29].every((n) => onSide(n, "mother"))).toBe(true);
    expect([2, 4, 5, 8, 11].some((n) => onSide(n, "mother"))).toBe(false);
    // persoana din centru e pe amândouă, iar fără spiță aleasă se vede tot
    expect(onSide(1, "father") && onSide(1, "mother")).toBe(true);
    expect([1, 2, 3, 7, 12].every((n) => onSide(n, null))).toBe(true);
  });

  it("în clepsidră, pe o singură spiță urcă o generație în plus", () => {
    expect(hourglassUp(6, null)).toBe(3);
    expect(hourglassUp(6, "mother")).toBe(4);
    expect(hourglassUp(3, "father")).toBe(3);
  });
});

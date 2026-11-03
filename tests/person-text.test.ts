import { describe, it, expect } from "vitest";
import { lifeDates, shortDate, years } from "@/lib/person-text";

const p = (birthText: string | null, deathText: string | null, living = false) => ({ birthText, deathText, living, approx: /cca|ABT/i.test(birthText ?? ""),
  birthYear: Number(birthText?.match(/\d{4}/)?.[0]) || null, deathYear: Number(deathText?.match(/\d{4}/)?.[0]) || null });

describe("datele cu ziua și luna", () => {
  it("scrie data scurt, oricum ar fi fost trecută", () => {
    expect(shortDate("12 martie 1932")).toBe("12.03.1932");
    expect(shortDate("12.3.1932")).toBe("12.03.1932");
    expect(shortDate("12 MAR 1901")).toBe("12.03.1901");
    expect(shortDate("1985-03-12")).toBe("12.03.1985");
    expect(shortDate("martie 1985")).toBe("03.1985");
    expect(shortDate("cca. 1870")).toBe("cca. 1870");
    expect(shortDate("ABT 1870")).toBe("cca. 1870");
    expect(shortDate("înainte de 1900")).toBe("înainte de 1900");
    expect(shortDate("1902")).toBe("1902");
    expect(shortDate("prin anii '30")).toBe("prin anii '30"); // ce nu se înțelege rămâne cum a fost scris
    expect(shortDate(null)).toBe("");
  });

  it("nașterea și moartea împreună; la cei în viață doar nașterea", () => {
    expect(lifeDates(p("12.03.1932", "5 noiembrie 2008"))).toBe("12.03.1932–05.11.2008");
    expect(lifeDates(p("cca. 1870", "1931"))).toBe("cca. 1870–1931");
    expect(lifeDates(p("12.03.1985", null, true))).toBe("12.03.1985");
    expect(lifeDates(p("1932", null))).toBe("1932–?");
    expect(lifeDates(p(null, null))).toBe(years(p(null, null)));
  });
});

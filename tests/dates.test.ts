import { describe, it, expect } from "vitest";
import { exactDay, parseFuzzyDate } from "@/lib/dates";

describe("parseFuzzyDate", () => {
  it("an simplu", () => expect(parseFuzzyDate("1898")).toMatchObject({ from: "1898-01-01", to: "1898-12-31", year: 1898, approx: false }));
  it("dată completă GEDCOM", () => expect(parseFuzzyDate("12 MAR 1901")).toMatchObject({ from: "1901-03-12", to: "1901-03-12" }));
  it("aproximativ, în română și GEDCOM", () => {
    expect(parseFuzzyDate("cca. 1870")).toMatchObject({ from: "1868-01-01", to: "1872-12-31", approx: true });
    expect(parseFuzzyDate("ABT 1870").approx).toBe(true);
  });
  it("înainte de", () => expect(parseFuzzyDate("înainte de 1900")).toMatchObject({ to: "1900-01-01", approx: true }));
  it("gol", () => expect(parseFuzzyDate("")).toMatchObject({ from: null, year: null }));
  it("dată completă scrisă în română", () => {
    for (const s of ["12.03.1985", "12/03/1985", "12-3-1985", "1985-03-12", "12 martie 1985", "12 mar. 1985", "12 MAR 1985"]) {
      expect(parseFuzzyDate(s), s).toMatchObject({ from: "1985-03-12", to: "1985-03-12", year: 1985 });
    }
    expect(parseFuzzyDate("1 mai 1890")).toMatchObject({ from: "1890-05-01", to: "1890-05-01" });
    expect(parseFuzzyDate("31.02.1985")).toMatchObject({ from: "1985-01-01", to: "1985-12-31" }); // nu există
  });
  it("doar luna", () => {
    expect(parseFuzzyDate("martie 1985")).toMatchObject({ from: "1985-03-01", to: "1985-03-31", year: 1985 });
    expect(parseFuzzyDate("02.1984")).toMatchObject({ from: "1984-02-01", to: "1984-02-29" });
    expect(parseFuzzyDate("DEC 1900")).toMatchObject({ from: "1900-12-01", to: "1900-12-31" });
  });
  it("ziua exactă, doar când data e completă", () => {
    expect(exactDay("12 martie 1985")).toBe("1985-03-12");
    expect(exactDay("1985")).toBeNull();
    expect(exactDay("martie 1985")).toBeNull();
    expect(exactDay("cca. 12.03.1985")).toBeNull();
    expect(exactDay(null)).toBeNull();
  });
});

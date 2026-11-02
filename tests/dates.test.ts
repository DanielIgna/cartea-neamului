import { describe, it, expect } from "vitest";
import { parseFuzzyDate } from "@/lib/dates";

describe("parseFuzzyDate", () => {
  it("an simplu", () => expect(parseFuzzyDate("1898")).toMatchObject({ from: "1898-01-01", to: "1898-12-31", year: 1898, approx: false }));
  it("dată completă GEDCOM", () => expect(parseFuzzyDate("12 MAR 1901")).toMatchObject({ from: "1901-03-12", to: "1901-03-12" }));
  it("aproximativ, în română și GEDCOM", () => {
    expect(parseFuzzyDate("cca. 1870")).toMatchObject({ from: "1868-01-01", to: "1872-12-31", approx: true });
    expect(parseFuzzyDate("ABT 1870").approx).toBe(true);
  });
  it("înainte de", () => expect(parseFuzzyDate("înainte de 1900")).toMatchObject({ to: "1900-01-01", approx: true }));
  it("gol", () => expect(parseFuzzyDate("")).toMatchObject({ from: null, year: null }));
});

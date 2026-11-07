import { describe, it, expect } from "vitest";
import { exactDay, normalizeTypedDate, parseFuzzyDate } from "@/lib/dates";

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
  it("datele scrise în limbile site-ului", () => {
    const at = (s: string) => parseFuzzyDate(s).from === "1970-03-12" && parseFuzzyDate(s).to === "1970-03-12";
    for (const s of ["12 March 1970", "March 12, 1970", "Mar 12 1970", "12 mars 1970", "12 de marzo de 1970", "12 maart 1970",
      "12. März 1970", "12 marzo 1970", "1970. március 12.", "1970. 03. 12.", "1970.03.12", "12. 03. 1970", "12 márc. 1970"]) {
      expect(at(s), s).toBe(true);
    }
    expect(parseFuzzyDate("1 août 1890")).toMatchObject({ from: "1890-08-01" });
    expect(parseFuzzyDate("5 Jänner 1901")).toMatchObject({ from: "1901-01-05" });
    expect(parseFuzzyDate("März 1985")).toMatchObject({ from: "1985-03-01", to: "1985-03-31" });
    expect(parseFuzzyDate("1985. március")).toMatchObject({ from: "1985-03-01", to: "1985-03-31" });
    expect(parseFuzzyDate("1985-03")).toMatchObject({ from: "1985-03-01", to: "1985-03-31" });
    expect(parseFuzzyDate("1890-1895")).toMatchObject({ from: "1890-01-01", to: "1890-12-31" }); // nu e o lună
    for (const s of ["about 1870", "circa 1870", "c. 1870", "vers 1870", "um 1870", "hacia 1870", "verso 1870", "omstreeks 1870", "kb. 1870", "1870 körül"]) {
      expect(parseFuzzyDate(s), s).toMatchObject({ from: "1868-01-01", to: "1872-12-31", approx: true });
    }
    for (const s of ["before 1900", "avant 1900", "vor 1900", "antes de 1900", "prima del 1900", "voor 1900", "1900 előtt", "înainte de 1900"]) {
      expect(parseFuzzyDate(s), s).toMatchObject({ from: "1880-01-01", to: "1900-01-01", approx: true });
    }
    for (const s of ["after 1900", "après 1900", "nach 1900", "después de 1900", "dopo il 1900", "na 1900", "1900 után", "după 1900"]) {
      expect(parseFuzzyDate(s), s).toMatchObject({ from: "1900-01-01", to: "1920-12-31", approx: true });
    }
  });
  it("în engleza americană luna vine întâi: data se păstrează an-lună-zi", () => {
    expect(normalizeTypedDate("03/12/1970", "en-US")).toBe("1970-03-12");
    expect(normalizeTypedDate("3/12/1970", "en-US")).toBe("1970-03-12");
    expect(normalizeTypedDate("13/12/1970", "en-US")).toBe("13/12/1970"); // nu există luna 13: rămâne cum e
    expect(normalizeTypedDate("03/12/1970", "en-GB")).toBe("03/12/1970");
    expect(normalizeTypedDate("12.03.1970", "ro")).toBe("12.03.1970");
    expect(normalizeTypedDate("1970", "en-US")).toBe("1970");
  });
  it("ziua exactă, doar când data e completă", () => {
    expect(exactDay("12 martie 1985")).toBe("1985-03-12");
    expect(exactDay("1985")).toBeNull();
    expect(exactDay("martie 1985")).toBeNull();
    expect(exactDay("cca. 12.03.1985")).toBeNull();
    expect(exactDay(null)).toBeNull();
  });
});

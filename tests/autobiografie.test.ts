import { describe, it, expect } from "vitest";
import { bookFor, bookProgress } from "@/lib/autobiografie";
import { isChapter } from "@/lib/questions";

const me = (sex: "M" | "F") => ({ id: "m", givenName: "Ana", sex, birthYear: 1960, deathYear: null, birthPlace: "Ieud", residencePlace: null, occupation: null });
const bunic = { id: "b", givenName: "Toader", sex: "M" as const, birthYear: 1920, deathYear: 1990 };
const ctx = (sex: "M" | "F") => ({ me: me(sex), parents: [], grandparents: [bunic], partners: [], children: [], siblings: [] });

describe("modelul de autobiografie", () => {
  it("are capitolul despre credință, cu întrebarea despre Hristos, iar capitolele sunt cele din ladă", () => {
    const book = bookFor(ctx("M"));
    expect(book.every((c) => isChapter(c.chapter))).toBe(true);
    const faith = book.find((c) => c.chapter === "credinta")!;
    expect(faith.questions.some((q) => q.text.includes("Isus Hristos"))).toBe(true);
  });

  it("nicio întrebare nu se repetă și fiecare capitol are măcar două", () => {
    const book = bookFor(ctx("F"));
    const keys = book.flatMap((c) => c.questions.map((q) => q.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(book.every((c) => c.questions.length >= 2)).toBe(true);
  });

  it("vorbește cu fiecare după cum e și pune întrebări din arborele lui", () => {
    const text = (sex: "M" | "F") => bookFor(ctx(sex)).flatMap((c) => c.questions.map((q) => q.text)).join(" ");
    expect(text("F")).toContain("când erai mică");
    expect(text("M")).toContain("când erai mic");
    expect(text("M")).toContain("Toader");
  });

  it("socotește doar întrebările din model", () => {
    const book = bookFor(ctx("M"));
    const { done, total } = bookProgress(book, [book[0].questions[0].key, "oricine.altceva"]);
    expect(done).toBe(1);
    expect(total).toBe(book.flatMap((c) => c.questions).length);
  });
});

import { describe, it, expect } from "vitest";
import { safeAccountImage } from "@/lib/tree-data";

describe("poza din contul Google", () => {
  it("arată doar pozele de pe googleusercontent.com, prin https", () => {
    expect(safeAccountImage("https://lh3.googleusercontent.com/a/ACg8oc=s96-c")).toBe("https://lh3.googleusercontent.com/a/ACg8oc=s96-c");
    expect(safeAccountImage("http://lh3.googleusercontent.com/a/x")).toBeNull();
    expect(safeAccountImage("https://exemplu.ro/googleusercontent.com/x")).toBeNull();
    expect(safeAccountImage("https://googleusercontent.com.exemplu.ro/x")).toBeNull();
    expect(safeAccountImage("https://lh3.googleusercontent.com@exemplu.ro/x")).toBeNull();
    expect(safeAccountImage(null)).toBeNull();
  });
});

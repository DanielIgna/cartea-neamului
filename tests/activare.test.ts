import { describe, expect, it } from "vitest";
import { isTestAccount } from "@/lib/conturi-test";
import { facebookSlugBase, groupNames } from "@/lib/sursa";
import { signupNewsFromCookie } from "@/lib/activare-shared";

describe("conturile de test", () => {
  it("contul de probă, @example.com și sursa test-link-…", () => {
    expect(isTestAccount({ email: "demo@cartea-neamului.ro" })).toBe(true);
    expect(isTestAccount({ email: "Ion@Example.com" })).toBe(true);
    expect(isTestAccount({ email: "ion@exemplu.ro", src: ["direct", "test-link-3"] })).toBe(true);
    expect(isTestAccount({ email: "ion@exemplu.ro", src: "fb-romani" })).toBe(false);
    expect(isTestAccount({ email: "ion@example.com.ro" })).toBe(false);
  });
});

describe("linkurile pentru grupuri Facebook", () => {
  it("o etichetă fb-<grup>, fără dubluri", () => {
    expect(facebookSlugBase("Români în Chicago")).toBe("fb-romani-in-chicago");
    expect(facebookSlugBase("FB Genealogie Maramureș")).toBe("fb-genealogie-maramures");
    expect(groupNames("Români în Italia\nromani in italia; Români în Chicago,\n\n")).toEqual(["Români în Italia", "Români în Chicago"]);
  });
});

describe("bifa „Vreau sfaturi pe email” la înscriere", () => {
  it("doar cookie-ul pus de bifă", () => {
    expect(signupNewsFromCookie("a=1; cn-sfaturi=1; b=2")).toBe(true);
    expect(signupNewsFromCookie("cn-sfaturi=0")).toBe(false);
    expect(signupNewsFromCookie(null)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { checkProblem, looksLikeImage, problemContext } from "@/lib/probleme";

const T = "0b4c2a6e-1111-4222-8333-444455556666";
const P = "9a8b7c6d-1111-4222-8333-444455556666";

describe("Raportează o problemă", () => {
  it("ține minte pagina, arborele și fișa din care a venit omul", () => {
    expect(problemContext(`/arbore/${T}/persoana/${P}?x=1`)).toEqual({ page: `/arbore/${T}/persoana/${P}?x=1`, treeId: T, personId: P });
    expect(problemContext("/datele-mele")).toEqual({ page: "/datele-mele", treeId: null, personId: null });
  });
  it("nu primește adrese din afara site-ului", () => {
    for (const bad of ["https://rau.ro", "//rau.ro/x", "javascript:alert(1)", "/a b", "/\\rau", 5, null]) {
      expect(problemContext(bad)).toEqual({ page: null, treeId: null, personId: null });
    }
    expect(problemContext(`/${"a".repeat(500)}`).page).toHaveLength(300);
  });
  it("cere un text și pune felul implicit", () => {
    expect(checkProblem({ kind: "arbore", message: "  hm " })).toEqual({ problem: "message" });
    expect(checkProblem({ kind: "x", message: "Nu merge salvarea" })).toEqual({ ok: { kind: "altceva", message: "Nu merge salvarea" } });
    expect(checkProblem({ kind: "eroare", message: "a".repeat(4001) })).toEqual({ problem: "tooLong" });
  });
  it("recunoaște pozele după primii octeți", () => {
    expect(looksLikeImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(looksLikeImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("image/png");
    expect(looksLikeImage(new TextEncoder().encode("<svg>"))).toBeNull();
  });
});

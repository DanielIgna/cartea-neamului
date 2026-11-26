import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CRIZE_FILA } from "@/lib/istorie/crize-fila";

/** „Crizele care au schimbat lumea”: fila cu versetele doar pentru cei cu cont (Daniel, 2026-11-26). */
describe("crizele care au schimbat lumea", () => {
  it("pagina publică nu are fila, cea pentru cont o are, printre rânduri", async () => {
    // Componentele folosesc JSX clasic la teste (fără transformarea automată a lui Next).
    (globalThis as { React?: typeof React }).React = React;
    const { default: CrizeArticle } = await import("@/components/continut/CrizeArticle");
    const pub = renderToStaticMarkup(createElement(CrizeArticle, { fila: null }));
    const cont = renderToStaticMarkup(createElement(CrizeArticle, { fila: CRIZE_FILA }));
    expect(pub).toContain("Marea Criză");
    expect(pub).not.toMatch(/Apocalipsa|Matei 24|antihrist/);
    expect(cont).toContain("Apocalipsa 13:16–17");
    // Fila stă între „Criza de acum” și concluzii, nu la final.
    expect(cont.indexOf("O carte veche")).toBeGreaterThan(cont.indexOf("Criza de acum"));
    expect(cont.indexOf("O carte veche")).toBeLessThan(cont.indexOf("Ce i-a ajutat pe oameni"));
  });
  it("pagina gata făcută pentru vizitatori nu importă fila", () => {
    const src = readFileSync("src/app/(public)/pub/[v]/istoria-umanitatii/crize/page.tsx", "utf8");
    expect(src).not.toContain("crize-fila");
  });
});

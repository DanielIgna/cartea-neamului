import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ARTICOLE, articolPath } from "@/lib/istorie/articole";
import { FILE } from "@/lib/istorie/file";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { config } from "@/middleware";

const BIBLIC = /Apocalipsa|Matei 24|antihrist|Eclesiastul|Ioan 1:29|Luca 12|Timotei|Galateni|Mielul/;

/** Seria „Răscrucile istoriei”: filele cu versete doar pentru cei cu cont (Daniel, 2026-11-26). */
describe("seria de articole din Istoria umanității", () => {
  it("paginile publice n-au nimic biblic; cele pentru cont au fila printre rânduri", async () => {
    // Componentele folosesc JSX clasic la teste (fără transformarea automată a lui Next).
    (globalThis as { React?: typeof React }).React = React;
    const { default: IstorieArticle } = await import("@/components/continut/IstorieArticle");
    for (const a of ARTICOLE) {
      const pub = renderToStaticMarkup(createElement(IstorieArticle, { slug: a.slug, fila: null }));
      expect(pub, a.slug).not.toMatch(BIBLIC);
      expect(a.text, a.slug).not.toMatch(BIBLIC);
      const fila = FILE[a.slug];
      expect(!!fila, a.slug).toBe(a.text.includes("\n[[fila]]\n"));
      if (!fila) continue;
      const cont = renderToStaticMarkup(createElement(IstorieArticle, { slug: a.slug, fila }));
      expect(cont).toMatch(BIBLIC);
      // Fila stă în mijlocul textului, nu la final: după ea mai urmează cel puțin un titlu din articol.
      const h2 = [...cont.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1]);
      const filaId = (fila.find((b) => b.t === "h2") as { id: string }).id;
      expect(h2.indexOf(filaId)).toBeLessThan(h2.length - 1);
    }
  });
  it("paginile gata făcute pentru vizitatori nu importă filele; fiecare articol e în sitemap și în middleware", () => {
    for (const a of ARTICOLE) {
      const src = readFileSync(`src/app/(public)/pub/[v]/istoria-umanitatii/${a.slug}/page.tsx`, "utf8");
      expect(src).not.toMatch(/istorie\/file|crize-fila/);
      expect(PUBLIC_PAGES.some((p) => p.path === articolPath(a.slug))).toBe(true);
      expect(config.matcher).toContain(articolPath(a.slug));
    }
  });
});

import type { BookFormat } from "./book";

/**
 * Foaia de stil a cărții, dată lui Paged.js: mărimea paginii, marginile, antetele (titlul cărții pe paginile din stânga,
 * capitolul pe cele din dreapta), numerele paginilor și tipografia. Totul în milimetri și puncte, ca la tipar.
 */
export const PAGE: Record<BookFormat, { w: number; h: number; top: number; side: number; bottom: number; base: number }> = {
  A4: { w: 210, h: 297, top: 20, side: 18, bottom: 20, base: 10.5 },
  A5: { w: 148, h: 210, top: 15, side: 13, bottom: 16, base: 9.5 },
};

/** Spațiul de scris al unei pagini (fără margini), în milimetri. */
export const contentBox = (f: BookFormat) => ({ w: PAGE[f].w - 2 * PAGE[f].side, h: PAGE[f].h - PAGE[f].top - PAGE[f].bottom });
/** Cât de lung poate fi un desen întors, sub titlul capitolului și o frază de explicație. */
export const ROT = (f: BookFormat) => contentBox(f).h - (f === "A5" ? 40 : 50);

// Culorile desenelor, mereu cele luminoase: cartea se tipărește pe hârtie albă, chiar dacă site-ul e pe temă întunecată.
const LIGHT = `--bg:#ffffff; --surface:#ffffff; --surface-2:#f6f8f9; --ink:#1b2430; --muted:#5b6673; --line:#c9d0d6;
  --accent:#1f5fa8; --on-accent:#ffffff; --accent-soft:#dbe7f5; --ochre:#b9822a; --ochre-soft:#f3e6cf;
  --pat-1:#c9daef; --pat-2:#dbe6f4; --pat-3:#e8eff8; --pat-4:#f1f5fb; --mat-1:#ecd8b4; --mat-2:#f2e4ca; --mat-3:#f6ecdb; --mat-4:#faf4ea;
  --tree-bark:#7a5a3a; --tree-ground:#d9e4cf; --leaf-pat:#cfe3c0; --leaf-mat:#e6e3b5; --leaf-edge:#7f9a6a; --tree-bark-dark:#553b22;
  --foliage-1:#a9c98f; --foliage-2:#8fbf7a; --foliage-3:#c4d99a; --leaf-spouse:#f1e4d0; --desc:#e4eef8; color-scheme: light;`;

export function bookCss(format: BookFormat) {
  const p = PAGE[format], box = contentBox(format), s = p.base, small = format === "A5";
  const margin = `font-family: "Alegreya Sans", sans-serif; font-size: ${s - 2.5}pt; color: #6b7380; letter-spacing: .03em;`;
  return `
@page { size: ${format}; margin: ${p.top}mm ${p.side}mm ${p.bottom}mm;
  @bottom-center { content: counter(page); ${margin} }
}
@page :left { @top-left { content: string(booktitle); ${margin} font-style: italic; } }
@page :right { @top-right { content: string(chapter, first-except); ${margin} text-transform: uppercase; letter-spacing: .08em; } }
@page :first { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page :blank { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }

.bk { ${LIGHT} font-family: "Alegreya", Georgia, serif; font-size: ${s}pt; line-height: 1.42; color: #1b2430; }
.bk h1, .bk h2, .bk h3 { font-family: "Alegreya", Georgia, serif; font-weight: 700; color: #1b2430; margin: 0; text-wrap: balance; }
.bk p { margin: 0 0 .55em; orphans: 2; widows: 2; }
.bk a { color: inherit; text-decoration: none; }
.bk .bk-pg { font-family: "Alegreya Sans", sans-serif; font-size: .8em; color: #8a6a35; white-space: nowrap; }
.bk .bk-muted { color: #5b6673; }
.bk .bk-sans { font-family: "Alegreya Sans", sans-serif; }

/* Coperta */
.bk-cover { height: ${box.h - 2}mm; display: flex; flex-direction: column; align-items: center; text-align: center; padding: ${small ? 10 : 16}mm 0 ${small ? 4 : 6}mm; break-after: page; }
.bk-kicker { font-family: "Alegreya Sans", sans-serif; letter-spacing: .32em; text-transform: uppercase; font-size: ${s - 1.5}pt; color: #9a6b1f; font-weight: 700; }
.bk-title { font-size: ${small ? 27 : 38}pt; line-height: 1.08; margin-top: ${small ? 7 : 10}mm; string-set: booktitle content(text); }
.bk-subtitle { font-style: italic; font-size: ${s + 2.5}pt; color: #4a5562; margin-top: ${small ? 3 : 4}mm; max-width: 80%; }
.bk-ornament { margin: auto 0; width: ${small ? 48 : 72}mm; height: auto; }
.bk-cover-foot { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1}pt; color: #4a5562; line-height: 1.5; }

/* Capitolele */
.bk-chapter { break-before: page; }
.bk-chapter > h2 { font-size: ${small ? 18 : 23}pt; line-height: 1.12; string-set: chapter content(text); }
.bk-chapter > h2::after { content: ""; display: block; width: 18mm; height: 1.2pt; background: #b9822a; margin-top: 3mm; }
.bk-chapter-sub { font-style: italic; font-size: ${s + 1.5}pt; color: #4a5562; margin: 2.5mm 0 ${small ? 4 : 6}mm; }
.bk-lead { font-size: ${s + 1.5}pt; line-height: 1.5; }
.bk .bk-h { font-size: ${s + 1.5}pt; margin: ${small ? 4 : 6}mm 0 1.5mm; }
.bk-list { padding-left: 5mm; margin: 1mm 0 3mm; }
.bk-list li { margin: .5mm 0; }
.bk-note { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1}pt; color: #4a5562; border-left: 1.2pt solid #b9822a; padding: 1mm 0 1mm 3mm; margin: 4mm 0; }
.bk-preface p { text-indent: 5mm; margin: 0 0 .3em; }
.bk-preface p:first-of-type { text-indent: 0; }
.bk-sign { text-align: right; font-style: italic; margin-top: 5mm; }

/* Cuprinsul */
.bk-toc ol { list-style: none; padding: 0; margin: ${small ? 4 : 6}mm 0 0; }
.bk-toc li { display: flex; align-items: baseline; gap: 2mm; padding: 1.3mm 0; break-inside: avoid; }
.bk-toc li.sub { padding-left: 6mm; font-size: .94em; }
.bk-toc li .bk-dots { flex: 1; border-bottom: .7pt dotted #a9b0b8; min-width: 6mm; }
.bk-toc li .bk-pg { font-size: 1em; color: #1b2430; }

/* Desenele */
.bk-fig { margin: ${small ? 3 : 5}mm 0 0; text-align: center; break-inside: avoid; }
.bk-fig svg { width: 100% !important; max-width: 100% !important; height: auto !important; max-height: ${box.h - 45}mm; margin: 0 auto; }
.bk-fig svg .sector { cursor: default; }
.bk-fig figcaption { font-size: ${s - 1}pt; color: #5b6673; font-style: italic; margin-top: 2mm; }
/* Un desen lat se întoarce pe lungimea paginii, cu partea de sus spre stânga (cartea se rotește spre dreapta ca să-l citești). */
.bk-fig.rot { position: relative; height: ${ROT(format)}mm; margin-top: 1mm; }
.bk-fig.rot svg { position: absolute; top: 100%; left: 0; width: ${ROT(format)}mm !important; max-width: none !important; height: ${box.w}mm !important; max-height: none; transform-origin: 0 0; transform: rotate(-90deg); }
.bk-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 2mm 5mm; font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: #5b6673; margin-top: 2mm; }
.bk-legend i { display: inline-block; width: 3mm; height: 3mm; border-radius: .6mm; vertical-align: -.4mm; margin-right: 1.2mm; }

/* Urmașii la rând */
.bk-outline { list-style: none; padding: 0; margin: ${small ? 3 : 4}mm 0 0; font-size: ${s - 0.6}pt; line-height: 1.35; }
.bk-outline li { padding: .55mm 0; break-inside: avoid; }
.bk-outline .num { font-family: "Alegreya Sans", sans-serif; font-weight: 700; color: #9a6b1f; margin-right: 1.5mm; font-size: .88em; }
.bk-outline .who { font-weight: 700; }
.bk-outline .sp, .bk-outline .from { color: #4a5562; }

/* Fișele */
.bk-person { padding: ${small ? 3 : 4}mm 0 ${small ? 2 : 3}mm; border-top: .6pt solid #d9dee3; }
.bk-chapter-sub + .bk-person { border-top: 0; padding-top: 0; }
.bk-person-top { display: flex; gap: ${small ? 3 : 4}mm; align-items: flex-start; break-inside: avoid; }
.bk-person-main { flex: 1; min-width: 0; }
.bk-photo { width: ${small ? 20 : 27}mm; height: ${small ? 25 : 34}mm; object-fit: cover; border-radius: 1.5mm; flex: none; background: #eef1f2; }
.bk-person h3 { font-size: ${small ? 12 : 14}pt; line-height: 1.15; }
.bk-person .bk-born { font-weight: 400; font-style: italic; color: #4a5562; font-size: .8em; }
.bk-person .bk-dates { font-family: "Alegreya Sans", sans-serif; color: #5b6673; font-size: ${s - 1}pt; margin-top: .5mm; }
.bk-facts { margin: 2mm 0 0; font-size: ${s - 0.5}pt; line-height: 1.35; }
.bk-row { display: grid; grid-template-columns: ${small ? 21 : 25}mm 1fr; column-gap: 3mm; margin: .7mm 0; }
.bk-facts dt { font-family: "Alegreya Sans", sans-serif; color: #6b7380; font-size: .88em; padding-top: .35mm; }
.bk-facts dd { margin: 0; }
.bk-bio { margin-top: 2.5mm; }
.bk-album { display: grid; grid-template-columns: repeat(${small ? 2 : 3}, 1fr); gap: 3mm; margin-top: 3mm; break-inside: avoid; }
.bk-album figure { margin: 0; }
.bk-album img { width: 100%; height: ${small ? 30 : 40}mm; object-fit: cover; border-radius: 1mm; display: block; background: #eef1f2; }
.bk-album figcaption { font-size: ${s - 2}pt; line-height: 1.3; color: #5b6673; margin-top: 1mm; font-style: italic; }

/* Indexul */
.bk-index { list-style: none; padding: 0; margin: ${small ? 3 : 5}mm 0 0; font-size: ${s - 1.2}pt; line-height: 1.3; columns: 2; column-gap: ${small ? 6 : 9}mm; }
.bk-index li { display: flex; align-items: baseline; gap: 1.5mm; padding: .35mm 0; break-inside: avoid; }
.bk-index .name { flex: 1; min-width: 0; }
.bk-index .bk-muted { font-size: .9em; }
.bk-index .bk-pg { font-size: .95em; color: #1b2430; }

/* Ultima pagină */
.bk-colophon { break-before: page; height: ${box.h - 2}mm; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;
  font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: #5b6673; line-height: 1.55; }
.bk-colophon p { max-width: 80%; }
`;
}

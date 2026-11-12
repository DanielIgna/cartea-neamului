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

// Paleta cărții: cerneală caldă, maro, pe hârtie albă, cu auriul semnului; coperta e ca o legătură de piele cu litere aurite.
const INK = "#2b2219", SOFT = "#5c4d3e", MUTE = "#7d6c5a", GOLD = "#a8741f", RULE = "#e4d8c3", CREAM = "#faf5ea";
const svg = (body: string, box: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${box}'>${body}</svg>`)}")`;
/** Fleuronul de sub titlurile capitolelor: două linii subțiri, două puncte și un romb, în auriu. */
const FLEURON = (c: string) => svg(`<path d='M0 6H47M73 6H120' stroke='${c}' stroke-width='.7'/><path d='M60 .8L65.2 6L60 11.2L54.8 6Z' fill='${c}'/><path d='M60 3.4L62.6 6L60 8.6L57.4 6Z' fill='#fff' opacity='.55'/><circle cx='50.5' cy='6' r='1.5' fill='${c}'/><circle cx='69.5' cy='6' r='1.5' fill='${c}'/>`, "0 0 120 12");
/** Colțurile ramei de pe copertă: un sfert de floare din linii, rotit pentru fiecare colț. */
const CORNER = (c: string) => svg(`<path d='M2 40V2H40' fill='none' stroke='${c}' stroke-width='1.2'/><path d='M7 30V7H30' fill='none' stroke='${c}' stroke-width='.6'/><path d='M13 8.5L17.5 13L13 17.5L8.5 13Z' fill='${c}'/><circle cx='22' cy='7' r='1.3' fill='${c}'/><circle cx='7' cy='22' r='1.3' fill='${c}'/>`, "0 0 42 42");

export function bookCss(format: BookFormat) {
  const p = PAGE[format], box = contentBox(format), s = p.base, small = format === "A5";
  const margin = `font-family: "Alegreya Sans", sans-serif; font-size: ${s - 2.5}pt; color: ${MUTE}; letter-spacing: .03em;`;
  const corner = small ? 11 : 15, inset = small ? 7 : 10;
  return `
@page { size: ${format}; margin: ${p.top}mm ${p.side}mm ${p.bottom}mm;
  @bottom-center { content: "·  " counter(page) "  ·"; ${margin} color: ${GOLD}; font-size: ${s - 1.5}pt; letter-spacing: .12em; }
}
@page :left { @top-left { content: string(booktitle); ${margin} font-family: "Alegreya", serif; font-style: italic; } }
@page :right { @top-right { content: string(chapter, first-except); ${margin} text-transform: uppercase; letter-spacing: .16em; font-size: ${s - 3}pt; } }
@page :first { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page :blank { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page coperta { margin: 0; @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page liniste { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }

.bk { ${LIGHT} font-family: "Alegreya", Georgia, serif; font-size: ${s}pt; line-height: 1.45; color: ${INK}; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  font-variant-numeric: oldstyle-nums proportional-nums; font-kerning: normal; hyphens: auto; }
.bk h1, .bk h2, .bk h3 { font-family: "Alegreya", Georgia, serif; font-weight: 700; color: ${INK}; margin: 0; text-wrap: balance; }
.bk p { margin: 0 0 .55em; orphans: 2; widows: 2; }
.bk a { color: inherit; text-decoration: none; }
.bk .bk-pg { font-family: "Alegreya Sans", sans-serif; font-size: .8em; color: ${GOLD}; white-space: nowrap; font-variant-numeric: lining-nums; }
.bk .bk-muted { color: ${MUTE}; }
.bk .bk-sans { font-family: "Alegreya Sans", sans-serif; }

/* Coperta: legătură de piele, ramă dublă aurită cu colțuri, titlul cu litere de aur și semnul platformei */
.bk-cover { page: coperta; position: relative; height: ${p.h - 0.6}mm; overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: ${small ? 24 : 34}mm ${small ? 18 : 26}mm ${small ? 18 : 26}mm; box-sizing: border-box; break-after: page;
  background: radial-gradient(ellipse 90% 70% at 50% 40%, #4d3824 0%, #3a2a1b 55%, #261b11 100%); color: #e8d3a2;
  --accent: #e6c98a; --ochre: #c6943f; --ink: #f2e2bb; }
.bk-frame { position: absolute; inset: ${inset}mm; border: 1pt solid #c9a35a; pointer-events: none; }
.bk-frame::before { content: ""; position: absolute; inset: 1.6mm; border: .4pt solid #a8823f; }
.bk-frame i { position: absolute; width: ${corner}mm; height: ${corner}mm; background: ${CORNER("#d4ae66")} center / contain no-repeat; }
.bk-frame i:nth-child(1) { top: -1mm; left: -1mm; }
.bk-frame i:nth-child(2) { top: -1mm; right: -1mm; transform: scaleX(-1); }
.bk-frame i:nth-child(3) { bottom: -1mm; left: -1mm; transform: scaleY(-1); }
.bk-frame i:nth-child(4) { bottom: -1mm; right: -1mm; transform: scale(-1, -1); }
.bk-kicker { font-family: "Alegreya Sans", sans-serif; letter-spacing: .42em; text-transform: uppercase; font-size: ${s - 1.5}pt; color: #c9a35a; font-weight: 700; padding-left: .42em; }
.bk-cover .bk-title { color: #f1dcaa; font-size: ${small ? 30 : 42}pt; line-height: 1.06; margin-top: ${small ? 9 : 13}mm; string-set: booktitle content(text); text-shadow: 0 .4mm 0 rgba(0,0,0,.35); }
.bk-cover .bk-rule { width: ${small ? 36 : 48}mm; height: ${small ? 3.6 : 4.8}mm; margin: ${small ? 5 : 7}mm auto 0; background: ${FLEURON("#c9a35a")} center / contain no-repeat; }
.bk-subtitle { font-style: italic; font-size: ${s + 3}pt; color: #d8c193; margin-top: ${small ? 4 : 6}mm; max-width: 82%; line-height: 1.35; }
.bk-cover-mark { margin: auto 0; width: ${small ? 52 : 74}mm; height: auto; filter: drop-shadow(0 .5mm .4mm rgba(0,0,0,.35)); }
.bk-cover-mark svg, .bk-colophon-mark svg { display: block; width: 100%; height: auto; }
.bk-cover-foot { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1}pt; color: #cdb383; line-height: 1.6; letter-spacing: .06em; }
.bk-cover-foot b { display: block; font-family: "Alegreya", serif; font-style: italic; font-weight: 400; font-size: ${s + 1.5}pt; color: #ecd7a6; letter-spacing: 0; }

/* Pagina de gardă: ex libris, cu copacul și locul pentru numele celui care primește cartea */
.bk-exlibris { page: liniste; height: ${box.h - 2}mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; break-after: page; }
.bk-ornament { width: ${small ? 40 : 56}mm; height: auto; }
.bk-ex { font-style: italic; font-size: ${small ? 20 : 26}pt; color: ${GOLD}; margin-top: ${small ? 6 : 9}mm; letter-spacing: .04em; }
.bk-ex-line { width: ${small ? 70 : 95}mm; border-bottom: .6pt solid ${RULE}; height: ${small ? 10 : 14}mm; }
.bk-ex-title { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; letter-spacing: .3em; text-transform: uppercase; color: ${MUTE}; margin-top: ${small ? 10 : 16}mm; padding-left: .3em; }

/* Capitolele: încep pe pagină nouă, cu titlul la mijloc, fleuronul auriu dedesubt și un rând cursiv */
.bk-chapter { break-before: page; }
.bk-chapter > h2 { font-size: ${small ? 19 : 25}pt; line-height: 1.12; text-align: center; padding-top: ${small ? 8 : 14}mm; string-set: chapter content(text); letter-spacing: .005em; }
.bk-chapter > h2::after { content: ""; display: block; width: ${small ? 30 : 38}mm; height: ${small ? 3 : 3.8}mm; margin: ${small ? 3 : 4}mm auto 0; background: ${FLEURON(GOLD)} center / contain no-repeat; }
.bk-chapter-sub { font-style: italic; font-size: ${s + 1.5}pt; color: ${SOFT}; margin: ${small ? 2.5 : 3.5}mm auto ${small ? 6 : 9}mm; text-align: center; max-width: 85%; }
.bk-chapter > h2 + :not(.bk-chapter-sub) { margin-top: ${small ? 6 : 9}mm; }
.bk-lead { font-size: ${s + 1.5}pt; line-height: 1.55; }
.bk .bk-h { font-size: ${s - 1}pt; margin: ${small ? 5 : 7}mm 0 2mm; font-family: "Alegreya Sans", sans-serif; text-transform: uppercase; letter-spacing: .16em; color: ${GOLD}; break-after: avoid; }
.bk-list { padding-left: 5mm; margin: 1mm 0 3mm; }
.bk-list li { margin: .5mm 0; }
.bk-list li::marker { color: ${GOLD}; }
.bk-note { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1}pt; color: ${SOFT}; background: ${CREAM}; border-left: 1.4pt solid ${GOLD}; padding: 2.5mm 3.5mm; margin: 5mm 0; border-radius: 0 1.2mm 1.2mm 0; }
.bk-preface p { text-indent: 5mm; margin: 0 0 .3em; }
.bk-preface p:first-of-type { text-indent: 0; }
.bk-sign { text-align: right; font-style: italic; margin-top: 6mm; color: ${SOFT}; }
.bk-sign::before { content: "— "; color: ${GOLD}; }

/* Cuprinsul */
.bk-toc ol { list-style: none; padding: 0; margin: ${small ? 4 : 6}mm ${small ? 2 : 6}mm 0; counter-reset: cap; }
.bk-toc li { display: flex; align-items: baseline; gap: 2.5mm; padding: ${small ? 1.4 : 1.8}mm 0; break-inside: avoid; }
.bk-toc li:not(.sub) { counter-increment: cap; font-size: ${s + 0.5}pt; }
.bk-toc li:not(.sub)::before { content: counter(cap, upper-roman); flex: none; width: ${small ? 8 : 10}mm; font-family: "Alegreya Sans", sans-serif; font-size: .74em; letter-spacing: .08em; color: ${GOLD}; font-weight: 700; }
.bk-toc li.sub { padding-left: ${small ? 10.5 : 12.5}mm; font-size: .94em; padding-top: .8mm; padding-bottom: .8mm; }
.bk-toc li .bk-muted { font-style: italic; }
.bk-toc li .bk-dots { flex: 1; border-bottom: .7pt dotted #c7b79c; min-width: 6mm; transform: translateY(-.8mm); }
.bk-toc li .bk-pg { font-size: 1em; color: ${INK}; font-family: "Alegreya", serif; }

/* Desenele */
.bk-fig { margin: ${small ? 3 : 5}mm 0 0; text-align: center; break-inside: avoid; }
.bk-fig svg { width: 100% !important; max-width: 100% !important; height: auto !important; max-height: ${box.h - 50}mm; margin: 0 auto; }
.bk-fig svg .sector { cursor: default; }
.bk-fig figcaption { font-size: ${s - 1}pt; color: ${MUTE}; font-style: italic; margin-top: 2mm; }
/* Un desen lat se întoarce pe lungimea paginii, cu partea de sus spre stânga (cartea se rotește spre dreapta ca să-l citești). */
.bk-fig.rot { position: relative; height: ${ROT(format)}mm; margin-top: 1mm; }
.bk-fig.rot svg { position: absolute; top: 100%; left: 0; width: ${ROT(format)}mm !important; max-width: none !important; height: ${box.w}mm !important; max-height: none; transform-origin: 0 0; transform: rotate(-90deg); }
.bk-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 2mm 5mm; font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: ${MUTE}; margin-top: 2mm; }
.bk-legend i { display: inline-block; width: 3mm; height: 3mm; border-radius: .6mm; vertical-align: -.4mm; margin-right: 1.2mm; }

/* Urmașii la rând */
.bk-outline { list-style: none; padding: 0; margin: ${small ? 3 : 4}mm 0 0; font-size: ${s - 0.6}pt; line-height: 1.35; }
.bk-outline li { padding: .55mm 0; break-inside: avoid; }
.bk-outline .num { font-family: "Alegreya Sans", sans-serif; font-weight: 700; color: ${GOLD}; margin-right: 1.5mm; font-size: .88em; }
.bk-outline .who { font-weight: 700; }
.bk-outline .sp, .bk-outline .from { color: ${SOFT}; }

/* Fișele: numele mare, anii cu litere rare și aurii, poza într-un passe-partout, datele pe două coloane */
.bk-person { padding: ${small ? 4 : 5.5}mm 0 ${small ? 2.5 : 3.5}mm; border-top: .5pt solid ${RULE}; }
.bk-chapter-sub + .bk-person { border-top: 0; padding-top: 0; }
.bk-person-top { display: flex; gap: ${small ? 4 : 5.5}mm; align-items: flex-start; break-inside: avoid; }
.bk-person-main { flex: 1; min-width: 0; }
.bk-photo { width: ${small ? 21 : 29}mm; height: ${small ? 26 : 36}mm; object-fit: cover; flex: none; background: #efe7d8; padding: ${small ? 1 : 1.4}mm; border: .5pt solid #cfb27a;
  box-shadow: 0 .5mm 1.6mm rgba(60,40,15,.18); box-sizing: content-box; }
.bk-person h3 { font-size: ${small ? 12.5 : 15}pt; line-height: 1.15; }
.bk-person .bk-born { font-weight: 400; font-style: italic; color: ${SOFT}; font-size: .78em; }
.bk-person .bk-dates { font-family: "Alegreya Sans", sans-serif; color: ${GOLD}; font-size: ${s - 1.5}pt; margin-top: .8mm; letter-spacing: .12em; font-weight: 700; font-variant-numeric: lining-nums; }
.bk-facts { margin: 2.5mm 0 0; font-size: ${s - 0.5}pt; line-height: 1.38; }
.bk-row { display: grid; grid-template-columns: ${small ? 21 : 25}mm 1fr; column-gap: 3mm; margin: .8mm 0; }
.bk-facts dt { font-family: "Alegreya Sans", sans-serif; color: ${MUTE}; font-size: .78em; padding-top: .45mm; text-transform: uppercase; letter-spacing: .1em; }
.bk-facts dd { margin: 0; }
.bk-bio { margin-top: 3mm; padding-left: ${small ? 3 : 4}mm; border-left: .8pt solid ${RULE}; font-size: ${s + 0.2}pt; line-height: 1.5; }
.bk-album { display: grid; grid-template-columns: repeat(${small ? 2 : 3}, 1fr); gap: 3.5mm; margin-top: 3.5mm; break-inside: avoid; }
.bk-album figure { margin: 0; }
.bk-album img { width: 100%; height: ${small ? 30 : 40}mm; object-fit: cover; display: block; background: #efe7d8; padding: 1mm; border: .5pt solid #d8c39a; box-sizing: border-box; }
.bk-album figcaption { font-size: ${s - 2}pt; line-height: 1.3; color: ${MUTE}; margin-top: 1mm; font-style: italic; }

/* Cu vorbele lor: amintirile din ladă, pe oameni, cu codul QR la cele spuse cu glasul */
.bk-teller { margin-top: ${small ? 6 : 8}mm; }
.bk-chapter-sub + .bk-teller { margin-top: 0; }
.bk-teller > h3 { font-size: ${small ? 13 : 15.5}pt; line-height: 1.15; padding-bottom: 1.5mm; border-bottom: .6pt solid ${RULE}; break-after: avoid; }
.bk-teller-dates { font-family: "Alegreya Sans", sans-serif; font-weight: 400; font-size: ${s - 1}pt; color: ${MUTE}; }
.bk-memory { margin-top: ${small ? 3.5 : 4.5}mm; }
.bk-memory-head { break-inside: avoid; break-after: avoid; }
.bk-memory-chapter { font-family: "Alegreya Sans", sans-serif; font-weight: 700; font-size: ${s - 2.5}pt; letter-spacing: .16em; text-transform: uppercase; color: ${GOLD}; }
.bk-memory h4 { font-size: ${s + 1.5}pt; line-height: 1.2; margin: .6mm 0 0; }
.bk .bk-q { font-style: italic; color: ${SOFT}; margin: .8mm 0 0; }
.bk-q span { font-style: normal; font-family: "Alegreya Sans", sans-serif; font-size: .85em; color: ${MUTE}; }
.bk .bk-when { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: ${MUTE}; margin: .6mm 0 0; }
.bk-memory-body { margin-top: 2mm; }
.bk-memory-body p { text-indent: 4mm; margin: 0 0 .25em; }
.bk-memory-body p:first-child { text-indent: 0; }
.bk-memory-photo { display: block; max-width: 100%; max-height: ${small ? 55 : 80}mm; margin: 2.5mm 0 1mm; break-inside: avoid; background: #efe7d8; padding: 1.2mm; border: .5pt solid #d8c39a; }
.bk-listen { display: flex; align-items: center; gap: ${small ? 3 : 4}mm; margin-top: 2.5mm; padding: 2mm ${small ? 2.5 : 3}mm; background: ${CREAM}; border: .6pt solid ${RULE}; border-radius: 1.5mm;
  break-inside: avoid; font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1}pt; line-height: 1.4; color: ${SOFT}; }
.bk-listen b { color: ${INK}; }
.bk-qr { flex: none; display: block; width: ${small ? 20 : 22}mm; height: ${small ? 20 : 22}mm; background: #fff; }
.bk-qr svg { display: block; width: 100%; height: 100%; }
.bk-url { font-size: .88em; color: ${MUTE}; word-break: break-all; }
.bk .bk-by { font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: ${MUTE}; margin: 1.2mm 0 0; }

/* Indexul, cu inițiala aurie la începutul fiecărei litere */
.bk-index { list-style: none; padding: 0; margin: ${small ? 3 : 5}mm 0 0; font-size: ${s - 1.2}pt; line-height: 1.3; columns: 2; column-gap: ${small ? 7 : 10}mm; column-rule: .4pt solid ${RULE}; }
.bk-index li { display: flex; align-items: baseline; gap: 1.5mm; padding: .35mm 0; break-inside: avoid; }
.bk-index li.bk-letter { display: block; font-size: ${s + 2}pt; font-weight: 700; color: ${GOLD}; padding: 2.2mm 0 .6mm; break-after: avoid; border-bottom: .4pt solid ${RULE}; margin-bottom: .8mm; }
.bk-index li.bk-letter:first-child { padding-top: 0; }
.bk-index .name { flex: 1; min-width: 0; }
.bk-index .bk-muted { font-size: .9em; }
.bk-index .bk-pg { font-size: .95em; color: ${INK}; }

/* Ultima pagină: semnul platformei, numele cărții și cum a fost făcută */
.bk-colophon { page: liniste; break-before: page; height: ${box.h - 2}mm; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;
  font-family: "Alegreya Sans", sans-serif; font-size: ${s - 1.5}pt; color: ${MUTE}; line-height: 1.6; }
.bk-colophon p { max-width: 78%; }
.bk-colophon .bk-colophon-mark { width: ${small ? 16 : 20}mm; height: auto; margin-bottom: 4mm; }
.bk-colophon .bk-colophon-title { font-family: "Alegreya", serif; font-style: italic; font-size: ${s + 2}pt; color: ${INK}; margin-bottom: 1mm; }
.bk-colophon .bk-rule { width: 30mm; height: 3mm; margin: 2mm auto 4mm; background: ${FLEURON(GOLD)} center / contain no-repeat; }
.bk-colophon .bk-site { letter-spacing: .3em; text-transform: uppercase; color: ${GOLD}; font-weight: 700; font-size: ${s - 2.5}pt; margin-top: 3mm; padding-left: .3em; }
`;
}

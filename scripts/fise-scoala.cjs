/**
 * Fișele gratuite pentru școală (public/scoala/*.pdf), făcute o dată și puse în git: `node scripts/fise-scoala.cjs`.
 * Cere Playwright cu Chromium (nu rulează la publicare). Textele vin din src/lib/scoala.ts (copiate aici ca să nu cerem tsx).
 * Fiecare PDF are carteaneamului.ro în subsol.
 */
const { chromium } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");

const OUT = path.join(__dirname, "..", "public", "scoala");
const FS = path.join(__dirname, "..", "node_modules", "@fontsource");
const font = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url("file://${FS}/${file}") format("woff2")}`;
const CSS = `
${font("Alegreya", "alegreya/files/alegreya-latin-ext-700-normal.woff2", 700)}
${font("Alegreya", "alegreya/files/alegreya-latin-700-normal.woff2", 700)}
${font("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-ext-400-normal.woff2", 400)}
${font("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-400-normal.woff2", 400)}
${font("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-ext-700-normal.woff2", 700)}
${font("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-700-normal.woff2", 700)}
@page{size:A4;margin:14mm 12mm 18mm}
*{box-sizing:border-box}
body{font-family:"Alegreya Sans",Arial,sans-serif;color:#2a1d17;font-size:13pt;margin:0}
h1{font-family:"Alegreya",Georgia,serif;font-size:24pt;margin:0 0 2mm;color:#6b3f10}
.sub{margin:0 0 6mm;color:#6c5a4d}
.name{border-bottom:1.5px solid #999;height:9mm;margin-bottom:6mm;display:flex;align-items:end;color:#888;font-size:11pt}
.row{display:grid;gap:3mm;margin-bottom:4mm}
.box{border:2px solid #8a5418;border-radius:4mm;padding:2.5mm 3mm;min-height:30mm;display:flex;flex-direction:column;justify-content:space-between;background:#fffdf8}
.box b{font-size:10.5pt;color:#8a5418}
.line{border-bottom:1px solid #bbb;height:7mm}
.small .box{min-height:26mm}.small b{font-size:9pt}
.lines{margin:0;padding-left:6mm}
.lines li{margin:0 0 3mm;font-weight:700}
.lines li .l{border-bottom:1px solid #bbb;height:8mm;font-weight:400}
.photo{display:flex;align-items:center;justify-content:center;border:1.5px dashed #c9b28f;border-radius:3mm;height:16mm;color:#b9a585;font-size:9pt}
.conn{text-align:center;color:#b9822a;font-size:14pt;margin:-2mm 0 1mm}
table{width:100%;border-collapse:collapse;font-size:11pt}
th,td{border:1px solid #999;padding:2mm;text-align:left;vertical-align:top}
th{background:#f3e3c6}
td{height:9mm}
.ans{margin-top:8mm;font-size:10pt;color:#6c5a4d;border-top:1px dashed #bbb;padding-top:3mm}
.letter p{margin:0 0 4mm;line-height:1.5}
`;
const FOOT = `<div style="width:100%;font-size:8pt;color:#8a7a6a;text-align:center;font-family:Arial,sans-serif">carteaneamului.ro · fișă gratuită pentru proiectul de la școală · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`;

const box = (l, extra = "") => `<div class="box"><b>${l}</b><div class="line"></div><div class="line" style="height:5mm"></div>${extra}</div>`;
const row = (labels, extra) => `<div class="row" style="grid-template-columns:repeat(${labels.length},1fr)">${labels.map((l) => box(l, extra)).join("")}</div>`;
const header = (t, sub) => `<h1>${t}</h1><p class="sub">${sub}</p><div class="name">Numele elevului, clasa:</div>`;
const photo = `<div class="photo">poză sau desen</div>`;

const INTERVIEW = [
  "Cum te cheamă și unde te-ai născut?", "Cum se numeau părinții tăi și ce meserii aveau?", "Cum arăta casa în care ai copilărit?",
  "Ce jocuri jucai când erai de vârsta mea?", "Cum era școala ta? Cine ți-a fost învățător?", "Ce mâncare îți plăcea cel mai mult și cine o gătea?",
  "Ce sărbători sau obiceiuri aveați în familie?", "Cum v-ați cunoscut tu și bunicul (bunica)?", "Care e cea mai frumoasă amintire a ta?",
  "Ce ți-ar plăcea să știu eu despre familia noastră?",
];
const QUIZ = [
  ["Fratele mamei sau al tatălui meu este…", "unchiul meu"], ["Sora mamei sau a tatălui meu este…", "mătușa mea"],
  ["Copilul unchiului sau al mătușii mele este…", "vărul (vara) meu"], ["Mama mamei mele este…", "bunica mea"],
  ["Tatăl bunicului meu este…", "străbunicul meu"], ["Copilul fratelui sau al surorii mele este…", "nepotul (nepoata) meu"],
  ["Soțul surorii mele este…", "cumnatul meu"], ["Tatăl soției (sau al soțului) este…", "socrul"],
  ["Eu sunt pentru bunicii mei…", "nepotul (nepoata) lor"], ["Părinții, bunicii și străbunicii mei sunt…", "strămoșii (înaintașii) mei"],
];

const SHEETS = {
  "arbore-3-generatii": header("Arborele familiei mele", "Trei generații: eu, părinții și bunicii. Scrie numele, anul și localitatea nașterii. Ce nu știi, lași gol și întrebi acasă.")
    + `<div class="row" style="grid-template-columns:repeat(4,1fr)">${["Bunicul<br>(tatăl tatălui)", "Bunica<br>(mama tatălui)", "Bunicul<br>(tatăl mamei)", "Bunica<br>(mama mamei)"].map((l) => box(l, photo)).join("")}</div>`
    + `<div class="conn">▲ ▲</div>` + row(["Tata", "Mama (și numele de fată)"], photo) + `<div class="conn">▲</div>`
    + `<div class="row" style="grid-template-columns:1fr 2fr 1fr"><div></div>${box("Eu", photo)}<div></div></div>`,
  "arbore-strabunici": header("Arborele familiei, cu străbunici", "Patru generații, cam o sută de ani. La străbunici, scrie și ce meserie aveau, dacă află cineva din familie.")
    + `<div class="row small" style="grid-template-columns:repeat(8,1fr)">${Array.from({ length: 8 }, (_, i) => box(i % 2 ? "Străbunica" : "Străbunicul", '<div class="line" style="height:5mm"></div>')).join("")}</div>`
    + `<div class="conn">▲ ▲ ▲ ▲</div>` + row(["Bunicul (tatăl tatălui)", "Bunica (mama tatălui)", "Bunicul (tatăl mamei)", "Bunica (mama mamei)"])
    + `<div class="conn">▲ ▲</div>` + row(["Tata", "Mama (și numele de fată)"]) + `<div class="conn">▲</div>`
    + `<div class="row" style="grid-template-columns:1fr 2fr 1fr"><div></div>${box("Eu")}<div></div></div>`,
  "interviu-bunici": header("Interviul cu bunicii", "Zece întrebări pentru o discuție cu bunica sau bunicul. Scrie pe scurt ce îți răspund, cu cuvintele lor.")
    + `<div class="name">Pe cine am întrebat și când:</div><ol class="lines">${INTERVIEW.map((q) => `<li>${q}<div class="l"></div><div class="l"></div></li>`).join("")}</ol>`,
  "cine-ce-ruda-imi-este": header("Cine ce rudă îmi este", "Completează cuvântul potrivit. Răspunsurile sunt jos, dar încearcă întâi singur!")
    + `<ol class="lines">${QUIZ.map(([q]) => `<li>${q}<div class="l"></div></li>`).join("")}</ol>`
    + `<div class="ans"><b>Răspunsuri:</b> ${QUIZ.map(([, a], i) => `${i + 1}. ${a}`).join(" · ")}</div>`,
  "kit-fisa-clasei": `<h1>Proiectul „Arborele familiei” – fișa clasei</h1><p class="sub">Școala: ______________________ Clasa: ______ Cadrul didactic: ______________________ Termen: __________</p>`
    + `<table><thead><tr><th style="width:6%">Nr.</th><th style="width:34%">Elevul</th><th>Arborele</th><th>Interviul</th><th>Prezentarea</th><th style="width:22%">Observații</th></tr></thead><tbody>${Array.from({ length: 30 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}</tbody></table>`,
  "kit-scrisoare-parinti": `<div class="letter"><h1>Dragi părinți,</h1>
    <p>În perioada următoare, la clasă lucrăm la proiectul „Arborele familiei”. Copiii învață ce este o generație, cum se numesc rudele și cum se păstrează amintirile unei familii.</p>
    <p><b>Ce vă rugăm să faceți acasă:</b> ajutați-l pe copil să completeze fișa cu arborele (el, părinții, bunicii și, dacă știți, străbunicii) și, dacă se poate, să stea de vorbă cu un bunic sau o bunică folosind fișa „Interviul cu bunicii”. Ce nu știți lăsați gol: un arbore cu goluri e perfect pentru o clasă de școală.</p>
    <p><b>Familii diferite:</b> arborele poate arăta familia în care crește copilul. Cei care l-au crescut au locul lor în fișă. Nu trebuie trecut nimic din ce familia nu dorește să spună.</p>
    <p><b>Datele rămân ale familiei.</b> Fișele se predau doar la clasă. Dacă vreți să faceți arborele și online, împreună cu rudele, puteți folosi carteaneamului.ro (primele 7 zile gratuite); proiectul nu cere acest lucru.</p>
    <p>Termen de predare: ______________________</p>
    <p>Vă mulțumim,<br>______________________<br>(cadrul didactic)</p></div>`,
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const p = await b.newPage();
  for (const [slug, body] of Object.entries(SHEETS)) {
    await p.setContent(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(OUT, `${slug}.pdf`), format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: FOOT,
      margin: { top: "14mm", bottom: "18mm", left: "12mm", right: "12mm" } });
    console.log("fise-scoala:", slug);
  }
  await b.close();
})();

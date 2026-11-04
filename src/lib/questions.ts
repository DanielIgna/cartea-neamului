/**
 * Întrebările din Lada cu amintiri. Nu pornesc de la o pagină goală: arborele știe cine i-au fost bunicii, unde s-a născut omul,
 * cu cine s-a căsătorit și în ce an s-a născut, așa că întrebările poartă numele și anii lui. Doi oameni din aceeași familie
 * primesc întrebări diferite. Totul e scris de mână, în română, fără inteligență artificială și fără costuri.
 */
export type Chapter = "copilaria" | "scoala" | "dragostea" | "munca" | "copiii" | "plecarea" | "obiceiuri" | "istoria" | "invatat" | "altele";

/** Capitolele poveștii, în ordinea în care se răsfoiesc. */
export const CHAPTERS: { key: Chapter; label: string }[] = [
  { key: "copilaria", label: "Copilăria" },
  { key: "scoala", label: "Școala" },
  { key: "dragostea", label: "Dragostea" },
  { key: "munca", label: "Munca" },
  { key: "copiii", label: "Copiii" },
  { key: "plecarea", label: "Plecări și drumuri" },
  { key: "obiceiuri", label: "Obiceiuri" },
  { key: "istoria", label: "Istoria mare" },
  { key: "invatat", label: "Ce am învățat" },
  { key: "altele", label: "Alte amintiri" },
];
export const chapterLabel = (c: string) => CHAPTERS.find((x) => x.key === c)?.label ?? "Alte amintiri";
export const isChapter = (c: string): c is Chapter => CHAPTERS.some((x) => x.key === c);

export type Question = { key: string; chapter: Chapter; text: string; kind: "tree" | "history" | "any" };
export type Who = { id: string; givenName: string; sex: "M" | "F" | "U"; birthYear: number | null; deathYear: number | null };
export type QuestionContext = {
  me: Who & { birthPlace: string | null; residencePlace: string | null; occupation: string | null };
  parents: Who[]; grandparents: Who[]; partners: Who[]; children: Who[]; siblings: Who[];
};

const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** „Ana, Ion și Maria” */
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);

/** Întrebările scrise din arbore: bunici, părinți, soț, copii, frați, locuri, meserie. */
function fromTree({ me, parents, grandparents, partners, children, siblings }: QuestionContext): Question[] {
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string) => out.push({ key, chapter, text, kind: "tree" });
  for (const g of grandparents) {
    if (!g.givenName) continue;
    const word = g.sex === "F" ? "bunica" : "bunicul";
    const neverMet = g.deathYear !== null && me.birthYear !== null && g.deathYear < me.birthYear;
    if (neverMet) q(`bunic.${g.id}`, "copilaria", `Ce povesteau ai tăi despre ${word} ${g.givenName}? Tu n-ai mai apucat${g.sex === "F" ? "-o" : "-l"}.`);
    else {
      q(`bunic.${g.id}`, "copilaria", `Ce îți amintești despre ${word} ${g.givenName}?`);
      q(`bunic.${g.id}.invatat`, "invatat", `Ce te-a învățat ${word} ${g.givenName}?`);
    }
  }
  for (const p of parents) {
    if (!p.givenName) continue;
    const mom = p.sex === "F";
    q(`parinte.${p.id}.zi`, "copilaria", `Ce făcea ${mom ? "mama ta" : "tatăl tău"}, ${p.givenName}, într-o zi obișnuită, când erai copil?`);
    q(`parinte.${p.id}.vorba`, "invatat", `Ce vorbă de-a ${mom ? "mamei tale" : "tatălui tău"} îți vine și acum în minte?`);
  }
  for (const s of partners) {
    if (!s.givenName) continue;
    q(`sot.${s.id}.cunoscut`, "dragostea", `Cum v-ați cunoscut tu și ${s.givenName}? Cine a făcut primul pas?`);
    q(`sot.${s.id}.nunta`, "dragostea", `Cum a fost nunta ta cu ${s.givenName}? Unde ați făcut-o și cine a cântat?`);
  }
  for (const c of children) if (c.givenName) q(`copil.${c.id}.nastere`, "copiii", `Ce ai simțit când s-a născut ${c.givenName}?`);
  if (children.length) q("copii.pozne", "copiii", children.length === 1 ? `Ce poznă de-a lui ${children[0].givenName} îți amintești și acum?` : "Ce poznă de-a copiilor îți amintești și acum?");
  const sibs = siblings.filter((s) => s.givenName).map((s) => s.givenName);
  if (sibs.length === 1) q("frati.impreuna", "copilaria", `Ce făceați împreună tu și ${sibs[0]} când erați mici?`);
  else if (sibs.length > 1) q("frati.care", "copilaria", `Cu care dintre frați te înțelegeai cel mai bine: ${andList(sibs.slice(0, 6))}? De ce?`);
  q("copilarie.casa", "copilaria", me.birthPlace ? `Cum arăta casa în care ai crescut, în ${me.birthPlace}?` : "Cum arăta casa în care ai crescut?");
  if (me.birthPlace && me.residencePlace && norm(me.birthPlace) !== norm(me.residencePlace))
    q("plecarea.de-ce", "plecarea", `De ce ai plecat din ${me.birthPlace} la ${me.residencePlace}? Cum a fost la început?`);
  if (me.occupation) q("munca.meserie", "munca", `Cum ai ajuns ${me.occupation.trim().toLowerCase()}? Cine te-a învățat meseria?`);
  return out;
}

/** Istoria mare, cu vârsta pe care o avea omul atunci. Fără anul nașterii nu le punem: n-am ști dacă le-a trăit. */
function fromHistory({ me }: QuestionContext): Question[] {
  const born = me.birthYear;
  if (born === null) return [];
  const age = (year: number) => year - born;
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string) => out.push({ key, chapter, text, kind: "history" });
  if (age(1944) >= 4) q("istorie.razboi", "istoria", `Aveai ${age(1944)} ani în 1944. Ce îți amintești din anii războiului?`);
  else if (born <= 1965) q("istorie.razboi", "istoria", "Ce povesteau cei bătrâni din familie despre război?");
  if (born <= 1955) q("istorie.colectivizare", "istoria", "Ce povesteau ai tăi despre colectivizare? Ce s-a întâmplat cu pământul și cu animalele familiei?");
  if (age(1969) >= 6) q("istorie.1969", "istoria", `În iulie 1969 omul a pășit pe Lună. Aveai ${age(1969)} ani: ai aflat de la radio sau de la televizor?`);
  if (age(1977) >= 5) q("istorie.1977", "istoria", `Aveai ${age(1977)} ani la cutremurul din 4 martie 1977. Unde erai în seara aceea?`);
  if (born >= 1945 && born <= 1980) q("istorie.tv", "istoria", "Ce vă plăcea la televizor, pe vremea când programul ținea două ore pe seară?");
  if (age(1985) >= 8) q("istorie.cozi", "istoria", "Cum era cu cozile la alimente în anii '80? Ce era cel mai greu de găsit?");
  if (age(1989) >= 6) q("istorie.1989", "istoria", `Aveai ${age(1989)} ani în decembrie 1989. Ce ai văzut sau ai auzit în zilele Revoluției?`);
  if (age(1990) >= 10) q("istorie.dupa1990", "istoria", "Ce s-a schimbat cel mai mult în viața voastră după 1990?");
  if (age(1994) >= 7) q("istorie.1994", "istoria", "Unde ai văzut meciurile României de la Mondialul din 1994? Cu cine?");
  if (age(1999) >= 5) q("istorie.1999", "istoria", "Ai văzut eclipsa de soare din 11 august 1999? Unde erai?");
  if (age(2020) >= 10) q("istorie.2020", "istoria", "Cum ați trecut prin pandemia din 2020? Ce v-a lipsit cel mai mult?");
  if (me.sex === "M" && born >= 1925 && born <= 1987) q("plecarea.armata", "plecarea", "Unde ai făcut armata și ce îți amintești de acolo?");
  if (born <= 1995) q("plecarea.strainatate", "plecarea", "A plecat cineva din familie la muncă în străinătate? Cum a fost despărțirea?");
  return out;
}

/** Întrebări bune pentru oricine. */
const ANY: [string, Chapter, string][] = [
  ["prima-amintire", "copilaria", "Care e prima ta amintire?"],
  ["jocul", "copilaria", "Care era jocul tău preferat când erai mic?"],
  ["vara", "copilaria", "Ce făceai vara, în vacanțele copilăriei?"],
  ["prieten-scoala", "scoala", "Cine ți-a fost cel mai bun prieten la școală și ce s-a ales de el?"],
  ["profesor", "scoala", "Ce învățător sau profesor ți-a rămas în minte? De ce?"],
  ["drum-scoala", "scoala", "Cum mergeai la școală: pe jos, cu bicicleta, cu autobuzul? Cât de departe era?"],
  ["pozna-scoala", "scoala", "Ce poznă ai făcut la școală și n-a aflat nimeni?"],
  ["prima-dragoste", "dragostea", "Cine a fost prima ta dragoste?"],
  ["cel-mai-frumos", "dragostea", "Care e cel mai frumos lucru pe care l-a făcut cineva pentru tine?"],
  ["primul-loc", "munca", "Care a fost primul tău loc de muncă? Cât câștigai?"],
  ["primul-salariu", "munca", "Pe ce ai dat primul salariu?"],
  ["anul-greu", "munca", "Care a fost cel mai greu an din viața ta și cum ai trecut peste el?"],
  ["calatorie", "plecarea", "Care a fost cea mai lungă călătorie a ta?"],
  ["departe", "plecarea", "Ai locuit vreodată departe de casă? Cum a fost?"],
  ["craciun", "obiceiuri", "Ce se gătea la voi de Crăciun și cine o făcea cel mai bine?"],
  ["paste", "obiceiuri", "Cum se sărbătorea Paștele în familia voastră?"],
  ["cantec", "obiceiuri", "Ce cântec îți aduce aminte de tinerețe?"],
  ["mancare", "obiceiuri", "Ce mâncare de-a casei îți lipsește cel mai mult?"],
  ["obicei", "obiceiuri", "Ce obicei din familie ai vrea să nu se piardă?"],
  ["sfat", "invatat", "Ce sfat le dai strănepoților pe care n-o să-i cunoști?"],
  ["mandru", "invatat", "De ce ești cel mai mândru în viața ta?"],
  ["altfel", "invatat", "Ce ai face altfel, dacă ai lua-o de la capăt?"],
  ["om-bun", "invatat", "Cine a fost omul care te-a ajutat cel mai mult în viață?"],
];

/** Toate întrebările pentru un om, amestecate pe rând: una din arbore, una din istorie, una pentru oricine, și tot așa. */
export function questionsFor(ctx: QuestionContext): Question[] {
  const groups = [fromTree(ctx), fromHistory(ctx), ANY.map(([key, chapter, text]): Question => ({ key: `oricine.${key}`, chapter, text, kind: "any" }))]
    .map((list) => [...list].sort((a, b) => hash(ctx.me.id + a.key) - hash(ctx.me.id + b.key)));
  const out: Question[] = [];
  for (let i = 0; out.length < groups.reduce((n, g) => n + g.length, 0); i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

/** Săptămâna, numărată de la o duminică (4 ianuarie 2026, ora României): întrebarea se schimbă duminica. */
export const weekNumber = (now: Date) => Math.floor((now.getTime() - Date.UTC(2026, 0, 3, 22)) / (7 * 86_400_000));

/** Întrebarea săptămânii: cele la care a răspuns deja nu mai vin; „Altă întrebare” (`skip`) trece la următoarea. */
export function sundayQuestion(all: Question[], answered: Iterable<string>, now: Date, skip = 0): Question | null {
  const done = new Set(answered);
  const left = all.filter((q) => !done.has(q.key));
  if (!left.length) return null;
  const i = (((weekNumber(now) + skip) % left.length) + left.length) % left.length;
  return left[i];
}

/** FNV-1a: aceeași ordine pentru același om, alta pentru fratele lui. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

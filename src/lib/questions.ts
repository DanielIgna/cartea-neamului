/**
 * Întrebările din Lada cu amintiri. Nu pornesc de la o pagină goală: arborele știe cine i-au fost bunicii, unde s-a născut omul,
 * cu cine s-a căsătorit și în ce an s-a născut, așa că întrebările poartă numele și anii lui. Doi oameni din aceeași familie
 * primesc întrebări diferite. Totul e scris de mână, fără inteligență artificială și fără costuri; textele sunt în
 * Questions din src/i18n/messages/amintiri, în limba celui care răspunde.
 */
import type { getT } from "@/i18n/server";

/** Textele întrebărilor, în limba celui întrebat. */
export type QuestionsT = Awaited<ReturnType<typeof getT<"Questions">>>;

/** Numele capitolelor în română: aici pentru panoul de admin și pentru „Datele mele”; pe site vin din Lada.chapters. */
export const CHAPTER_LABELS = {
  copilaria: "Copilăria",
  scoala: "Școala",
  dragostea: "Dragostea",
  munca: "Munca",
  copiii: "Copiii",
  plecarea: "Plecări și drumuri",
  obiceiuri: "Obiceiuri",
  istoria: "Istoria mare",
  credinta: "Credința",
  invatat: "Ce am învățat",
  altele: "Alte amintiri",
} as const;
export type Chapter = keyof typeof CHAPTER_LABELS;

/** Capitolele poveștii, în ordinea în care se răsfoiesc. */
export const CHAPTERS: { key: Chapter; label: string }[] = Object.entries(CHAPTER_LABELS).map(([key, label]) => ({ key: key as Chapter, label }));
export const chapterLabel = (c: string) => CHAPTERS.find((x) => x.key === c)?.label ?? CHAPTER_LABELS.altele;
export const isChapter = (c: string): c is Chapter => CHAPTERS.some((x) => x.key === c);
/** Capitolul unei amintiri, pentru textele de pe site (unul necunoscut ajunge la „Alte amintiri”). */
export const chapterKey = (c: string): Chapter => (isChapter(c) ? c : "altele");

/** `carte`: întrebările din modelul de autobiografie (src/lib/autobiografie.ts), care nu vin și duminica. */
export type Question = { key: string; chapter: Chapter; text: string; kind: "tree" | "history" | "any" | "carte"; mentions?: string[] };
export type Who = { id: string; givenName: string; sex: "M" | "F" | "U"; birthYear: number | null; deathYear: number | null };
export type QuestionContext = {
  me: Who & { birthPlace: string | null; residencePlace: string | null; occupation: string | null };
  parents: Who[]; grandparents: Who[]; partners: Who[]; children: Who[]; siblings: Who[];
};

const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
/** „Ana, Ion și Maria”, cu „și”-ul limbii. */
export const andList = (xs: string[], locale = "ro") => new Intl.ListFormat(locale, { type: "conjunction" }).format(xs);
/** Sexul pentru textele cu forme de bărbat și de femeie: cine nu are sexul trecut primește forma obișnuită. */
const sx = (sex: Who["sex"]) => (sex === "F" ? "F" : "M");

/** Întrebările scrise din arbore: bunici, părinți, soț, copii, frați, locuri, meserie. */
function fromTree({ me, parents, grandparents, partners, children, siblings }: QuestionContext, t: QuestionsT, locale: string): Question[] {
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string) => out.push({ key, chapter, text, kind: "tree" });
  for (const g of grandparents) {
    if (!g.givenName) continue;
    const v = { sex: sx(g.sex), name: g.givenName };
    const neverMet = g.deathYear !== null && me.birthYear !== null && g.deathYear < me.birthYear;
    if (neverMet) q(`bunic.${g.id}`, "copilaria", t("tree.grandparentNeverMet", v));
    else {
      q(`bunic.${g.id}`, "copilaria", t("tree.grandparent", v));
      q(`bunic.${g.id}.invatat`, "invatat", t("tree.grandparentTaught", v));
    }
  }
  for (const p of parents) {
    if (!p.givenName) continue;
    q(`parinte.${p.id}.zi`, "copilaria", t("tree.parentDay", { sex: sx(p.sex), name: p.givenName }));
    q(`parinte.${p.id}.vorba`, "invatat", t("tree.parentSaying", { sex: sx(p.sex) }));
  }
  for (const s of partners) {
    if (!s.givenName) continue;
    q(`sot.${s.id}.cunoscut`, "dragostea", t("tree.spouseMet", { name: s.givenName }));
    q(`sot.${s.id}.nunta`, "dragostea", t("tree.spouseWedding", { name: s.givenName }));
  }
  for (const c of children) if (c.givenName) q(`copil.${c.id}.nastere`, "copiii", t("tree.childBorn", { name: c.givenName }));
  if (children.length) q("copii.pozne", "copiii", children.length === 1 ? t("tree.childPrank", { name: children[0].givenName }) : t("tree.childrenPrank"));
  const sibs = siblings.filter((s) => s.givenName).map((s) => s.givenName);
  if (sibs.length === 1) q("frati.impreuna", "copilaria", t("tree.siblingTogether", { name: sibs[0] }));
  else if (sibs.length > 1) q("frati.care", "copilaria", t("tree.siblingsWhich", { names: andList(sibs.slice(0, 6), locale) }));
  q("copilarie.casa", "copilaria", me.birthPlace ? t("tree.houseIn", { place: me.birthPlace }) : t("tree.house"));
  if (me.birthPlace && me.residencePlace && norm(me.birthPlace) !== norm(me.residencePlace))
    q("plecarea.de-ce", "plecarea", t("tree.leftWhy", { from: me.birthPlace, to: me.residencePlace }));
  // În română „Cum ai ajuns inginer?”; în celelalte limbi meseria stă după două puncte, cum a scris-o omul.
  if (me.occupation) q("munca.meserie", "munca", t("tree.job", { job: locale === "ro" ? me.occupation.trim().toLowerCase() : me.occupation.trim() }));
  return out;
}

/** Istoria mare, cu vârsta pe care o avea omul atunci. Fără anul nașterii nu le punem: n-am ști dacă le-a trăit. */
function fromHistory({ me }: QuestionContext, t: QuestionsT): Question[] {
  const born = me.birthYear;
  if (born === null) return [];
  const age = (year: number) => year - born;
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string) => out.push({ key, chapter, text, kind: "history" });
  if (age(1944) >= 4) q("istorie.razboi", "istoria", t("history.war", { age: age(1944) }));
  else if (born <= 1965) q("istorie.razboi", "istoria", t("history.warStories"));
  if (born <= 1955) q("istorie.colectivizare", "istoria", t("history.collectivization"));
  if (age(1969) >= 6) q("istorie.1969", "istoria", t("history.moon", { age: age(1969) }));
  if (age(1977) >= 5) q("istorie.1977", "istoria", t("history.earthquake", { age: age(1977) }));
  if (born >= 1945 && born <= 1980) q("istorie.tv", "istoria", t("history.tv"));
  if (age(1985) >= 8) q("istorie.cozi", "istoria", t("history.queues"));
  if (age(1989) >= 6) q("istorie.1989", "istoria", t("history.revolution", { age: age(1989) }));
  if (age(1990) >= 10) q("istorie.dupa1990", "istoria", t("history.after1990"));
  if (age(1994) >= 7) q("istorie.1994", "istoria", t("history.worldCup"));
  if (age(1999) >= 5) q("istorie.1999", "istoria", t("history.eclipse"));
  if (age(2020) >= 10) q("istorie.2020", "istoria", t("history.pandemic"));
  if (me.sex === "M" && born >= 1925 && born <= 1987) q("plecarea.armata", "plecarea", t("history.army"));
  if (born <= 1995) q("plecarea.strainatate", "plecarea", t("history.abroad"));
  return out;
}

/** Întrebări bune pentru oricine: cheia păstrată în baza de date, capitolul și textul (din Questions.any). */
const ANY = [
  ["prima-amintire", "copilaria", "firstMemory"],
  ["jocul", "copilaria", "game"],
  ["vara", "copilaria", "summer"],
  ["prieten-scoala", "scoala", "schoolFriend"],
  ["profesor", "scoala", "teacher"],
  ["drum-scoala", "scoala", "schoolRoad"],
  ["pozna-scoala", "scoala", "schoolPrank"],
  ["prima-dragoste", "dragostea", "firstLove"],
  ["cel-mai-frumos", "dragostea", "kindest"],
  ["primul-loc", "munca", "firstJob"],
  ["primul-salariu", "munca", "firstSalary"],
  ["anul-greu", "munca", "hardYear"],
  ["calatorie", "plecarea", "journey"],
  ["departe", "plecarea", "farAway"],
  ["craciun", "obiceiuri", "christmas"],
  ["paste", "obiceiuri", "easter"],
  ["cantec", "obiceiuri", "song"],
  ["mancare", "obiceiuri", "food"],
  ["obicei", "obiceiuri", "custom"],
  ["sfat", "invatat", "advice"],
  ["mandru", "invatat", "proud"],
  ["altfel", "invatat", "differently"],
  ["om-bun", "invatat", "helper"],
] as const satisfies readonly (readonly [string, Chapter, string])[];

/** Toate întrebările pentru un om, amestecate pe rând: una din arbore, una din istorie, una pentru oricine, și tot așa. */
export function questionsFor(ctx: QuestionContext, t: QuestionsT, locale = "ro"): Question[] {
  const sex = sx(ctx.me.sex);
  const any = ANY.map(([key, chapter, text]): Question => ({ key: `oricine.${key}`, chapter, text: t(`any.${text}`, { sex }), kind: "any" }));
  const groups = [fromTree(ctx, t, locale), fromHistory(ctx, t), any]
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

/**
 * Autobiografia: un model de carte care îl ia pe om de mână, capitol cu capitol, de la rădăcini până la ce lasă urmașilor.
 * Fiecare capitol are câteva rânduri care îl pornesc și întrebări: întâi cele ale cărții (aceleași pentru oricine, cu numele
 * și anii lui), apoi cele scrise din arbore și din istoria pe care a trăit-o (aceleași ca la întrebarea de duminică).
 * Răspunsurile sunt amintiri din lada lui, așa că se văd după aceleași reguli. Doar pentru cei în viață. Totul e scris de mână,
 * fără inteligență artificială; versetele sunt din Biblia Cornilescu, cu ortografia de azi.
 */
import { gendered, questionsFor, type Chapter, type Question, type QuestionContext } from "./questions";

export type Verse = { text: string; ref: string };

/** Motto-ul cărții. */
export const BOOK_VERSE: Verse = { text: "Învață-ne să ne numărăm bine zilele, ca să căpătăm o inimă înțeleaptă!", ref: "Psalmul 90:12" };
export const FAITH_VERSE: Verse = {
  text: "Și viața veșnică este aceasta: să Te cunoască pe Tine, singurul Dumnezeu adevărat, și pe Isus Hristos, pe care L-ai trimis Tu.", ref: "Ioan 17:3",
};
export const LAND_VERSE: Verse = {
  text: "dacă poporul Meu, peste care este chemat Numele Meu, se va smeri, se va ruga și va căuta Fața Mea, și se va abate de la căile lui rele, – îl voi asculta din ceruri, îi voi ierta păcatul, și-i voi tămădui țara.",
  ref: "2 Cronici 7:14",
};

export type BookChapter = { key: Chapter; title: string; intro: string; verse?: Verse };

/** Capitolele cărții, în ordinea vieții. „Alte amintiri” nu are întrebări: în carte vine la sfârșit, dacă e ceva în el. */
export const BOOK_CHAPTERS: BookChapter[] = [
  { key: "copilaria", title: "Rădăcini și copilărie", intro: "De unde vii: unde te-ai născut, cine erau ai tăi, casa și jocurile copilăriei." },
  { key: "scoala", title: "Școala", intro: "Învățătorii, colegii, drumul până la școală și ce ai învățat acolo." },
  { key: "dragostea", title: "Dragostea și căsătoria", intro: "Cum ți-ai găsit omul și cum v-ați început viața împreună." },
  { key: "munca", title: "Munca", intro: "Meseriile tale, oamenii de la care ai învățat și anii grei." },
  { key: "copiii", title: "Copiii", intro: "Venirea lor pe lume, poznele lor și ce ți-ai dorit pentru ei." },
  { key: "plecarea", title: "Drumuri și plecări", intro: "Armata, plecările de acasă și locurile în care ai trăit." },
  { key: "istoria", title: "Vremurile prin care am trecut", intro: "Istoria mare, așa cum ai trăit-o tu, cu vârsta pe care o aveai atunci: ce s-a putut spune și ce nu.", verse: LAND_VERSE },
  { key: "obiceiuri", title: "Obiceiurile casei", intro: "Sărbătorile, mâncarea și cântecele care țin familia laolaltă." },
  { key: "credinta", title: "Credința", intro: "Ce loc a avut Dumnezeu în viața ta. Dacă nu vrei să scrii despre asta, treci mai departe: e cartea ta.", verse: FAITH_VERSE },
  { key: "invatat", title: "Ce las urmașilor", intro: "Ce ai învățat din viață și ce vrei să rămână după tine, pentru cei care vin." },
];
export const OTHER_CHAPTER = { key: "altele" as const, title: "Alte amintiri" };

/** Titlul unui capitol în carte (și pentru amintirile scrise fără întrebare). */
export const bookChapterTitle = (c: string) => BOOK_CHAPTERS.find((x) => x.key === c)?.title ?? OTHER_CHAPTER.title;

/** „Ana, Ion și Maria” */
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);

/** Întrebările cărții: firul vieții, aceleași pentru oricine, cu ce știe arborele despre om. Credința are capitolul ei. */
export function bookQuestions(ctx: QuestionContext): Question[] {
  const { me, parents, partners, children } = ctx;
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string, mentions: string[] = []) =>
    out.push({ key: `carte.${key}`, chapter, text: gendered(text, me.sex), kind: "carte", ...(mentions.length ? { mentions } : {}) });
  const lived = (year: number) => me.birthYear !== null && me.birthYear <= year;

  q("nastere", "copilaria", me.birthPlace
    ? `Te-ai născut în ${me.birthPlace}${me.birthYear ? `, în ${me.birthYear}` : ""}. Ce ți s-a povestit despre ziua în care ai venit pe lume?`
    : "Unde și când te-ai născut? Ce ți s-a povestit despre ziua în care ai venit pe lume?");
  const dad = parents.find((p) => p.sex === "M" && p.givenName), mom = parents.find((p) => p.sex === "F" && p.givenName);
  q("parinti", "copilaria", dad && mom ? `Ce fel de oameni erau tatăl tău, ${dad.givenName}, și mama ta, ${mom.givenName}? Ce ai moștenit de la fiecare?`
    : dad ? `Ce fel de om era tatăl tău, ${dad.givenName}? Ce ai moștenit de la el?`
    : mom ? `Ce fel de om era mama ta, ${mom.givenName}? Ce ai moștenit de la ea?`
    : "Ce fel de oameni erau părinții tăi? Ce ai moștenit de la ei?", [dad?.id, mom?.id].filter((x): x is string => !!x));
  q("scoala", "scoala", "Unde ai făcut școala și până unde ai învățat? Ce ți-ar fi plăcut să mai înveți?");
  const spouse = partners.find((p) => p.givenName);
  if (spouse) q("impreuna", "dragostea", `Ce v-a ținut împreună, pe tine și pe ${spouse.givenName}, în anii grei?`, [spouse.id]);
  else q("drag", "dragostea", "Cine a fost omul cel mai drag inimii tale?");
  q("meserii", "munca", "Ce meserii ai avut de-a lungul vieții? Care ți-a plăcut cel mai mult?");
  const kids = children.filter((c) => c.givenName);
  if (kids.length) q("dorinta", "copiii", `Ce ți-ai dorit cel mai mult pentru ${kids.length <= 4 ? andList(kids.map((c) => c.givenName)) : "copiii tăi"}? S-a împlinit?`,
    kids.length <= 4 ? kids.map((c) => c.id) : []);
  q("casa", "plecarea", "În câte case ai locuit de-a lungul vieții? Care ți-a fost cea mai dragă?");
  q("schimbat", "istoria", "Ce întâmplare din istoria țării ți-a schimbat viața?");
  if (lived(1975)) q("comunism", "istoria", "Cum era să trăiești în comunism? Ce nu se putea spune cu voce tare și de cine vă era frică?");
  q("adevar", "istoria", "Când ai simțit că vi se spune minciuna în loc de adevăr? Cum ați deosebit una de alta?");
  q("sarbatoare", "obiceiuri", "Care era sărbătoarea cea mai așteptată în casa voastră? Cum o pregăteați?");
  // Credința: întrebări blânde, fiecare se poate lăsa deoparte.
  q("rugaciune", "credinta", "Cine te-a învățat prima rugăciune? Ți-o mai amintești?");
  q("duminica", "credinta", "Cum era duminica în casa părinților tăi? Unde mergeați la biserică?");
  q("hristos", "credinta", "Îl cunoști pe Domnul Isus Hristos? Cum L-ai cunoscut și ce s-a schimbat în viața ta de atunci?");
  q("biblia", "credinta", "Ce verset din Biblie te-a însoțit în viață? De ce tocmai acela?");
  q("ocrotit", "credinta", "A fost un moment în care ai simțit că Dumnezeu te-a ocrotit sau ți-a răspuns la rugăciune?");
  if (lived(1975)) q("prigoana", "credinta", "Cum ați păstrat credința în anii comunismului? Ați avut de suferit pentru ea?");
  q("credinta-urmasi", "credinta", "Ce ai vrea să știe urmașii tăi despre Dumnezeu și despre credința ta?");
  q("multumire", "invatat", "Cui îi mulțumești pentru viața pe care ai avut-o?");
  q("scrisoare", "invatat", "Dacă ai scrie o scrisoare strănepoților, ce le-ai spune în ea?");
  return out;
}

const KIND_ORDER: Record<Question["kind"], number> = { carte: 0, tree: 1, history: 2, any: 3 };

export type PlannedChapter = BookChapter & { questions: Question[] };

/**
 * Planul cărții pentru un om: capitolele, fiecare cu întrebările lui. Întâi cele ale cărții, apoi cele din arbore,
 * din istorie și cele pentru oricine (în ordinea lor de la duminică, care diferă de la om la om). Fără dubluri.
 * Un capitol fără întrebări (de pildă „Copiii”, la cine n-are copii în arbore) nu apare.
 */
export function bookPlan(ctx: QuestionContext): PlannedChapter[] {
  const all = [...bookQuestions(ctx), ...questionsFor(ctx)];
  const seen = new Set<string>();
  const unique = all.filter((q) => !seen.has(q.key) && !!seen.add(q.key));
  return BOOK_CHAPTERS.map((c) => ({
    ...c,
    questions: unique.map((q, i) => ({ q, i })).filter(({ q }) => q.chapter === c.key)
      .sort((a, b) => KIND_ORDER[a.q.kind] - KIND_ORDER[b.q.kind] || a.i - b.i).map(({ q }) => q),
  })).filter((c) => c.questions.length);
}

/** Cât e scris din carte: întrebările la care a răspuns, din toate, pe capitole și în total. */
export function bookProgress(plan: PlannedChapter[], answered: Iterable<string>) {
  const done = new Set(answered);
  const chapters = plan.map((c) => ({ key: c.key, done: c.questions.filter((q) => done.has(q.key)).length, total: c.questions.length }));
  return { chapters, done: chapters.reduce((n, c) => n + c.done, 0), total: chapters.reduce((n, c) => n + c.total, 0) };
}

/** Întrebările cărții la rând, fără cele la care a răspuns: pentru modul „la bunici”, cu modelul de carte. */
export const bookQueue = (plan: PlannedChapter[], answered: Iterable<string>) => {
  const done = new Set(answered);
  return plan.flatMap((c) => c.questions).filter((q) => !done.has(q.key));
};

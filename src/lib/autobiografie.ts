/**
 * Autobiografia: un model de carte care îl ia pe om de mână, capitol cu capitol, de la rădăcini până la ce lasă urmașilor.
 * Fiecare capitol are câteva rânduri care îl pornesc și întrebări: întâi cele ale cărții (aceleași pentru oricine, cu numele
 * și anii lui), apoi cele scrise din arbore și din istoria pe care a trăit-o (aceleași ca la întrebarea de duminică).
 * Răspunsurile sunt amintiri din lada lui, așa că se văd după aceleași reguli. Doar pentru cei în viață. Totul e scris de mână,
 * fără inteligență artificială. Textele sunt în Questions (src/i18n/messages/amintiri); versetele, din Biblia clasică
 * a fiecărei limbi (în română, Cornilescu cu ortografia de azi).
 */
import { andList, questionsFor, type Chapter, type Question, type QuestionContext, type QuestionsT } from "./questions";

export type Verse = { text: string; ref: string };
export type VerseKey = "book" | "faith" | "land";
/** Motto-ul cărții (`book`), Ioan 17:3 la credință (`faith`) și 2 Cronici 7:14 la vremuri (`land`). */
export const verse = (t: QuestionsT, key: VerseKey): Verse => ({ text: t(`verses.${key}.text`), ref: t(`verses.${key}.ref`) });

export type BookChapterKey = Exclude<Chapter, "altele">;
export type BookChapter = { key: BookChapterKey; title: string; intro: string; verse?: Verse };

/** Capitolele cărții, în ordinea vieții. „Alte amintiri” nu are întrebări: în carte vine la sfârșit, dacă e ceva în el. */
export const BOOK_CHAPTER_KEYS: BookChapterKey[] = ["copilaria", "scoala", "dragostea", "munca", "copiii", "plecarea", "istoria", "obiceiuri", "credinta", "invatat"];
const CHAPTER_VERSE: Partial<Record<BookChapterKey, VerseKey>> = { istoria: "land", credinta: "faith" };

/** Capitolele cărții, cu titlul, rândurile de început și versetul lor, în limba cititorului. */
export function bookChapters(t: QuestionsT): BookChapter[] {
  return BOOK_CHAPTER_KEYS.map((key) => {
    const v = CHAPTER_VERSE[key];
    return { key, title: t(`chapters.${key}.title`), intro: t(`chapters.${key}.intro`), ...(v ? { verse: verse(t, v) } : {}) };
  });
}

/** Titlul unui capitol în carte (și pentru amintirile scrise fără întrebare, care ajung la „Alte amintiri”). */
export const bookChapterTitle = (t: QuestionsT, c: string) =>
  (BOOK_CHAPTER_KEYS as string[]).includes(c) ? t(`chapters.${c as BookChapterKey}.title`) : t("otherChapter");

/** Întrebările cărții: firul vieții, aceleași pentru oricine, cu ce știe arborele despre om. Credința are capitolul ei. */
export function bookQuestions(ctx: QuestionContext, t: QuestionsT, locale = "ro"): Question[] {
  const { me, parents, partners, children } = ctx;
  const out: Question[] = [];
  const q = (key: string, chapter: Chapter, text: string, mentions: string[] = []) =>
    out.push({ key: `carte.${key}`, chapter, text, kind: "carte", ...(mentions.length ? { mentions } : {}) });
  const lived = (year: number) => me.birthYear !== null && me.birthYear <= year;

  q("nastere", "copilaria", me.birthPlace
    ? (me.birthYear ? t("book.bornPlaceYear", { place: me.birthPlace, year: String(me.birthYear) }) : t("book.bornPlace", { place: me.birthPlace }))
    : t("book.bornUnknown"));
  const dad = parents.find((p) => p.sex === "M" && p.givenName), mom = parents.find((p) => p.sex === "F" && p.givenName);
  q("parinti", "copilaria", dad && mom ? t("book.parentsBoth", { father: dad.givenName, mother: mom.givenName })
    : dad ? t("book.parentsFather", { name: dad.givenName })
    : mom ? t("book.parentsMother", { name: mom.givenName })
    : t("book.parentsNone"), [dad?.id, mom?.id].filter((x): x is string => !!x));
  q("scoala", "scoala", t("book.school"));
  const spouse = partners.find((p) => p.givenName);
  if (spouse) q("impreuna", "dragostea", t("book.together", { name: spouse.givenName }), [spouse.id]);
  else q("drag", "dragostea", t("book.dearest"));
  q("meserii", "munca", t("book.trades"));
  const kids = children.filter((c) => c.givenName);
  if (kids.length) q("dorinta", "copiii", kids.length <= 4 ? t("book.wish", { names: andList(kids.map((c) => c.givenName), locale) }) : t("book.wishChildren"),
    kids.length <= 4 ? kids.map((c) => c.id) : []);
  q("casa", "plecarea", t("book.houses"));
  q("schimbat", "istoria", t("book.changed"));
  if (lived(1975)) q("comunism", "istoria", t("book.communism"));
  q("adevar", "istoria", t("book.truth"));
  q("sarbatoare", "obiceiuri", t("book.feast"));
  // Credința: întrebări blânde, fiecare se poate lăsa deoparte.
  q("rugaciune", "credinta", t("book.prayer"));
  q("duminica", "credinta", t("book.sunday"));
  q("hristos", "credinta", t("book.christ"));
  q("mantuitor", "credinta", t("book.saviour"));
  q("biblia", "credinta", t("book.bible"));
  q("ocrotit", "credinta", t("book.protected"));
  if (lived(1975)) q("prigoana", "credinta", t("book.persecution"));
  q("credinta-urmasi", "credinta", t("book.faithHeirs"));
  q("intrebare", "credinta", t("book.question"));
  q("multumire", "invatat", t("book.thanks"));
  q("scrisoare", "invatat", t("book.letter"));
  return out;
}

const KIND_ORDER: Record<Question["kind"], number> = { carte: 0, tree: 1, history: 2, any: 3 };

export type PlannedChapter = BookChapter & { questions: Question[] };

/**
 * Planul cărții pentru un om: capitolele, fiecare cu întrebările lui. Întâi cele ale cărții, apoi cele din arbore,
 * din istorie și cele pentru oricine (în ordinea lor de la duminică, care diferă de la om la om). Fără dubluri.
 * Un capitol fără întrebări (de pildă „Copiii”, la cine n-are copii în arbore) nu apare.
 */
export function bookPlan(ctx: QuestionContext, t: QuestionsT, locale = "ro"): PlannedChapter[] {
  const all = [...bookQuestions(ctx, t, locale), ...questionsFor(ctx, t, locale)];
  const seen = new Set<string>();
  const unique = all.filter((q) => !seen.has(q.key) && !!seen.add(q.key));
  return bookChapters(t).map((c) => ({
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

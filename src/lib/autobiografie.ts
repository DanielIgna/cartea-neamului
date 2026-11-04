import { questionsFor, type Chapter, type QuestionContext } from "./questions";

/**
 * Autobiografia: un model de carte care te duce de mână, capitol cu capitol, cu câteva întrebări la fiecare.
 * Răspunsurile sunt amintiri obișnuite din lada omului, așa că apar și pe profil, după cum alege el.
 * E doar pentru cei în viață, care își scriu singuri cartea; capitolul despre credință e la fel de liber ca toate celelalte.
 */
export type BookQuestion = { key: string; text: string };
export type BookChapter = { chapter: Chapter; title: string; intro: string; questions: BookQuestion[] };

const MODEL: { chapter: Chapter; title: string; intro: string; questions: [string, string][] }[] = [
  { chapter: "copilaria", title: "De unde am pornit", intro: "Începe cu locul și oamenii de la care ai pornit.", questions: [
    ["casa", "Cum arăta casa în care ai copilărit? Ce vedeai pe fereastră?"],
    ["parinti", "Ce fel de oameni erau părinții tăi? Ce ai luat de la ei?"],
    ["amintire", "Care e cea mai veche amintire a ta?"],
  ] },
  { chapter: "scoala", title: "Anii de școală", intro: "Cine te-a învățat și ce ți-a rămas.", questions: [
    ["dascal", "Ce dascăl ți-a schimbat felul de a vedea lumea?"],
    ["visat", "Ce visai să te faci, când erai {mic|mică}?"],
  ] },
  { chapter: "dragostea", title: "Dragostea și familia", intro: "Cu cine ți-ai împărțit viața.", questions: [
    ["cunoscut", "Cum ai cunoscut omul cu care ți-ai legat viața?"],
    ["greu", "Ce v-a ținut împreună în anii grei?"],
  ] },
  { chapter: "munca", title: "Munca mea", intro: "Ce ai lucrat și ce a însemnat pentru tine.", questions: [
    ["drum", "Cum ai ajuns la meseria ta?"],
    ["mandrie", "Ce lucru făcut cu mâinile sau cu mintea ta te bucură și azi?"],
  ] },
  { chapter: "copiii", title: "Copiii și casa mea", intro: "Ce ai vrut să le dai celor de după tine.", questions: [
    ["venit", "Cum s-a schimbat viața ta când ai devenit {părinte|mamă}? Dacă n-ai copii, cine ți-a fost aproape ca un copil?"],
    ["dat", "Ce ai vrut să le dai copiilor și n-ai avut tu?"],
  ] },
  { chapter: "plecarea", title: "Drumurile mele", intro: "Plecările, întoarcerile și locurile care te-au schimbat.", questions: [
    ["plecat", "Ce loc ai părăsit și cu ce gând?"],
    ["acasa", "Unde te simți cu adevărat acasă?"],
  ] },
  { chapter: "istoria", title: "Vremurile prin care am trecut", intro: "Istoria mare, așa cum ai trăit-o tu.", questions: [
    ["vremuri", "Ce întâmplare din istoria țării ți-a schimbat viața?"],
    ["frica", "Ți-a fost vreodată frică să spui ce gândești? Povestește."],
  ] },
  { chapter: "credinta", title: "Credința mea", intro: "Răspunzi doar dacă vrei și cât vrei. Nimeni nu vede răspunsurile tale până nu alegi tu.", questions: [
    ["primul", "Cine ți-a vorbit prima dată despre Dumnezeu?"],
    ["cunosc", "Îl cunoști pe Isus Hristos? Cum L-ai cunoscut?"],
    ["nastere", "A fost un moment în care L-ai primit ca Mântuitor personal? Cum a schimbat viața ta?"],
    ["verset", "Ce verset din Biblie te-a însoțit și de ce?"],
    ["intrebare", "Dacă nu L-ai cunoscut încă: ce I-ai spune sau ce L-ai întreba?"],
  ] },
  { chapter: "invatat", title: "Ce las în urmă", intro: "Pentru cei care vor citi cartea peste ani.", questions: [
    ["invatat", "Ce ai învățat din viață și ți-ar fi prins bine să știi la 20 de ani?"],
    ["urmasi", "Ce vrei să știe urmașii tăi despre tine?"],
  ] },
];

const gendered = (text: string, sex: QuestionContext["me"]["sex"]) => text.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m: string, f: string) => (sex === "F" ? f : m));

/** Modelul cărții pentru cineva: întrebările de bază și, la fiecare capitol, cel mult două scrise din arborele lui. */
export function bookFor(ctx: QuestionContext): BookChapter[] {
  const fromTree = questionsFor(ctx).filter((q) => q.kind === "tree");
  return MODEL.map((c) => ({
    chapter: c.chapter, title: c.title, intro: c.intro,
    questions: [
      ...c.questions.map(([key, text]) => ({ key: `carte.${c.chapter}.${key}`, text: gendered(text, ctx.me.sex) })),
      ...fromTree.filter((q) => q.chapter === c.chapter).slice(0, 2).map((q) => ({ key: q.key, text: q.text })),
    ],
  }));
}

/** Câte întrebări din model au primit răspuns. */
export function bookProgress(book: BookChapter[], answered: Iterable<string>) {
  const done = new Set(answered);
  const all = book.flatMap((c) => c.questions);
  return { done: all.filter((q) => done.has(q.key)).length, total: all.length };
}

export const FAITH_VERSE = {
  text: "Și viața veșnică este aceasta: să Te cunoască pe Tine, singurul Dumnezeu adevărat, și pe Isus Hristos, pe care L-ai trimis Tu.",
  ref: "Ioan 17:3",
  href: "https://www.bible.com/ro/bible/191/JHN.17.VDC",
};

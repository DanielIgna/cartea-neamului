import { describe, it, expect } from "vitest";
import { BOOK_CHAPTERS, FAITH_VERSE, LAND_VERSE, bookChapterTitle, bookPlan, bookProgress, bookQuestions, bookQueue } from "@/lib/autobiografie";
import { CHAPTERS, isChapter, questionsFor, type QuestionContext } from "@/lib/questions";

const who = (id: string, givenName: string, sex: "M" | "F", birthYear: number | null, deathYear: number | null = null) => ({ id, givenName, sex, birthYear, deathYear });
const me = (birthYear: number | null, sex: "M" | "F" = "M", birthPlace: string | null = "Huedin"): QuestionContext["me"] =>
  ({ ...who("eu", "Ioan", sex, birthYear), birthPlace, residencePlace: "Cluj-Napoca", occupation: "Inginer" });
const ctx: QuestionContext = {
  me: me(1965),
  parents: [who("tata", "Avram", "M", 1938), who("mama", "Floarea", "F", 1942)],
  grandparents: [who("bunic", "Majel", "M", 1910, 1988)],
  partners: [who("sotie", "Maria", "F", 1968)], children: [who("fiu", "Andrei", "M", 1992), who("fiica", "Ana", "F", 1995)], siblings: [who("frate", "Nicolae", "M", 1967)],
};

describe("autobiografia: modelul de carte", () => {
  const plan = bookPlan(ctx);
  const q = (key: string) => plan.flatMap((c) => c.questions).find((x) => x.key === key);

  it("are capitolele vieții în ordine, iar credința e un capitol al ei, care se poate scrie și în lada cu amintiri", () => {
    expect(plan.map((c) => c.key)).toEqual(BOOK_CHAPTERS.map((c) => c.key));
    expect(plan.map((c) => c.key)).toContain("credinta");
    expect(isChapter("credinta")).toBe(true);
    expect(CHAPTERS.findIndex((c) => c.key === "credinta")).toBeLessThan(CHAPTERS.findIndex((c) => c.key === "invatat"));
    expect(bookChapterTitle("credinta")).toBe("Credința");
    expect(bookChapterTitle("altele")).toBe("Alte amintiri");
    for (const c of plan) expect(c.questions.length, c.key).toBeGreaterThan(0);
  });

  it("întreabă dacă Îl cunoaște pe Hristos, cu Ioan 17:3 la capitolul credinței și 2 Cronici 7:14 la vremuri", () => {
    expect(q("carte.hristos")?.text).toBe("Îl cunoști pe Domnul Isus Hristos? Cum L-ai cunoscut și ce s-a schimbat în viața ta de atunci?");
    expect(q("carte.hristos")?.chapter).toBe("credinta");
    expect(plan.find((c) => c.key === "credinta")?.verse).toEqual(FAITH_VERSE);
    expect(FAITH_VERSE.ref).toBe("Ioan 17:3");
    expect(plan.find((c) => c.key === "istoria")?.verse).toEqual(LAND_VERSE);
    expect(LAND_VERSE.text).toContain("îl voi asculta din ceruri, îi voi ierta păcatul, și-i voi tămădui țara");
  });

  it("pune numele din arbore în întrebări și îi leagă pe cei pomeniți", () => {
    expect(q("carte.nastere")?.text).toBe("Te-ai născut în Huedin, în 1965. Ce ți s-a povestit despre ziua în care ai venit pe lume?");
    expect(q("carte.parinti")?.text).toBe("Ce fel de oameni erau tatăl tău, Avram, și mama ta, Floarea? Ce ai moștenit de la fiecare?");
    expect(q("carte.parinti")?.mentions).toEqual(["tata", "mama"]);
    expect(q("carte.impreuna")?.mentions).toEqual(["sotie"]);
    expect(q("carte.dorinta")?.text).toBe("Ce ți-ai dorit cel mai mult pentru Andrei și Ana? S-a împlinit?");
    expect(q("carte.drag")).toBeUndefined();
  });

  it("cei născuți după 1975 nu sunt întrebați despre comunism, iar fără loc și an întrebarea nașterii e generală", () => {
    const young = bookQuestions({ ...ctx, me: me(1990, "F", null) }).map((x) => x.key);
    expect(young).not.toContain("carte.comunism");
    expect(young).not.toContain("carte.prigoana");
    expect(bookQuestions(ctx).map((x) => x.key)).toContain("carte.prigoana");
    expect(bookQuestions({ ...ctx, me: me(null, "M", null) }).find((x) => x.key === "carte.nastere")?.text)
      .toBe("Unde și când te-ai născut? Ce ți s-a povestit despre ziua în care ai venit pe lume?");
    const single = bookQuestions({ ...ctx, partners: [], children: [] }).map((x) => x.key);
    expect(single).toContain("carte.drag");
    expect(single).not.toContain("carte.dorinta");
    // Fără copii în arbore, capitolul „Copiii” nu apare deloc (n-ar avea nicio întrebare).
    expect(bookPlan({ ...ctx, children: [] }).map((c) => c.key)).not.toContain("copiii");
  });

  it("în fiecare capitol vin întâi întrebările cărții, apoi cele de duminică, fără dubluri; credința nu vine duminica", () => {
    const keys = plan.flatMap((c) => c.questions.map((x) => x.key));
    expect(new Set(keys).size).toBe(keys.length);
    for (const c of plan) {
      const kinds = c.questions.map((x) => x.kind);
      const firstOther = kinds.findIndex((k) => k !== "carte");
      if (firstOther >= 0) expect(kinds.slice(firstOther)).not.toContain("carte");
    }
    // Toate întrebările de duminică au loc în carte (afară de cele fără capitol în ea).
    const sunday = questionsFor(ctx).filter((x) => BOOK_CHAPTERS.some((c) => c.key === x.chapter));
    expect(sunday.every((x) => keys.includes(x.key))).toBe(true);
    expect(questionsFor(ctx).some((x) => x.chapter === "credinta")).toBe(false);
  });

  it("socotește cât e scris și dă la rând întrebările rămase, pentru modul „la bunici”", () => {
    const answered = ["carte.nastere", "carte.hristos", "nu-e-in-carte"];
    const p = bookProgress(plan, answered);
    expect(p.done).toBe(2);
    expect(p.total).toBe(plan.reduce((n, c) => n + c.questions.length, 0));
    expect(p.chapters.find((c) => c.key === "credinta")?.done).toBe(1);
    const queue = bookQueue(plan, answered);
    expect(queue.length).toBe(p.total - 2);
    expect(queue[0].chapter).toBe("copilaria");
    expect(queue.map((x) => x.key)).not.toContain("carte.hristos");
  });
});

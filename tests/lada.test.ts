import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship, treeMember, user, memory, memoryMention, memoryQuestion, memoryReply } from "@/db/schema";
import { buildGraph, type Graph } from "@/lib/kinship";
import { canSee, questionContext, yearIn, type MemoryAccess } from "@/lib/lada";
import { loadLada } from "@/lib/lada-db";
import { questionsFor, sundayQuestion, weekNumber, type QuestionContext } from "@/lib/questions";

const who = (id: string, givenName: string, sex: "M" | "F", birthYear: number | null, deathYear: number | null = null) => ({ id, givenName, sex, birthYear, deathYear });
const me = (birthYear: number | null, sex: "M" | "F" = "M"): QuestionContext["me"] => ({ ...who("eu", "Ioan", sex, birthYear), birthPlace: "Huedin", residencePlace: "Cluj-Napoca", occupation: "Inginer" });

describe("întrebarea de duminică", () => {
  const ctx: QuestionContext = {
    me: me(1965),
    parents: [who("tata", "Avram", "M", 1938), who("mama", "Floarea", "F", 1942)],
    grandparents: [who("bunic", "Majel", "M", 1910, 1988), who("bunica", "Ana", "F", 1915, 1960)],
    partners: [who("sotie", "Maria", "F", 1968)], children: [who("fiu", "Andrei", "M", 1992)], siblings: [who("sora", "Elena", "F", 1967)],
  };
  const all = questionsFor(ctx);
  const text = (key: string) => all.find((q) => q.key === key)?.text;

  it("scrie întrebările din arbore cu numele și genul fiecăruia", () => {
    expect(text("bunic.bunic")).toBe("Ce îți amintești despre bunicul Majel?");
    // Bunica a murit înainte să se nască el: întrebarea e despre ce povesteau ceilalți.
    expect(text("bunic.bunica")).toBe("Ce povesteau ai tăi despre bunica Ana? Tu n-ai mai apucat-o.");
    expect(text("bunic.bunica.invatat")).toBeUndefined();
    expect(text("parinte.mama.zi")).toContain("mama ta, Floarea");
    expect(text("sot.sotie.cunoscut")).toBe("Cum v-ați cunoscut tu și Maria? Cine a făcut primul pas?");
    expect(text("frati.impreuna")).toContain("tu și Elena");
    expect(text("plecarea.de-ce")).toBe("De ce ai plecat din Huedin la Cluj-Napoca? Cum a fost la început?");
    expect(text("munca.meserie")).toBe("Cum ai ajuns inginer? Cine te-a învățat meseria?");
  });

  it("pune doar întrebările din istorie pe care omul le-a putut trăi", () => {
    expect(text("istorie.1977")).toBe("Aveai 12 ani la cutremurul din 4 martie 1977. Unde erai în seara aceea?");
    expect(text("plecarea.armata")).toBeDefined();
    const young = questionsFor({ ...ctx, me: me(2005, "F") }).map((q) => q.key);
    expect(young).toContain("istorie.2020");
    expect(young).not.toContain("istorie.1989");
    expect(young).not.toContain("istorie.colectivizare");
    expect(young).not.toContain("plecarea.armata");
    expect(questionsFor({ ...ctx, me: me(null) }).some((q) => q.kind === "history")).toBe(false);
  });

  it("amestecă întrebările: una din arbore, una din istorie, una pentru oricine", () => {
    expect(all.slice(0, 3).map((q) => q.kind)).toEqual(["tree", "history", "any"]);
    expect(new Set(all.map((q) => q.key)).size).toBe(all.length);
  });

  it("se schimbă duminica la miezul nopții (ora României) și nu mai vine la ce a răspuns", () => {
    const sat = new Date("2026-11-07T21:59:00Z"), sun = new Date("2026-11-07T22:00:00Z");
    expect(weekNumber(sun)).toBe(weekNumber(sat) + 1);
    const a = sundayQuestion(all, [], sat)!, b = sundayQuestion(all, [], sun)!;
    expect(a.key).not.toBe(b.key);
    expect(sundayQuestion(all, [], sat, 1)!.key).toBe(b.key);
    expect(sundayQuestion(all, [a.key], sat)!.key).not.toBe(a.key);
    expect(sundayQuestion(all, all.map((q) => q.key), sun)).toBeNull();
  });

  it("citește anul din ce scrie omul la „Când”", () => {
    expect(yearIn("vara lui 1965")).toBe(1965);
    expect(yearIn("cca. 1970, la bunici")).toBe(1970);
    expect(yearIn("demult")).toBeNull();
  });
});

let db: Db, treeId: string, g: Graph;
const P: Record<string, string> = {};
const M: Record<string, string> = {};
const Q: Record<string, string> = {};

/** Bunicul cu doi fii; „eu” cu soția, vărul primar (gradul IV) și fiul vărului (gradul V). Tata e în arbore fără fișă revendicată. */
beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Lada", chatMaxDegree: 4 }).returning();
  treeId = t.id;
  for (const [k, sex, born] of [["bunic", "M", "1910"], ["tata", "M", "1938"], ["unchi", "M", "1940"], ["eu", "M", "1965"], ["sotie", "F", "1968"], ["var", "M", "1966"], ["fiulVar", "M", "1995"]] as const) {
    const [p] = await db.insert(person).values({ treeId, givenName: k, surname: "Igna", sex, birthDateText: born, living: k !== "bunic" }).returning();
    P[k] = p.id;
  }
  const pc = (a: string, b: string) => ({ treeId, type: "parent_child" as const, personA: P[a], personB: P[b] });
  const rels = [pc("bunic", "tata"), pc("bunic", "unchi"), pc("tata", "eu"), pc("unchi", "var"), pc("var", "fiulVar"), { treeId, type: "partnership" as const, personA: P.eu, personB: P.sotie }];
  await db.insert(relationship).values(rels);
  for (const u of ["eu", "sotie", "var", "fiulVar", "tata"]) {
    await db.insert(user).values({ id: `u-${u}`, name: `Cont ${u}`, email: `${u}@test.ro` });
    await db.insert(treeMember).values({ treeId, userId: `u-${u}`, role: u === "eu" ? "owner" : "contributor" });
    if (u !== "tata") await db.update(person).set({ claimedByUserId: `u-${u}` }).where(eq(person.id, P[u]));
  }
  g = buildGraph(Object.entries(P).map(([, id]) => ({ id, sex: "M" as const })), rels.map((r) => ({ type: r.type, a: r.personA, b: r.personB })));

  const ask = async (k: string, by: string, text: string, dismissed = false) => {
    const [q] = await db.insert(memoryQuestion).values({ treeId, personId: P.eu, askedBy: `u-${by}`, text, dismissed }).returning();
    Q[k] = q.id;
  };
  await ask("fiulVar", "fiulVar", "Unchiule, cum era bunicul Majel?");
  await ask("var", "var", "Mai știi cum am furat cireșe?");
  await ask("sotie", "sotie", "Ce ți-a plăcut prima dată la mine?", true);
  const write = async (k: string, v: Partial<typeof memory.$inferInsert>, mentions: string[] = [], owner = "eu") => {
    const [m] = await db.insert(memory).values({ treeId, personId: P[owner], authorId: `u-${owner}`, body: k, ...v }).returning();
    M[k] = m.id;
    for (const pid of mentions) await db.insert(memoryMention).values({ memoryId: m.id, personId: P[pid] });
  };
  await write("pentruToti", { visibility: "tree", chapter: "copilaria", questionKey: "copilarie.casa" }, ["tata", "var"]);
  await write("apropiati", { visibility: "close", maxDegree: 2 });
  await write("ciorna", { visibility: "private" });
  await write("doarLuiFiulVar", { visibility: "asker", askedId: Q.fiulVar, question: "Unchiule, cum era bunicul Majel?" });
  await db.update(memoryQuestion).set({ memoryId: M.doarLuiFiulVar }).where(eq(memoryQuestion.id, Q.fiulVar));
  await write("dinLadaVarului", { visibility: "tree" }, ["eu"], "var");
  await db.insert(memoryReply).values({ memoryId: M.pentruToti, authorId: "u-var", body: "Și eu îmi amintesc!" });
});

describe("cine vede o amintire", () => {
  const m = (v: Partial<MemoryAccess>): MemoryAccess => ({ personId: P.eu, authorId: "u-eu", visibility: "tree", maxDegree: null, ...v });
  const view = (k: string) => ({ userId: `u-${k}`, personId: k === "tata" ? null : P[k] });

  it("ciorna o văd doar autorul și omul din ladă", () => {
    expect(canSee(m({ visibility: "private" }), view("eu"), g, 4, "u-eu")).toBe(true);
    expect(canSee(m({ visibility: "private" }), view("sotie"), g, 4, "u-eu")).toBe(false);
  });

  it("familia apropiată: rudele până la grad, soții mereu; cine n-are fișă nu", () => {
    const close = m({ visibility: "close", maxDegree: 2 });
    expect(canSee(close, view("sotie"), g, 4, "u-eu")).toBe(true);
    expect(canSee(close, view("var"), g, 4, "u-eu")).toBe(false);
    expect(canSee(close, view("tata"), g, 4, "u-eu")).toBe(false);
    expect(canSee(m({ visibility: "close" }), view("var"), g, 4, "u-eu")).toBe(true);
    expect(canSee(m({ visibility: "close" }), view("fiulVar"), g, 4, "u-eu")).toBe(false);
  });

  it("cine a întrebat vede răspunsul, chiar dacă e mai departe de gradul ales", () => {
    expect(canSee(m({ visibility: "asker", askedBy: "u-fiulVar" }), view("fiulVar"), g, 4, "u-eu")).toBe(true);
    expect(canSee(m({ visibility: "asker", askedBy: "u-fiulVar" }), view("var"), g, 4, "u-eu")).toBe(false);
    expect(canSee(m({ visibility: "close", maxDegree: 1, askedBy: "u-fiulVar" }), view("fiulVar"), g, 4, "u-eu")).toBe(true);
    expect(canSee(m({ visibility: "private", askedBy: "u-fiulVar" }), view("fiulVar"), g, 4, "u-eu")).toBe(false);
  });
});

describe("lada pe profil", () => {
  const lada = (k: string, of = "eu") => loadLada(db, treeId, P[of], { userId: `u-${k}`, personId: k === "tata" ? null : P[k] }, g, 4);
  const bodies = (xs: { body: string }[]) => xs.map((x) => x.body).sort();

  it("omul își vede toată lada, cu toate întrebările și ce a răspuns deja", async () => {
    const l = await lada("eu");
    expect(l.isOwner).toBe(true);
    expect(bodies(l.own)).toEqual(["apropiati", "ciorna", "doarLuiFiulVar", "pentruToti"]);
    expect(l.questions.map((q) => q.text).sort()).toHaveLength(3);
    expect(l.answeredKeys).toEqual(["copilarie.casa"]);
    expect(l.own.find((x) => x.body === "pentruToti")!.replies[0]).toMatchObject({ body: "Și eu îmi amintesc!", author: { name: "var Igna", personId: P.var } });
    expect(l.own.find((x) => x.body === "doarLuiFiulVar")!.askedBy).toMatchObject({ name: "fiulVar Igna" });
  });

  it("ceilalți văd doar ce li s-a dat voie, și doar întrebările lor", async () => {
    expect(bodies((await lada("sotie")).own)).toEqual(["apropiati", "pentruToti"]);
    const v = await lada("var");
    expect(bodies(v.own)).toEqual(["pentruToti"]);
    expect(v.questions.map((q) => q.text)).toEqual(["Mai știi cum am furat cireșe?"]);
    expect(v.isOwner).toBe(false);
    expect(v.answeredKeys).toEqual([]);
    expect(bodies((await lada("fiulVar")).own)).toEqual(["doarLuiFiulVar", "pentruToti"]);
    expect(bodies((await lada("tata")).own)).toEqual(["pentruToti"]);
  });

  it("amintirea apare și pe profilurile celor pomeniți", async () => {
    expect(bodies((await lada("sotie", "tata")).about)).toEqual(["pentruToti"]);
    expect(bodies((await lada("sotie", "var")).about)).toEqual(["pentruToti"]);
    expect(bodies((await lada("sotie", "eu")).about)).toEqual(["dinLadaVarului"]);
  });

  it("cel pomenit o poate ascunde de pe profilul lui: ceilalți n-o mai văd acolo, el și autorul da", async () => {
    await db.update(memoryMention).set({ hidden: true }).where(eq(memoryMention.memoryId, M.dinLadaVarului));
    expect((await lada("sotie")).about).toEqual([]);
    expect(bodies((await lada("eu")).about)).toEqual(["dinLadaVarului"]);
    expect(bodies((await lada("var")).about)).toEqual(["dinLadaVarului"]);
    // În lada vărului rămâne pentru toți.
    expect(bodies((await lada("sotie", "var")).own)).toEqual(["dinLadaVarului"]);
  });
});

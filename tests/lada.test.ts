import { describe, it, expect, beforeAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship, treeMember, user, memory, memoryMention, memoryQuestion, memoryReply, document, documentLink } from "@/db/schema";
import { buildGraph, type Graph } from "@/lib/kinship";
import { canSee, questionContext, yearIn, type MemoryAccess } from "@/lib/lada";
import { canOpenDocument, excerpt, loadLada, memoryMediaIds } from "@/lib/lada-db";
import { loadTreeMap } from "@/lib/map-data";
import { fileType } from "@/lib/file-type";
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

  it("vorbește cu fiecare la genul lui", () => {
    const her = questionsFor({ ...ctx, me: me(1961, "F") });
    expect(her.find((q) => q.key === "oricine.jocul")!.text).toBe("Care era jocul tău preferat când erai mică?");
    expect(her.find((q) => q.key === "oricine.mandru")!.text).toBe("De ce ești cea mai mândră în viața ta?");
    expect(text("oricine.mandru")).toBe("De ce ești cel mai mândru în viața ta?");
    expect(all.some((q) => /[{}|]/.test(q.text))).toBe(false);
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

describe("glasul și modul „la bunici”", () => {
  const lada = (k: string, of: string) => loadLada(db, treeId, P[of], { userId: `u-${k}`, personId: k === "tata" ? null : P[k] }, g, 4);

  it("recunoaște înregistrările din telefon și mesajele vocale fără tip", () => {
    expect(fileType({ type: "audio/webm;codecs=opus", name: "glas.webm" })).toBe("audio/webm");
    expect(fileType({ type: "", name: "PTT-20261104-WA0003.opus" })).toBe("audio/ogg");
    expect(fileType({ type: "", name: "bunica.m4a" })).toBe("audio/mp4");
    expect(fileType({ type: "image/jpeg", name: "x.jpg" })).toBe("image/jpeg");
    expect(fileType({ type: "", name: "fara-extensie" })).toBe("");
  });

  it("poza sau glasul unei amintiri le deschide doar cine vede amintirea", async () => {
    const doc = async (by: string) => (await db.insert(document).values({ treeId, kind: "audio", title: "glas", fileKey: `k-${by}-${Math.random()}`, uploadedBy: `u-${by}` }).returning())[0].id;
    const draftVoice = await doc("eu"), loose = await doc("var"), album = await doc("var");
    await db.update(memory).set({ audioDocumentId: draftVoice }).where(eq(memory.id, M.ciorna));
    await db.insert(documentLink).values({ documentId: album, personId: P.var });
    expect(await canOpenDocument(db, draftVoice, treeId, "u-eu", "u-eu")).toBe(true);
    expect(await canOpenDocument(db, draftVoice, treeId, "u-eu", "u-sotie")).toBe(false);
    // Încărcat, dar încă nepus la nicio amintire: doar cine l-a încărcat.
    expect(await canOpenDocument(db, loose, treeId, "u-var", "u-var")).toBe(true);
    expect(await canOpenDocument(db, loose, treeId, "u-var", "u-eu")).toBe(false);
    // Documentele din album rămân ale tuturor din arbore.
    expect(await canOpenDocument(db, album, treeId, "u-var", "u-sotie")).toBe(true);
    expect((await memoryMediaIds(db, treeId)).has(draftVoice)).toBe(true);
    expect((await lada("eu", "eu")).own.find((x) => x.body === "ciorna")!.audioId).toBe(draftVoice);
  });

  it("povestea înregistrată pentru tata, care n-are cont, e și a lui după ce își face cont", async () => {
    await db.insert(memory).values({ treeId, personId: P.tata, authorId: "u-eu", body: "", audioSeconds: 75, helper: true, consentAt: new Date(), visibility: "tree", chapter: "copilaria" });
    const byHelper = (await lada("eu", "tata")).own[0];
    expect(byHelper).toMatchObject({ helper: true, editable: true, mine: true, audioSeconds: 75 });
    expect((await lada("var", "tata")).own[0]).toMatchObject({ helper: true, editable: false });
    await db.update(person).set({ claimedByUserId: "u-tata" }).where(eq(person.id, P.tata));
    const l = await loadLada(db, treeId, P.tata, { userId: "u-tata", personId: P.tata }, g, 4);
    expect(l.isOwner).toBe(true);
    expect(l.own[0]).toMatchObject({ editable: true, mine: false });
    await db.update(person).set({ claimedByUserId: null }).where(eq(person.id, P.tata));
  });
});

describe("amintirile pe harta neamului", () => {
  const map = (k: string) => loadTreeMap(db, treeId, { userId: `u-${k}`, personId: k === "tata" ? null : P[k] });
  /** Locul → titlurile amintirilor de acolo, cu locurile pe care harta nu le știe la sfârșit. */
  const told = async (k: string) => {
    const m = await map(k);
    return Object.fromEntries([...m.places.filter((p) => p.memories.length).map((p) => [p.name, p.memories.map((x) => x.title).sort()]),
      ...m.memoryMissing.map((x) => [x.text, x.memories.map((y) => y.title).sort()])]);
  };
  const moara = "Mergeam cu tata la moară iarna, cu sania trasă de cai, și ne întorceam pe întuneric, cu sacii de făină și cu lampa aprinsă.";

  it("fiecare vede pe hartă doar ce vede și pe profil, fără ciorne și fără lăzile celor discreți", async () => {
    await db.update(memory).set({ place: "Huedin" }).where(inArray(memory.id, [M.pentruToti, M.apropiati, M.ciorna]));
    await db.update(memory).set({ place: "Domoșu" }).where(eq(memory.id, M.doarLuiFiulVar));
    await db.insert(memory).values({ treeId, personId: P.eu, authorId: "u-eu", body: moara, place: "la moara bunicului", visibility: "tree" });
    const [fosta] = await db.insert(person).values({ treeId, givenName: "fosta", surname: "Igna", sex: "F", discreet: true }).returning();
    await db.insert(memory).values({ treeId, personId: fosta.id, authorId: "u-eu", body: "din lada ei", place: "Huedin", visibility: "tree" });
    await db.update(person).set({ birthPlace: "Huedin", deathPlace: "Huedin", deathDateText: "1988" }).where(eq(person.id, P.bunic));

    const lost = { "la moara bunicului": [excerpt(moara)] };
    const question = "„Unchiule, cum era bunicul Majel?”";
    expect(await told("eu")).toEqual({ Huedin: ["apropiati", "pentruToti"], Domoșu: [question], ...lost });
    expect(await told("sotie")).toEqual({ Huedin: ["apropiati", "pentruToti"], ...lost });
    expect(await told("var")).toEqual({ Huedin: ["pentruToti"], ...lost });
    expect(await told("fiulVar")).toEqual({ Huedin: ["pentruToti"], Domoșu: [question], ...lost });
    expect(excerpt(moara)).toMatch(/^Mergeam cu tata la moară iarna, cu sania .+[^ ,]…$/);
    expect(excerpt(moara).length).toBeLessThanOrEqual(91);
  });

  it("amintirea duce la lada celui care a povestit-o, iar locul ei nu schimbă nimic pentru oameni", async () => {
    const withMemories = await map("eu");
    const huedin = withMemories.places.find((p) => p.name === "Huedin")!;
    expect(huedin.people).toEqual([{ id: P.bunic, kind: "born" }, { id: P.bunic, kind: "died" }]);
    expect(huedin.memories.find((x) => x.title === "pentruToti")).toMatchObject({ id: M.pentruToti, personId: P.eu, teller: "eu Igna" });
    expect(withMemories.places.find((p) => p.name === "Domoșu")!.people).toEqual([]);
    // Fără cine se uită (ce văd celelalte neamuri): fără amintiri, aceleași sate.
    const plain = await loadTreeMap(db, treeId);
    expect(plain.places.flatMap((p) => p.memories)).toEqual([]);
    expect(plain.memoryMissing).toEqual([]);
    expect(plain.places.map((p) => p.name)).toEqual(["Huedin"]);
    expect(withMemories.shared).toEqual(plain.shared);
    expect(withMemories.routes).toEqual(plain.routes);
  });
});

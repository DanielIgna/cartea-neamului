import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { person, relationship, tree, treeMember, user } from "@/db/schema";
import { createFamilyTree, startPlan, StartInput } from "@/lib/family-start";
import { loadTreeView } from "@/lib/tree-data";

const who = (given: string, surname: string, extra: Partial<{ birthSurname: string; birth: string; living: boolean }> = {}) => ({ given, surname, ...extra });
const parse = (v: StartInput) => StartInput.parse(v);

describe("startPlan: cine intră în arbore și cum se leagă", () => {
  it("doar omul, când n-a scris pe nimeni altcineva", () => {
    const plan = startPlan(parse({ treeName: "Neamul Igna", me: { given: "Daniel", surname: "Igna", sex: "M" } }));
    expect(plan.people.map((p) => p.key)).toEqual(["me"]);
    expect(plan.parentOf).toEqual([]);
    expect(plan.partners).toEqual([]);
    expect(plan.people[0].living).toBe(true);
  });

  it("părinții și cei patru bunici, cu legăturile de părinte și de cuplu", () => {
    const plan = startPlan(parse({
      treeName: "Neamul Igna", me: { given: "Daniel", surname: "Igna", sex: "M" },
      father: who("Avram", "Igna"), mother: who("Floarea", "Igna", { birthSurname: "Todea" }),
      ff: who("Ioan", "Igna"), fm: who("Maria", "Igna"), mf: who("Iosif", "Todea"), mm: who("Ana", "Todea"),
    }));
    expect(plan.people.map((p) => p.key)).toEqual(["me", "father", "mother", "ff", "fm", "mf", "mm"]);
    expect(plan.parentOf).toEqual([["father", "me"], ["mother", "me"], ["ff", "father"], ["fm", "father"], ["mf", "mother"], ["mm", "mother"]]);
    expect(plan.partners).toEqual([["father", "mother"], ["ff", "fm"], ["mf", "mm"]]);
    expect(plan.people.find((p) => p.key === "mother")!.birthSurname).toBe("Todea");
  });

  it("bunicii fără părintele lor nu intră, ca să nu plutească în arbore", () => {
    const plan = startPlan(parse({ treeName: "N", me: { given: "Ana", surname: "Pop", sex: "F" }, mother: who("Ileana", "Pop"), ff: who("Gheorghe", "Pop"), mm: who("Rodica", "") }));
    expect(plan.people.map((p) => p.key)).toEqual(["me", "mother", "mm"]);
    expect(plan.partners).toEqual([]);
  });

  it("un părinte gol (fără prenume și nume) nu intră, chiar dacă are anul nașterii", () => {
    const plan = startPlan(parse({ treeName: "N", me: { given: "Ana", surname: "Pop", sex: "F" }, father: who("", "", { birth: "1950" }) }));
    expect(plan.people.map((p) => p.key)).toEqual(["me"]);
  });

  it("numele de fată se păstrează doar la femei", () => {
    const plan = startPlan(parse({
      treeName: "N", me: { given: "Ion", surname: "Pop", birthSurname: "Rus", sex: "M" },
      father: who("Vasile", "Pop", { birthSurname: "Greșit" }), mother: who("Elena", "Pop", { birthSurname: "Rus" }),
    }));
    expect(plan.people.map((p) => [p.key, p.birthSurname])).toEqual([["me", ""], ["father", ""], ["mother", "Rus"]]);
    const her = startPlan(parse({ treeName: "N", me: { given: "Ana", surname: "Marin", birthSurname: "Pop", sex: "F" } }));
    expect(her.people[0].birthSurname).toBe("Pop");
  });

  it("cere prenumele, sexul și numele arborelui", () => {
    const err = (v: unknown) => StartInput.safeParse(v).error?.issues[0].message;
    expect(err({ treeName: "N", me: { given: " ", sex: "M" } })).toBe("Scrie-ți prenumele.");
    expect(err({ treeName: "N", me: { given: "Ion" } })).toBe("Alege dacă ești bărbat sau femeie.");
    expect(err({ treeName: "  ", me: { given: "Ion", sex: "M" } })).toBe("Dă un nume arborelui.");
  });
});

describe("createFamilyTree: arborele făcut dintr-o dată", () => {
  let db: Db;
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values({ id: "daniel", name: "Daniel", email: "daniel@test.ro" });
  });

  it("face arborele, omul revendicat în centru, ai lui și legăturile, pe care arborele le citește ca spițe", async () => {
    const r = await createFamilyTree(db, "daniel", parse({
      treeName: "Neamul Igna", region: "Cluj",
      me: { given: "Daniel", surname: "Igna", sex: "M", birth: "12.03.1980", birthPlace: "Huedin" },
      father: who("Avram", "Igna", { birth: "1950", living: true }), mother: who("Floarea", "Igna", { birthSurname: "Todea", living: true }),
      ff: who("Ioan", "Igna"), mf: who("Iosif", "Todea", { birth: "cca 1920" }),
    }));
    expect(r.people).toBe(5);

    const [t] = await db.select().from(tree).where(eq(tree.id, r.treeId));
    expect(t).toMatchObject({ name: "Neamul Igna", region: "Cluj", ownerId: "daniel", rootPersonId: r.meId });
    const members = await db.select().from(treeMember).where(eq(treeMember.treeId, r.treeId));
    expect(members.map((m) => [m.userId, m.role])).toEqual([["daniel", "owner"]]);

    const [me] = await db.select().from(person).where(eq(person.id, r.meId));
    expect(me).toMatchObject({ givenName: "Daniel", surname: "Igna", sex: "M", living: true, claimedByUserId: "daniel", privacy: "claimed", birthPlace: "Huedin", birthDateText: "12.03.1980" });
    expect(String(me.birthFrom)).toContain("1980-03-12");

    const people = await db.select().from(person).where(eq(person.treeId, r.treeId));
    const by = (g: string) => people.find((p) => p.givenName === g)!;
    expect(by("Floarea")).toMatchObject({ sex: "F", birthSurname: "Todea", living: true, claimedByUserId: null });
    expect(by("Avram").birthFrom).toBeTruthy();
    expect(by("Ioan")).toMatchObject({ sex: "M", living: false, birthDateText: null });

    const rels = await db.select().from(relationship).where(eq(relationship.treeId, r.treeId));
    expect(rels.filter((x) => x.type === "parent_child")).toHaveLength(4);
    expect(rels.filter((x) => x.type === "partnership").map((x) => [x.personA, x.personB])).toEqual([[by("Avram").id, by("Floarea").id]]);

    // Arborele îl vede ca pe o spiță: 1 = Daniel, 2 = tatăl, 3 = mama, 4 = bunicul dinspre tată, 6 = bunicul dinspre mamă.
    const view = await loadTreeView(db, r.treeId, r.meId, 3);
    expect(view?.slots).toMatchObject({ 1: r.meId, 2: by("Avram").id, 3: by("Floarea").id, 4: by("Ioan").id, 6: by("Iosif").id });
  });

  it("al doilea arbore al aceluiași om e separat de primul", async () => {
    const a = await createFamilyTree(db, "daniel", parse({ treeName: "Ciorna", me: { given: "Daniel", surname: "Igna", sex: "M" } }));
    const mine = await db.select({ treeId: person.treeId }).from(person).where(and(eq(person.claimedByUserId, "daniel"), eq(person.treeId, a.treeId)));
    expect(mine).toHaveLength(1);
    const all = await db.select().from(person).where(eq(person.treeId, a.treeId));
    expect(all).toHaveLength(1);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { joinAttempt, joinRequest, person, tree, treeMember, user } from "@/db/schema";
import { parseFuzzyDate } from "@/lib/dates";
import { DEMO_EMAIL } from "@/lib/demo";
import { answerJoin, askToJoin, DEMO_JOIN, joinRequestsFor, myJoinRequests, pendingJoins, sameName } from "@/lib/join";

let db: Db, treeId: string, demoTree: string;
const P: Record<string, string> = {};
const daniel = { id: "u-daniel", email: "daniel@test.ro" }, ioana = { id: "u-ioana", email: "ioana@test.ro" };
const ask = (me: { id: string; email: string }, given: string, surname: string, birth: string, note: string | null = null) =>
  askToJoin(db, me, { given, surname, birth, note });

/** Arborele lui Nicolae (proprietar): fiul Ioan Daniel cu data completă, fiica Ioana doar cu anul, Maria măritată Pop. */
beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  for (const [id, name, email] of [["u-nicolae", "Nicolae Igna", "nicolae@test.ro"], ["u-daniel", "Daniel Igna", daniel.email], ["u-ioana", "Ioana Igna", ioana.email],
    ["u-maria", "Maria Pop", "maria@test.ro"], ["u-x", "Cineva", "x@test.ro"], ["u-demo", "Andrei Pop (demo)", DEMO_EMAIL]]) {
    await db.insert(user).values({ id, name, email });
  }
  const [t] = await db.insert(tree).values({ name: "Neamul Igna", ownerId: "u-nicolae" }).returning();
  treeId = t.id;
  await db.insert(treeMember).values({ treeId, userId: "u-nicolae", role: "owner" });
  const add = async (k: string, v: Partial<typeof person.$inferInsert>) => {
    const b = parseFuzzyDate(v.birthDateText);
    const [p] = await db.insert(person).values({ treeId, givenName: "", surname: "", living: true, birthFrom: b.from, birthTo: b.to, ...v }).returning();
    P[k] = p.id;
  };
  await add("nicolae", { givenName: "Nicolae", surname: "Igna", birthDateText: "1950", claimedByUserId: "u-nicolae" });
  await add("daniel", { givenName: "Ioan Daniel", surname: "Igna", birthDateText: "12.03.1985" });
  await add("ioana", { givenName: "Ioana", surname: "Igna", birthDateText: "1990" });
  await add("maria", { givenName: "Maria", surname: "Pop", birthSurname: "Igna", birthDateText: "1 mai 1988" });
  await add("bunic", { givenName: "Gavril", surname: "Igna", birthDateText: "12.03.1985", living: false });
  const [d] = await db.insert(tree).values({ name: "Neamul Pop din Ieud", ownerId: "u-demo" }).returning();
  demoTree = d.id;
  await db.insert(person).values({ treeId: demoTree, givenName: "Ioan Daniel", surname: "Igna", living: true, birthDateText: "12.03.1985", birthFrom: "1985-03-12", birthTo: "1985-03-12" });
});

describe("intrarea în arbore după nume și data nașterii", () => {
  it("recunoaște numele scrise altfel: un prenume din două, fără diacritice, numele de fată", () => {
    const p = { givenName: "Ioan Daniel", surname: "Igna", birthSurname: null };
    expect(sameName({ given: "Daniel", surname: "IGNA" }, p)).toBe(true);
    expect(sameName({ given: "ioan-daniel", surname: "Igna" }, p)).toBe(true);
    expect(sameName({ given: "Dan", surname: "Igna" }, p)).toBe(false);
    expect(sameName({ given: "Daniel", surname: "Ignat" }, p)).toBe(false);
    expect(sameName({ given: "Maria", surname: "Igna" }, { givenName: "Maria", surname: "Pop", birthSurname: "Igna" })).toBe(true);
    expect(sameName({ given: "Ștefan", surname: "Iancu" }, { givenName: "Stefan", surname: "Iancu", birthSurname: null })).toBe(true);
  });

  it("găsește doar fișa celui în viață, nerevendicată, cu aceeași zi de naștere", async () => {
    expect(await ask(daniel, "Daniel", "Igna", "1985-03-13")).toEqual({ found: 0 });
    expect(await ask(ioana, "Ioana", "Igna", "1990-06-01")).toEqual({ found: 0 }); // în fișă e doar anul
    expect(await ask({ id: "u-demo", email: DEMO_EMAIL }, "Daniel", "Igna", "1985-03-12")).toEqual({ error: DEMO_JOIN });
    expect((await ask(daniel, "Daniel", "Igna", "2999-01-01")).error).toBeTruthy();
    expect(await ask(daniel, "Daniel", "Igna", "1985-03-12", "Sunt fiul lui Nicolae.")).toEqual({ found: 1, declined: false });
    // Nici bunicul decedat cu aceeași dată, nici fișa din arborele de probă nu primesc cereri.
    const reqs = await db.select().from(joinRequest);
    expect(reqs.map((r) => r.personId)).toEqual([P.daniel]);
    // A doua oară nu se dublează.
    expect(await ask(daniel, "Ioan Daniel", "Igna", "1985-03-12")).toEqual({ found: 1, declined: false });
    expect(await db.select().from(joinRequest)).toHaveLength(1);
  });

  it("cel care caută nu află arborele până la confirmare; proprietarul vede cine cere", async () => {
    const [mine] = await myJoinRequests(db, daniel.id);
    expect(mine).toMatchObject({ status: "pending", treeId: null, treeName: null });
    expect(await pendingJoins(db, "u-nicolae")).toBe(1);
    const [r] = await joinRequestsFor(db, "u-nicolae");
    expect(r).toMatchObject({ name: "Daniel Igna", email: daniel.email, personName: "Ioan Daniel Igna", born: "12.03.1985", treeName: "Neamul Igna", note: "Sunt fiul lui Nicolae." });
    expect(await joinRequestsFor(db, daniel.id)).toEqual([]);
  });

  it("după „Acceptă”, intră în arbore cu fișa lui; doar proprietarul poate răspunde", async () => {
    // Și Maria (măritată Pop) își caută fișa după numele de fată; altcineva încearcă aceeași fișă a lui Daniel.
    expect(await ask({ id: "u-maria", email: "maria@test.ro" }, "Maria", "Igna", "1988-05-01")).toEqual({ found: 1, declined: false });
    expect(await ask({ id: "u-x", email: "x@test.ro" }, "Daniel", "Igna", "1985-03-12")).toEqual({ found: 1, declined: false });
    const pending = await joinRequestsFor(db, "u-nicolae");
    const own = pending.find((x) => x.name === "Daniel Igna")!, other = pending.find((x) => x.name === "Cineva")!;
    expect(await answerJoin(db, daniel.id, own.id, true)).toEqual({ error: "Cererea nu mai așteaptă răspuns." });
    expect(await answerJoin(db, "u-nicolae", own.id, true)).toEqual({ ok: true });
    const [p] = await db.select().from(person).where(eq(person.id, P.daniel));
    expect(p.claimedByUserId).toBe(daniel.id);
    const [m] = await db.select().from(treeMember).where(and(eq(treeMember.treeId, treeId), eq(treeMember.userId, daniel.id)));
    expect(m.role).toBe("contributor");
    const [o] = await db.select().from(joinRequest).where(eq(joinRequest.id, other.id));
    expect(o.status).toBe("declined"); // fișa nu mai e liberă pentru altcineva
    expect((await myJoinRequests(db, daniel.id))[0]).toMatchObject({ status: "accepted", treeId, treeName: "Neamul Igna" });
    // Fișa revendicată nu mai poate fi găsită.
    expect(await ask({ id: "u-x", email: "x@test.ro" }, "Daniel", "Igna", "1985-03-12")).toEqual({ found: 0 });
  });

  it("„Refuză” rămâne refuzat", async () => {
    const [mr] = await joinRequestsFor(db, "u-nicolae");
    expect(mr.name).toBe("Maria Pop");
    expect(await answerJoin(db, "u-nicolae", mr.id, false)).toEqual({ ok: true });
    expect(await ask({ id: "u-maria", email: "maria@test.ro" }, "Maria", "Pop", "1988-05-01")).toEqual({ found: 0, declined: true });
    expect(await pendingJoins(db, "u-nicolae")).toBe(0);
  });

  it("puține căutări pe zi, ca data nașterii cuiva să nu poată fi ghicită", async () => {
    const now = new Date();
    for (let i = 0; i < 9; i++) await ask(ioana, "Ioana", "Igna", `1990-01-${String(i + 10).padStart(2, "0")}`); // a 10-a din ziua asta
    const r = await ask(ioana, "Ioana", "Igna", "1990-02-01");
    expect(r.error).toMatch(/de multe ori/);
    // Din alte conturi, același nume de familie: cel mult 30 de încercări fără rezultat pe zi.
    await db.insert(joinAttempt).values(Array.from({ length: 30 }, (_, i) => ({ userId: "u-x", nameKey: "rus", found: false, createdAt: new Date(now.getTime() - i * 1000) })));
    expect((await ask(daniel, "Petru", "Rus", "1970-01-01")).error).toMatch(/de multe ori/);
    // A doua zi se poate din nou.
    const tomorrow = new Date(now.getTime() + 864e5 + 60_000);
    expect(await askToJoin(db, ioana, { given: "Ioana", surname: "Igna", birth: "1990-02-01", note: null }, tomorrow)).toEqual({ found: 0 });
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, document, invitation, memory, memoryReply, message, person, session, tree, treeMember, user } from "@/db/schema";
import { isAdminUser } from "@/lib/admin";
import { adoptionOf, deviceOf, funnelOf, observations, peopleList, personDetail, stageOf } from "@/lib/admin-people";
import { businessStats } from "@/lib/admin-stats";
import { exportMyData } from "@/lib/account";
import {
  DEFAULT_SETTINGS, PlanSettings, accountPlans, isPlan, limitState, planOverview, planSettings, revenue, savePlanSettings, setAccountPlan,
} from "@/lib/plans";

describe("cine intră în panou", () => {
  const owner = "danieligna1@gmail.com";
  it("adresele din ADMIN_EMAILS intră, oricare ar fi", () => {
    expect(isAdminUser({ email: "Ana@x.ro" }, "ana@x.ro")).toBe(true);
    expect(isAdminUser({ email: "ion@x.ro" }, "ana@x.ro")).toBe(false);
    expect(isAdminUser(null, "ana@x.ro")).toBe(false);
  });
  it("cel care ține site-ul intră cu emailul verificat sau cu contul făcut înainte de regulă", () => {
    expect(isAdminUser({ email: owner, emailVerified: true, createdAt: new Date("2027-01-01") }, "")).toBe(true);
    expect(isAdminUser({ email: " DanielIgna1@Gmail.com ", emailVerified: false, createdAt: new Date("2026-11-01") }, "")).toBe(true);
  });
  it("un cont nou, neverificat, făcut cu adresa lui nu intră", () => {
    expect(isAdminUser({ email: owner, emailVerified: false, createdAt: new Date("2026-11-07") }, "")).toBe(false);
    expect(isAdminUser({ email: owner, emailVerified: false }, "")).toBe(false);
  });
});

describe("planurile", () => {
  const s = DEFAULT_SETTINGS;
  it("un arbore e aproape de limită de la trei sferturi din oricare limită și peste de la limită", () => {
    expect(limitState(10, 10, s)).toBe("sub");
    expect(limitState(150, 0, s)).toBe("aproape");
    expect(limitState(0, 400, s)).toBe("aproape");
    expect(limitState(200, 0, s)).toBe("peste");
    expect(limitState(20, 600, s)).toBe("peste");
  });
  it("banii: plătesc cei „Familie” și ar plăti cei gratuiți peste limită, niciodată cei „Gratuit mereu”", () => {
    const r = revenue([{ plan: "familie", overLimitTrees: 0 }, { plan: "gratuit", overLimitTrees: 2 }, { plan: "mereu", overLimitTrees: 3 }, { plan: "gratuit", overLimitTrees: 0 }], s);
    expect(r).toEqual({ paying: 1, wouldPay: 1, eurYearNow: 12, eurYearPossible: 24 });
  });
  it("limitele se scriu ca numere întregi, cu mesaje în română", () => {
    expect(PlanSettings.safeParse({ freePersons: "300", freeFiles: "800", priceEurYear: "15.5" }).data).toEqual({ freePersons: 300, freeFiles: 800, priceEurYear: 15.5 });
    expect(PlanSettings.safeParse({ freePersons: "5", freeFiles: "800", priceEurYear: "12" }).error?.issues[0].message).toBe("Cel puțin 10 persoane.");
    expect(PlanSettings.safeParse({ freePersons: "abc", freeFiles: "800", priceEurYear: "12" }).error?.issues[0].message).toBe("Scrie un număr.");
    expect(PlanSettings.safeParse({ freePersons: "100", freeFiles: "800", priceEurYear: "-1" }).error?.issues[0].message).toBe("Prețul nu poate fi negativ.");
  });
  it("numai cele trei planuri sunt planuri", () => {
    expect(isPlan("mereu")).toBe(true);
    expect(isPlan("toString")).toBe(false);
    expect(isPlan(undefined)).toBe(false);
  });
});

describe("Oamenii și Manager control", () => {
  let db: Db;
  const T: Record<string, string> = {};
  const now = Date.now();
  const ago = (days: number) => new Date(now - days * 86_400_000);

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([
      { id: "ana", name: "Ana", email: "ana@test.ro", createdAt: ago(20) },
      { id: "ion", name: "Ion", email: "ion@test.ro", createdAt: ago(10) },
      { id: "gol", name: "Gol", email: "gol@test.ro", createdAt: ago(1) },
      { id: "demo", name: "Demo", email: "demo@cartea-neamului.ro" },
    ]);
    await db.insert(session).values([
      { id: "s1", token: "t1", userId: "ana", createdAt: ago(20), updatedAt: ago(20), expiresAt: ago(-5), userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" },
      { id: "s2", token: "t2", userId: "ana", createdAt: ago(2), updatedAt: ago(1), expiresAt: ago(-5), userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36" },
      { id: "s3", token: "t3", userId: "ion", createdAt: ago(10), updatedAt: ago(10), expiresAt: ago(-5), userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Firefox/131.0" },
    ]);
    [{ id: T.mare }] = await db.insert(tree).values({ name: "Neamul Anei", ownerId: "ana", createdAt: ago(20) }).returning({ id: tree.id });
    [{ id: T.mic }] = await db.insert(tree).values({ name: "Ciorna lui Ion", ownerId: "ion", createdAt: ago(10) }).returning({ id: tree.id });
    await db.insert(treeMember).values([
      { treeId: T.mare, userId: "ana", role: "owner" }, { treeId: T.mare, userId: "ion", role: "contributor" }, { treeId: T.mic, userId: "ion", role: "owner" },
    ]);
    await db.insert(invitation).values([
      { treeId: T.mare, tokenHash: "h1", createdBy: "ana", acceptedBy: "ion", acceptedAt: ago(10), expiresAt: ago(-5) },
      { treeId: T.mare, tokenHash: "h2", createdBy: "ana", expiresAt: ago(-5) },
    ]);
    const people = await db.insert(person).values(Array.from({ length: 160 }, (_, k) => ({ treeId: T.mare, givenName: `P${k}`, createdBy: "ana", createdAt: ago(k % 3) })))
      .returning({ id: person.id });
    const [anaP] = await db.insert(person).values({ treeId: T.mare, givenName: "Ana", living: true, claimedByUserId: "ana", createdBy: "ana" }).returning({ id: person.id });
    await db.insert(person).values({ treeId: T.mic, givenName: "Unu", createdBy: "ion" });
    const [m1, faith] = await db.insert(memory).values([
      { treeId: T.mare, personId: anaP.id, authorId: "ana", chapter: "copilaria", body: "taina copilăriei", questionKey: "carte.copilaria.1", audioSeconds: 90, createdAt: ago(1) },
      { treeId: T.mare, personId: anaP.id, authorId: "ana", chapter: "credinta", body: "taina credinței", audioSeconds: 600 },
      { treeId: T.mare, personId: people[0].id, authorId: "ion", chapter: "munca", body: "la bunici", helper: true },
    ]).returning({ id: memory.id });
    await db.insert(memoryReply).values([{ memoryId: m1.id, authorId: "ion", body: "și eu" }, { memoryId: faith.id, authorId: "ion", body: "amin" }]);
    await db.insert(document).values([
      { treeId: T.mare, kind: "photo", title: "poza", fileKey: "a/1", uploadedBy: "ana" },
      { treeId: T.mare, kind: "audio", title: "glas", fileKey: "a/2", uploadedBy: "ana" },
    ]);
    await db.insert(message).values({ treeId: T.mare, fromUserId: "ion", toUserId: "ana", body: "salut" });
  });

  it("lista: toți oamenii fără contul de probă, cu cifrele lor, fără „Credința”", async () => {
    const list = await peopleList(db);
    expect(list.map((p) => p.id).sort()).toEqual(["ana", "gol", "ion"]);
    const ana = list.find((p) => p.id === "ana")!;
    expect(ana).toMatchObject({ trees: 1, owned: 1, personsAdded: 161, memories: 1, ownStory: 1, voiceSeconds: 90, photos: 1, invites: 2, invitesAccepted: 1, phone: true, stage: "amintiri", returned: true });
    expect(ana.mainTree).toMatchObject({ name: "Neamul Anei", persons: 161, members: 2 });
    const ion = list.find((p) => p.id === "ion")!;
    expect(ion).toMatchObject({ trees: 2, owned: 1, memories: 1, helper: 1, replies: 1, messages: 1, phone: false });
    expect(ion.mainTree?.name).toBe("Ciorna lui Ion");
    expect(list.find((p) => p.id === "gol")).toMatchObject({ trees: 0, stage: "cont", returned: false });
    expect(JSON.stringify(list)).not.toContain("taina");
  });

  it("unde a ajuns fiecare", () => {
    const base = { trees: 1, owned: 1, personsAdded: 0, invites: 0, memories: 0, mainTree: { id: "x", name: "x", persons: 1, members: 1 } };
    expect(stageOf({ ...base, trees: 0, owned: 0 })).toBe("cont");
    expect(stageOf(base)).toBe("arbore");
    expect(stageOf({ ...base, personsAdded: 7 })).toBe("creste");
    expect(stageOf({ ...base, invites: 1 })).toBe("chemat");
    expect(stageOf({ ...base, invites: 1, mainTree: { ...base.mainTree, members: 3 } })).toBe("familie");
    expect(stageOf({ ...base, owned: 0 })).toBe("la-rude");
    expect(stageOf({ ...base, memories: 2 })).toBe("amintiri");
  });

  it("drumul, ce folosesc și ce se vede din cifre", async () => {
    const list = await peopleList(db);
    expect(funnelOf(list).map((s) => s.count)).toEqual([3, 2, 1, 1, 1, 2, 2]);
    expect(adoptionOf(list).find((a) => a.label.startsWith("Au pus poze"))?.count).toBe(1);
    const obs = observations(list, new Date(now));
    expect(obs.some((o) => o.startsWith("1 din 3 oameni și-a făcut cont, dar n-are niciun arbore"))).toBe(true);
    expect(obs.some((o) => o.startsWith("1 din 2 arbori are un singur om"))).toBe(true);
    expect(observations([])).toEqual(["Încă nu și-a făcut nimeni cont (în afară de contul de probă)."]);
  });

  it("fișa unui om: săptămâni, capitole fără „Credința”, dispozitive", async () => {
    const d = (await personDetail(db, "ana", new Date(now)))!;
    expect(d.weeks).toHaveLength(12);
    expect(d.weeks.reduce((s, w) => s + w.persoane, 0)).toBe(161);
    expect(d.weeks.reduce((s, w) => s + w.amintiri, 0)).toBe(1);
    expect(d.weeks.reduce((s, w) => s + w.poze, 0)).toBe(1);
    expect(d.chapters).toEqual([{ label: "Copilăria", count: 1 }]);
    expect(d.devices.map((x) => x.label).sort()).toEqual(["Windows · Chrome", "iPhone · Safari"]);
    expect(d.trees[0]).toMatchObject({ name: "Neamul Anei", owner: true, persons: 161, byHim: 161, members: 2, files: 2 });
    expect(d.growth.at(-1)?.total).toBe(161);
    expect(await personDetail(db, "demo")).toBeNull();
    expect(await personDetail(db, "nimeni")).toBeNull();
  });

  it("dispozitivul din felul browserului", () => {
    expect(deviceOf("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36")).toEqual({ label: "Android · Chrome", phone: true });
    expect(deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15")).toEqual({ label: "Mac · Safari", phone: false });
    expect(deviceOf(null).label).toBe("alt dispozitiv · alt browser");
  });

  it("Manager control: limitele se schimbă și se văd peste tot, planul „gratuit” fără notă șterge alegerea", async () => {
    expect(await planSettings(db)).toEqual(DEFAULT_SETTINGS);
    let ov = await planOverview(db);
    expect(ov.counts).toMatchObject({ over: 0, near: 1 });
    await savePlanSettings(db, { freePersons: 150, freeFiles: 500, priceEurYear: 10 }, "ana");
    expect(await planSettings(db)).toEqual({ freePersons: 150, freeFiles: 500, priceEurYear: 10 });
    ov = await planOverview(db);
    expect(ov.counts).toMatchObject({ over: 1, overFree: 1, mereu: 0 });
    expect(ov.revenue).toMatchObject({ paying: 0, wouldPay: 1, eurYearPossible: 10 });
    expect((await businessStats(db)).revenue).toMatchObject({ potentialEurYear: 10, subscriptionsActive: 0 });

    await setAccountPlan(db, "ana", "mereu", "  sora mea  ", "ana");
    await setAccountPlan(db, "ion", "familie", null, "ana");
    expect((await accountPlans(db)).get("ana")).toMatchObject({ plan: "mereu", note: "sora mea" });
    ov = await planOverview(db);
    expect(ov.counts).toMatchObject({ mereu: 1, familie: 1, over: 1, overFree: 0 });
    expect(ov.revenue).toMatchObject({ paying: 1, wouldPay: 0, eurYearNow: 10 });
    expect((await peopleList(db)).find((p) => p.id === "ana")).toMatchObject({ plan: "mereu", planNote: "sora mea" });

    const data = (await exportMyData(db, "ana", "https://exemplu.ro"))!;
    expect(data.notaNoastra).toMatchObject({ plan: "Gratuit mereu", nota: "sora mea" });
    expect((await exportMyData(db, "gol", "https://exemplu.ro"))!.notaNoastra).toBeUndefined();

    await setAccountPlan(db, "ion", "gratuit", " ", "ana");
    expect((await db.select().from(accountPlan)).map((r) => r.userId)).toEqual(["ana"]);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, document, invitation, memory, memoryReply, message, person, session, tree, treeMember, user } from "@/db/schema";
import { isAdminUser } from "@/lib/admin";
import { adoptionOf, deviceOf, funnelOf, observations, peopleList, personDetail, stageOf } from "@/lib/admin-people";
import { businessStats } from "@/lib/admin-stats";
import { exportMyData } from "@/lib/account";
import { roleIn, roleInTree } from "@/lib/access";
import { userAccess } from "@/lib/plata";
import {
  DEFAULT_SETTINGS, PlanSettings, startSalesOnce, accessFor, holdsYear, mayInviteWriters, mayStartTree, personRoom, writesInTree, accountPlans, isPlan, mayWrite, planOverview, planSettings, revenue, savePlanSettings, setAccountPlan, yearPrice,
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
  const on = { ...s, on: true, startedAt: "2026-12-01T00:00:00.000Z", betaDays: 0 };
  const d = (iso: string) => new Date(iso);
  it("cât timp plățile sunt oprite, toți pot tot", () => {
    expect(accessFor({ createdAt: d("2020-01-01"), plan: null, paidUntil: null }, s)).toEqual({ kind: "deschis" });
  });
  it("fiecare om are zilele lui gratuite, numărate de la pornire pentru cei vechi și de la cont pentru cei noi", () => {
    const old = { createdAt: d("2026-11-01"), plan: null, paidUntil: null };
    expect(accessFor(old, on, d("2026-12-03T00:00:00Z"))).toMatchObject({ kind: "proba", daysLeft: 5 });
    expect(accessFor(old, on, d("2026-12-08T00:00:00Z"))).toMatchObject({ kind: "expirat", since: d("2026-12-08T00:00:00Z") });
    const nou = { createdAt: d("2026-12-20T12:00:00Z"), plan: null, paidUntil: null };
    expect(accessFor(nou, on, d("2026-12-27T11:00:00Z"))).toMatchObject({ kind: "proba", daysLeft: 1 });
    expect(mayWrite(accessFor(nou, on, d("2026-12-27T13:00:00Z")))).toBe(false);
  });
  it("cei din beta (cont dinainte de pornire) au primul an gratuit, apoi doar citire", () => {
    const beta = { ...on, betaDays: 365 };
    const old = { createdAt: d("2026-11-01"), plan: null, paidUntil: null };
    expect(accessFor(old, beta, d("2027-06-01"))).toEqual({ kind: "beta", until: d("2027-12-01T00:00:00Z") });
    expect(accessFor(old, beta, d("2027-12-02"))).toEqual({ kind: "expirat", since: d("2027-12-01T00:00:00Z") });
    expect(accessFor({ createdAt: d("2026-12-05"), plan: null, paidUntil: null }, beta, d("2026-12-06"))).toMatchObject({ kind: "proba" });
  });
  it("„gratuit mereu”, contul demo și anul plătit trec peste zilele gratuite; după anul plătit, doar citire", () => {
    const now = d("2027-03-01");
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "mereu", paidUntil: null }, on, now)).toEqual({ kind: "mereu" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: null, paidUntil: null, exempt: true }, on, now)).toEqual({ kind: "mereu" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "gratuit", paidUntil: d("2027-12-01") }, on, now)).toMatchObject({ kind: "platit" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "familie", paidUntil: null }, on, now)).toEqual({ kind: "platit", until: null });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "familie", paidUntil: d("2027-02-01") }, on, now)).toEqual({ kind: "expirat", since: d("2027-02-01") });
  });
  it("banii: cel cu arbore plătește prețul întreg, ruda invitată prețul ei; „gratuit mereu” niciodată", () => {
    const t = { ...on, invitePriceLei: 30 };
    expect(yearPrice(true, t)).toEqual({ lei: 50, eur: 10 });
    expect(yearPrice(false, t)).toEqual({ lei: 30, eur: 10 });
    const r = revenue([
      { access: { kind: "platit", until: null }, ownsTree: true },
      { access: { kind: "expirat", since: d("2027-01-01") }, ownsTree: false },
      { access: { kind: "proba", until: d("2027-01-01"), daysLeft: 2 }, ownsTree: true },
      { access: { kind: "mereu" }, ownsTree: true },
    ], t);
    expect(r).toEqual({ paying: 1, wouldPay: 2, leiYearNow: 50, leiYearPossible: 130 });
  });
  it("setările se scriu ca numere, cu mesaje în română, iar comutatorul vine din bifă", () => {
    const form = { on: "on", trialDays: "14", priceLei: "50", priceEur: "10", invitePriceLei: "25", invitePriceEur: "5", bookLei: "99", bookEur: "20", betaDays: "365", trialPersons: "30" };
    expect(PlanSettings.safeParse(form).data).toEqual({ ...form, on: true, startedAt: null, trialDays: 14, priceLei: 50, priceEur: 10, invitePriceLei: 25, invitePriceEur: 5, bookLei: 99, bookEur: 20, betaDays: 365, trialPersons: 30 });
    expect(PlanSettings.safeParse({ ...form, on: null }).data?.on).toBe(false);
    expect(PlanSettings.safeParse({ ...form, trialDays: "0" }).error?.issues[0].message).toBe("Cel puțin 1 zile.");
    expect(PlanSettings.safeParse({ ...form, trialDays: "2.5" }).error?.issues[0].message).toBe("Scrie un număr întreg.");
    expect(PlanSettings.safeParse({ ...form, priceLei: "abc" }).error?.issues[0].message).toBe("Scrie un număr.");
    expect(PlanSettings.safeParse({ ...form, bookLei: "-1" }).error?.issues[0].message).toBe("Prețul nu poate fi negativ.");
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

  it("Manager control: setările se schimbă și se văd peste tot, planul „gratuit” fără notă șterge alegerea", async () => {
    expect(await planSettings(db)).toEqual(DEFAULT_SETTINGS);
    // Oprite: se arată ce s-ar întâmpla dacă le-ai porni azi: cei de acum au primul an gratuit, demo e scutit.
    let ov = await planOverview(db);
    expect(ov.counts).toMatchObject({ mereu: 1, platit: 0, beta: 3, proba: 0, expirat: 0 });
    expect(ov.revenue).toMatchObject({ paying: 0, wouldPay: 0, leiYearPossible: 0 });
    expect((await businessStats(db)).revenue).toMatchObject({ potentialLeiYear: 0, paying: 0 });

    await savePlanSettings(db, { ...DEFAULT_SETTINGS, priceLei: 60, invitePriceLei: 40, betaDays: 0 }, "ana");
    expect(await planSettings(db)).toMatchObject({ on: false, startedAt: null, priceLei: 60, invitePriceLei: 40 });
    // „gol” n-are arbore al lui, deci plătește ca rudă invitată.
    expect((await planOverview(db)).revenue.leiYearPossible).toBe(60 + 60 + 40);
    await setAccountPlan(db, "ana", "mereu", "  sora mea  ", "ana");
    await setAccountPlan(db, "ion", "familie", null, "ana");
    expect((await accountPlans(db)).get("ana")).toMatchObject({ plan: "mereu", note: "sora mea" });
    ov = await planOverview(db);
    expect(ov.counts).toMatchObject({ mereu: 2, platit: 1, proba: 1 });
    expect(ov.revenue).toMatchObject({ paying: 1, wouldPay: 1, leiYearNow: 60 });
    expect((await peopleList(db)).find((p) => p.id === "ana")).toMatchObject({ plan: "mereu", planNote: "sora mea" });

    const data = (await exportMyData(db, "ana", "https://exemplu.ro"))!;
    expect(data.notaNoastra).toMatchObject({ plan: "Gratuit mereu", nota: "sora mea" });
    expect((await exportMyData(db, "gol", "https://exemplu.ro"))!.notaNoastra).toBeUndefined();

    await setAccountPlan(db, "ion", "gratuit", " ", "ana");
    expect((await db.select().from(accountPlan)).map((r) => r.userId)).toEqual(["ana"]);
    await savePlanSettings(db, { ...DEFAULT_SETTINGS, betaDays: 0 }, "ana");
  });

  it("pornite: după zilele gratuite, omul e vizitator în toți arborii lui până plătește", async () => {
    await setAccountPlan(db, "ana", "gratuit", null, "ana");
    expect(await roleIn(db, T.mare, "ion")).toBe("contributor");
    // Pornite acum 8 zile: Ana și Ion au conturi mai vechi, deci zilele lor s-au terminat ieri; Gol e nou.
    const saved = await savePlanSettings(db, { ...DEFAULT_SETTINGS, on: true, betaDays: 0 }, "ana", ago(8));
    expect(saved.startedAt).toBe(ago(8).toISOString());
    expect((await savePlanSettings(db, { ...DEFAULT_SETTINGS, on: true, betaDays: 0 }, "ana")).startedAt).toBe(ago(8).toISOString());
    expect(await roleIn(db, T.mare, "ana")).toBe("viewer");
    expect(await roleIn(db, T.mare, "ion")).toBe("viewer");
    expect(await roleInTree(db, T.mare, "ana")).toBe("owner");
    expect((await userAccess(db, "gol")).access).toMatchObject({ kind: "proba", daysLeft: 6 });
    expect((await userAccess(db, "demo")).access).toEqual({ kind: "mereu" });

    await setAccountPlan(db, "ana", "gratuit", null, "ana", new Date(), new Date(now + 365 * 86_400_000));
    expect(await roleIn(db, T.mare, "ana")).toBe("owner");
    expect(await roleIn(db, T.mare, "ion")).toBe("viewer");
    expect((await userAccess(db, "ana")).ownsTree).toBe(true);
    // Cu primul an gratuit pentru cei din beta, Ion (cont dinainte de pornire) poate scrie din nou.
    await savePlanSettings(db, { ...DEFAULT_SETTINGS, on: true }, "ana");
    expect(await roleIn(db, T.mare, "ion")).toBe("contributor");

    await savePlanSettings(db, DEFAULT_SETTINGS, "ana");
    expect(await planSettings(db)).toMatchObject({ on: false, startedAt: null });
    expect(await roleIn(db, T.mare, "ion")).toBe("contributor");
  });
});

describe("plata nu se ocolește invitându-se unii pe alții", () => {
  const s = DEFAULT_SETTINGS;
  const proba = { kind: "proba", until: new Date(), daysLeft: 3 } as const;
  const platit = { kind: "platit", until: null } as const;
  const expirat = { kind: "expirat", since: new Date() } as const;
  const beta = { kind: "beta", until: new Date() } as const;

  it("în zilele gratuite, un arbore neplătit crește doar până la familia apropiată", () => {
    expect(s.trialPersons).toBe(30);
    expect(personRoom(proba, proba, 12, s)).toBe(18);
    expect(personRoom(proba, expirat, 40, s)).toBe(0);
    expect(personRoom(proba, platit, 500, s)).toBeNull();
    expect(personRoom(proba, beta, 500, s)).toBeNull();
    expect(personRoom(platit, proba, 500, s)).toBeNull();
  });

  it("rudele se invită să scrie doar cu anul plătit; în probă, doar să vadă", () => {
    expect(mayInviteWriters(proba)).toBe(false);
    expect(mayInviteWriters(platit)).toBe(true);
    expect(mayInviteWriters({ kind: "deschis" })).toBe(true);
    expect(holdsYear(expirat)).toBe(false);
  });

  it("invitatul în probă nu mai scrie în arborele unui proprietar rămas doar cu citirea", () => {
    expect(writesInTree(proba, expirat, false)).toBe(false);
    expect(writesInTree(proba, platit, false)).toBe(true);
    expect(writesInTree(proba, proba, false)).toBe(true);
    expect(writesInTree(proba, expirat, true)).toBe(true);
    expect(writesInTree(platit, expirat, false)).toBe(true);
    expect(writesInTree(expirat, platit, false)).toBe(false);
  });

  it("în zilele gratuite, un singur arbore", () => {
    expect(mayStartTree(proba, 0)).toBe(true);
    expect(mayStartTree(proba, 1)).toBe(false);
    expect(mayStartTree(platit, 3)).toBe(true);
  });
});

describe("pornirea vânzării, o singură dată", () => {
  it("pornește plățile la prima rulare și nu le repornește după o oprire din Admin", async () => {
    const d = createDb(); await runMigrations(d);
    expect(await startSalesOnce(d, new Date("2026-11-13T00:00:00Z"))).toBe("pornit");
    expect(await planSettings(d)).toMatchObject({ on: true, startedAt: "2026-11-13T00:00:00.000Z", priceLei: 50, trialDays: 7 });
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, on: false }, null as unknown as string);
    expect(await startSalesOnce(d)).toBe("deja");
    expect((await planSettings(d)).on).toBe(false);
  });
});

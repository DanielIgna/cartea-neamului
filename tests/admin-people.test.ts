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
  DEFAULT_SETTINGS, PlanSettings, startSalesOnce, basicPrice49Once, accessFor, holdsYear, limitsFor, room, tierPrice, tierBook, tierPrint, mayInviteWriters, mayStartTree, personRoom, writesInTree, accountPlans, isPlan, mayWrite, planOverview, planSettings, revenue, savePlanSettings, setAccountPlan, yearPrice,
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
    expect(accessFor(old, beta, d("2027-12-02"))).toMatchObject({ kind: "expirat", since: d("2027-12-01T00:00:00Z") });
    expect(accessFor({ createdAt: d("2026-12-05"), plan: null, paidUntil: null }, beta, d("2026-12-06"))).toMatchObject({ kind: "proba" });
  });
  it("„gratuit mereu”, contul demo și anul plătit trec peste zilele gratuite; după anul plătit, doar citire", () => {
    const now = d("2027-03-01");
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "mereu", paidUntil: null }, on, now)).toEqual({ kind: "mereu" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: null, paidUntil: null, exempt: true }, on, now)).toEqual({ kind: "mereu" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "gratuit", paidUntil: d("2027-12-01") }, on, now)).toMatchObject({ kind: "platit" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "familie", paidUntil: null }, on, now)).toEqual({ kind: "platit", until: null, tier: "basic" });
    expect(accessFor({ createdAt: d("2026-01-01"), plan: "familie", paidUntil: d("2027-02-01") }, on, now)).toMatchObject({ kind: "expirat", since: d("2027-02-01") });
  });
  it("banii: cel cu arbore plătește prețul întreg, ruda invitată prețul ei; „gratuit mereu” niciodată", () => {
    const t = { ...on, invitePriceLei: 30 };
    expect(yearPrice(true, t)).toEqual({ lei: 49, eur: 10 });
    expect(yearPrice(false, t)).toEqual({ lei: 30, eur: 10 });
    const r = revenue([
      { access: { kind: "platit", until: null, tier: "basic" }, ownsTree: true },
      { access: { kind: "expirat", since: d("2027-01-01") }, ownsTree: false },
      { access: { kind: "proba", until: d("2027-01-01"), daysLeft: 2 }, ownsTree: true },
      { access: { kind: "mereu" }, ownsTree: true },
    ], t);
    expect(r).toEqual({ paying: 1, wouldPay: 2, leiYearNow: 49, leiYearPossible: 128 });
  });
  it("setările se scriu ca numere, cu mesaje în română, iar comutatorul vine din bifă", () => {
    const rest = Object.fromEntries(Object.entries(DEFAULT_SETTINGS).filter(([k]) => k !== "on" && k !== "startedAt").map(([k, v]) => [k, String(v)]));
    const form = { ...rest, on: "on", trialDays: "14", priceLei: "50", priceEur: "10", invitePriceLei: "25", invitePriceEur: "5", bookLei: "99", bookEur: "20", betaDays: "365", trialPersons: "30" };
    expect(PlanSettings.safeParse(form).data).toEqual({ ...DEFAULT_SETTINGS, on: true, startedAt: null, trialDays: 14, priceLei: 50, priceEur: 10, invitePriceLei: 25, invitePriceEur: 5, bookLei: 99, bookEur: 20, betaDays: 365, trialPersons: 30 });
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
  const basic = { kind: "platit", until: null, tier: "basic" } as const;
  const familie = { kind: "platit", until: null, tier: "familie" } as const;
  const premium = { kind: "platit", until: null, tier: "premium" } as const;
  const expirat = { kind: "expirat", since: new Date() } as const;
  const beta = { kind: "beta", until: new Date() } as const;

  it("persoanele: plafonul vine din planul titularului", () => {
    expect(s.trialPersons).toBe(30);
    expect(personRoom(proba, 12, s)).toBe(18);
    expect(personRoom(expirat, 40, s)).toBe(0);
    expect(personRoom(basic, 98, s)).toBe(2);
    expect(personRoom(familie, 500, s)).toBe(0);
    expect(personRoom(beta, 399, s)).toBe(1);
    expect(personRoom(premium, 50_000, s)).toBeNull();
    expect(personRoom({ kind: "mereu" }, 50_000, s)).toBeNull();
    expect(personRoom({ kind: "deschis" }, 50_000, s)).toBeNull();
  });

  it("cotele pe probă, Basic, Familie, Premium, expirat și gratuit mereu", () => {
    expect(limitsFor(proba, s)).toEqual({ persons: 30, photos: 40, audio: 10, docs: 10, writers: 1, trees: 1 });
    expect(limitsFor(expirat, s)).toEqual(limitsFor(proba, s));
    expect(limitsFor(basic, s)).toEqual({ persons: 100, photos: 200, audio: 20, docs: 40, writers: 2, trees: 1 });
    expect(limitsFor(familie, s)).toEqual({ persons: 400, photos: 800, audio: 80, docs: 150, writers: 8, trees: 2 });
    expect(limitsFor(premium, s)).toEqual({ persons: null, photos: 3000, audio: 250, docs: 500, writers: 20, trees: 5 });
    expect(limitsFor(beta, s)).toEqual(limitsFor(familie, s));
    expect(limitsFor({ kind: "mereu" }, s)).toBeNull();
    expect(room(basic, "photos", 198, s)).toEqual({ cap: 200, used: 198, left: 2 });
    expect(room(basic, "photos", 250, s)).toEqual({ cap: 200, used: 250, left: 0 });
    // Plafoanele se schimbă din Admin.
    expect(room({ ...familie }, "audio", 80, { ...s, familieAudio: 100 })?.left).toBe(20);
  });

  it("rudele se invită să scrie doar cât încap în planul titularului; în probă, doar să vadă", () => {
    expect(mayInviteWriters(proba, 1, s)).toBe(false);
    expect(mayInviteWriters(basic, 1, s)).toBe(true);
    expect(mayInviteWriters(basic, 2, s)).toBe(false);
    expect(mayInviteWriters(familie, 7, s)).toBe(true);
    expect(mayInviteWriters(familie, 8, s)).toBe(false);
    expect(mayInviteWriters(premium, 19, s)).toBe(true);
    expect(mayInviteWriters(expirat, 1, s)).toBe(false);
    expect(mayInviteWriters({ kind: "deschis" }, 100, s)).toBe(true);
    expect(holdsYear(expirat)).toBe(false);
  });

  it("cine scrie: la Familie și Premium nu plătește separat; la Basic își plătește anul", () => {
    expect(writesInTree(proba, expirat, false)).toBe(false);
    expect(writesInTree(proba, basic, false)).toBe(true);
    expect(writesInTree(proba, proba, false)).toBe(true);
    expect(writesInTree(proba, expirat, true)).toBe(true);
    expect(writesInTree(basic, expirat, false)).toBe(true);
    expect(writesInTree(expirat, basic, false)).toBe(false);
    expect(writesInTree(expirat, familie, false)).toBe(true);
    expect(writesInTree(expirat, premium, false)).toBe(true);
    expect(writesInTree(expirat, beta, false)).toBe(true);
    expect(writesInTree(expirat, familie, true)).toBe(false);
  });

  it("câți arbori: unul în probă și la Basic, 2 la Familie, 5 la Premium", () => {
    expect(mayStartTree(proba, 0, s)).toBe(true);
    expect(mayStartTree(proba, 1, s)).toBe(false);
    expect(mayStartTree(basic, 1, s)).toBe(false);
    expect(mayStartTree(familie, 1, s)).toBe(true);
    expect(mayStartTree(familie, 2, s)).toBe(false);
    expect(mayStartTree(premium, 4, s)).toBe(true);
    expect(mayStartTree(premium, 5, s)).toBe(false);
    expect(mayStartTree({ kind: "mereu" }, 50, s)).toBe(true);
  });

  it("prețurile pe fiecare plan", () => {
    expect(tierPrice("basic", true, s)).toEqual({ lei: 49, eur: 10 });
    expect(tierPrice("basic", false, { ...s, invitePriceLei: 30 })).toEqual({ lei: 30, eur: 10 });
    expect(tierPrice("familie", true, s)).toEqual({ lei: 149, eur: 30 });
    expect(tierPrice("premium", false, s)).toEqual({ lei: 249, eur: 50 });
    expect(tierBook("basic", s)).toBe("separat");
    expect(tierBook("familie", s)).toBe("una");
    expect(tierBook("premium", s)).toBe("toti");
    expect(tierPrint("premium", s)).toBe(20);
    expect(tierPrint("familie", s)).toBe(0);
  });

  it("anul plătit are planul lui; plățile vechi fără plan sunt Basic", () => {
    const on = { ...s, on: true, startedAt: "2026-11-13T00:00:00.000Z" };
    const now = new Date("2027-01-01");
    expect(accessFor({ createdAt: new Date("2026-12-01"), plan: "familie", paidUntil: new Date("2027-06-01") }, on, now)).toMatchObject({ kind: "platit", tier: "basic" });
    expect(accessFor({ createdAt: new Date("2026-12-01"), plan: "familie", paidUntil: new Date("2027-06-01"), tier: "premium" }, on, now)).toMatchObject({ kind: "platit", tier: "premium" });
  });
});

describe("pornirea vânzării, o singură dată", () => {
  it("pornește plățile la prima rulare și nu le repornește după o oprire din Admin", async () => {
    const d = createDb(); await runMigrations(d);
    expect(await startSalesOnce(d, new Date("2026-11-13T00:00:00Z"))).toBe("pornit");
    expect(await planSettings(d)).toMatchObject({ on: true, startedAt: "2026-11-13T00:00:00.000Z", priceLei: 49, trialDays: 7 });
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, on: false }, null as unknown as string);
    expect(await startSalesOnce(d)).toBe("deja");
    expect((await planSettings(d)).on).toBe(false);
  });
});

describe("Basic 49 lei, o singură dată", () => {
  it("schimbă 50 în 49 la Basic și la ruda invitată, lasă un alt preț pus din Admin și nu mai repetă", async () => {
    const d = createDb(); await runMigrations(d);
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, on: true, priceLei: 50, invitePriceLei: 40 }, null as unknown as string);
    expect(await basicPrice49Once(d)).toBe("schimbat");
    expect(await planSettings(d)).toMatchObject({ on: true, priceLei: 49, invitePriceLei: 40, familieLei: 149 });
    await savePlanSettings(d, { ...(await planSettings(d)), priceLei: 50 }, null as unknown as string);
    expect(await basicPrice49Once(d)).toBe("deja");
    expect((await planSettings(d)).priceLei).toBe(50);
  });
});

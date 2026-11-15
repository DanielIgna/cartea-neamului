import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { account, accountPlan, appSetting, inviteReferral, knownDevice, person, session, tree, treeMember, user, userNotice } from "@/db/schema";
import {
  baseEmail, checkReward, cleanCode, codeFromRequest, DEFAULT_INVITE, ensureInviteCode, isDisposable, isInviteCode, myInvites, ownerOfCode,
  recordClick, referralOnSignup, saveInviteSettings, setShareTree, sweepRewards,
} from "@/lib/invitatii";
import { DEFAULT_SETTINGS, accessFor } from "@/lib/plans";
import { deviceHash } from "@/lib/securitate";

const DAY = 86_400_000;
const T0 = new Date("2027-02-01T10:00:00Z");
const headersFor = (o: { cookie?: string; ip?: string; referer?: string }) =>
  new Headers({ ...(o.cookie ? { cookie: o.cookie } : {}), ...(o.ip ? { "x-forwarded-for": o.ip } : {}), ...(o.referer ? { referer: o.referer } : {}) });

describe("programul de invitații: piesele mici", () => {
  it("codul: 7 semne fără 0/O/1/I, curățat din adresă", () => {
    expect(isInviteCode("ABCD234")).toBe(true);
    expect(isInviteCode("ABCD0O1")).toBe(false);
    expect(cleanCode(" abcd-234 ")).toBe("ABCD234");
  });
  it("emailul de bază și emailurile de unică folosință", () => {
    expect(baseEmail("Ion.Pop+test@gmail.com")).toBe("ionpop@gmail.com");
    expect(baseEmail("ion.pop+x@yahoo.com")).toBe("ion.pop@yahoo.com");
    expect(isDisposable("x@mailinator.com")).toBe(true);
    expect(isDisposable("x@eu.yopmail.com")).toBe(true);
    expect(isDisposable("x@gmail.com")).toBe(false);
  });
  it("codul vine din cookie sau, ca rezervă, din adresa paginii de cont nou", () => {
    expect(codeFromRequest(headersFor({ cookie: "a=1; cn-invitat=ABCD234" }))).toBe("ABCD234");
    expect(codeFromRequest(headersFor({ referer: "https://carteaneamului.ro/intrare?mod=cont-nou&inv=abcd234" }))).toBe("ABCD234");
    expect(codeFromRequest(headersFor({}))).toBeNull();
  });
  it("zilele câștigate lungesc perioada gratuită și primul an din beta", () => {
    const s = { ...DEFAULT_SETTINGS, on: true, startedAt: "2027-01-01T00:00:00Z" };
    const createdAt = new Date("2027-02-01T00:00:00Z");
    const later = new Date("2027-02-10T00:00:00Z");
    expect(accessFor({ createdAt, plan: null, paidUntil: null }, s, later).kind).toBe("expirat");
    expect(accessFor({ createdAt, plan: null, paidUntil: null, freeUntil: new Date("2027-02-15T00:00:00Z") }, s, later)).toMatchObject({ kind: "proba", daysLeft: 5 });
  });
});

describe("programul de invitații: fluxul întreg", () => {
  let db: Db;
  let code = "";
  const mailed: { userId: string; who: string; days: number }[] = [];
  const mail = async (_db: unknown, userId: string, who: string, days: number) => { mailed.push({ userId, who, days }); return null; };

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    // Vânzarea pornită de pe 1 ianuarie 2027: 7 zile gratuite pentru conturile noi.
    await db.insert(appSetting).values({ key: "planuri", value: { ...DEFAULT_SETTINGS, on: true, startedAt: "2027-01-01T00:00:00Z" } });
    await db.insert(user).values({ id: "ana", name: "Ana Pop", email: "ana.pop@gmail.com", createdAt: T0 });
    code = await ensureInviteCode(db, "ana");
    // Ana a intrat de pe telefonul ei, de la o adresă IP.
    await db.insert(knownDevice).values({ userId: "ana", deviceHash: deviceHash("telefon-ana") });
    await db.insert(session).values({ id: "s1", token: "t1", userId: "ana", expiresAt: new Date(T0.getTime() + 30 * DAY), ipAddress: "10.0.0.1", updatedAt: T0 });
    const [t] = await db.insert(tree).values({ name: "Neamul Pop", ownerId: "ana" }).returning({ id: tree.id });
    await db.insert(treeMember).values({ treeId: t.id, userId: "ana", role: "owner" });
    expect(await setShareTree(db, "ana", t.id)).toBe(true);
  });

  it("codul e unic, același la a doua cerere, și duce la Ana", async () => {
    expect(await ensureInviteCode(db, "ana")).toBe(code);
    expect((await ownerOfCode(db, code))?.userId).toBe("ana");
    await recordClick(db, "ana", T0);
    await recordClick(db, "ana", T0);
  });

  it("link → cont nou → confirmare + o rudă → câte 7 zile la amândoi", async () => {
    const t1 = new Date(T0.getTime() + DAY);
    await db.insert(user).values({ id: "ion", name: "Ion Pop", email: "ion@yahoo.com", createdAt: t1 });
    const row = await referralOnSignup(db, { id: "ion", email: "ion@yahoo.com" }, headersFor({ cookie: `cn-invitat=${code}`, ip: "10.9.9.9" }));
    expect(row).toMatchObject({ referrerId: "ana", status: "asteapta", via: "link" });
    // Ion vede arborele ales de Ana, doar citire, și o veste de bun venit.
    const [m] = await db.select().from(treeMember).where(eq(treeMember.userId, "ion"));
    expect(m.role).toBe("viewer");
    expect((await db.select().from(userNotice).where(eq(userNotice.userId, "ion")))[0].kind).toBe("invitatie-bun-venit");

    // Fără dovadă, nimic.
    expect((await checkReward(db, "ion", t1, mail)).status).toBe("asteapta");
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, "ion"));
    expect((await checkReward(db, "ion", t1, mail)).status).toBe("asteapta");
    // Fișa lui proprie nu e destul; o rudă adăugată, da.
    const [mt] = await db.insert(tree).values({ name: "Ion", ownerId: "ion" }).returning({ id: tree.id });
    await db.insert(person).values({ treeId: mt.id, givenName: "Ion", createdBy: "ion", claimedByUserId: "ion" });
    expect((await checkReward(db, "ion", t1, mail)).status).toBe("asteapta");
    await db.insert(person).values({ treeId: mt.id, givenName: "Gheorghe", createdBy: "ion" });
    const r = await checkReward(db, "ion", t1, mail);
    expect(r).toMatchObject({ status: "acordat", referrerDays: 7, referredDays: 7 });
    // A doua oară nu se mai dă nimic.
    expect((await checkReward(db, "ion", t1, mail)).status).toBe("nimic");

    const s = { ...DEFAULT_SETTINGS, on: true, startedAt: "2027-01-01T00:00:00Z" };
    const get = async (id: string) => (await db.select().from(user).where(eq(user.id, id)))[0];
    const ana = await get("ana"), ion = await get("ion");
    // Ana: 7 zile de la cont + 7 câștigate = 14; Ion: 7 + 7 = 14 zile gratuite.
    expect(ana.freeUntil!.getTime()).toBe(T0.getTime() + 14 * DAY);
    expect(ion.freeUntil!.getTime()).toBe(t1.getTime() + 14 * DAY);
    const day12 = new Date(t1.getTime() + 12 * DAY);
    expect(accessFor({ createdAt: ion.createdAt, plan: null, paidUntil: null, freeUntil: ion.freeUntil }, s, day12).kind).toBe("proba");
    expect(accessFor({ createdAt: ion.createdAt, plan: null, paidUntil: null }, s, day12).kind).toBe("expirat");

    // Veștile și emailul.
    const kinds = async (id: string) => (await db.select().from(userNotice).where(eq(userNotice.userId, id))).filter((n) => !n.readAt).map((n) => n.kind);
    expect(await kinds("ana")).toEqual(["invitatie-rasplata"]);
    expect(await kinds("ion")).toEqual(["invitatie-primita"]);
    expect(mailed).toEqual([{ userId: "ana", who: "Ion", days: 7 }]);

    const mine = await myInvites(db, "ana");
    expect(mine).toMatchObject({ clicks: 2, accounts: 1, rewarded: 1, daysEarned: 7 });
  });

  it("cu Google nu mai trebuie confirmat emailul; la anul plătit zilele se adaugă la an", async () => {
    const t2 = new Date(T0.getTime() + 2 * DAY);
    const paid = new Date("2027-12-01T00:00:00Z");
    await db.insert(accountPlan).values({ userId: "ana", plan: "familie", paidUntil: paid, tier: "basic" });
    await db.insert(user).values({ id: "maria", name: "Maria", email: "maria@outlook.com", createdAt: t2 });
    await referralOnSignup(db, { id: "maria", email: "maria@outlook.com" }, headersFor({ cookie: `cn-invitat=${code}` }));
    await db.insert(account).values({ id: "g1", accountId: "g-maria", providerId: "google", userId: "maria" });
    const [mt] = await db.insert(tree).values({ name: "Maria", ownerId: "maria" }).returning({ id: tree.id });
    await db.insert(person).values({ treeId: mt.id, givenName: "Mama", createdBy: "maria" });
    expect((await checkReward(db, "maria", t2, mail)).status).toBe("acordat");
    const [ap] = await db.select().from(accountPlan).where(eq(accountPlan.userId, "ana"));
    expect(ap.paidUntil!.getTime()).toBe(paid.getTime() + 7 * DAY);
  });

  it("nu se socotește invitarea propriei persoane: același email, telefon, IP sau email temporar", async () => {
    const cases = [
      { id: "a2", email: "anapop+2@gmail.com", h: {}, reason: "acelasi-email" },
      { id: "a3", email: "alt@yahoo.com", h: { cookie: `cn_dispozitiv=telefon-ana` }, reason: "acelasi-dispozitiv" },
      { id: "a4", email: "altul@yahoo.com", h: { ip: "10.0.0.1" }, reason: "aceeasi-ip" },
      { id: "a5", email: "x@mailinator.com", h: {}, reason: "email-temporar" },
    ];
    for (const c of cases) {
      await db.insert(user).values({ id: c.id, name: "X", email: c.email, createdAt: T0 });
      const cookie = [`cn-invitat=${code}`, (c.h as { cookie?: string }).cookie].filter(Boolean).join("; ");
      const row = await referralOnSignup(db, { id: c.id, email: c.email }, headersFor({ ...c.h, cookie }));
      expect(row, c.id).toMatchObject({ status: "respins", reason: c.reason });
    }
  });

  it("peste limita lunară, invitatul își primește zilele, cel care invită nu", async () => {
    await saveInviteSettings(db, { ...DEFAULT_INVITE, monthlyCap: 2 }, null);
    const t3 = new Date(T0.getTime() + 3 * DAY);
    await db.insert(user).values({ id: "dan", name: "Dan", email: "dan@yahoo.com", emailVerified: true, createdAt: t3 });
    await referralOnSignup(db, { id: "dan", email: "dan@yahoo.com" }, headersFor({ cookie: `cn-invitat=${code}` }), t3);
    const [mt] = await db.insert(tree).values({ name: "Dan", ownerId: "dan" }).returning({ id: tree.id });
    await db.insert(person).values({ treeId: mt.id, givenName: "Tata", createdBy: "dan" });
    // Verificarea zilnică o găsește și pe ea.
    expect(await sweepRewards(db, t3)).toMatchObject({ given: 1 });
    const [r] = await db.select().from(inviteReferral).where(eq(inviteReferral.referredId, "dan"));
    expect(r).toMatchObject({ status: "acordat", reason: "limita-lunara", daysReferrer: 0, daysReferred: 7 });
  });
});

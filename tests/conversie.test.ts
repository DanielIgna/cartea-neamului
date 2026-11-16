import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, appSetting, consent, conversionMail, conversionOffer, person, tree, treeMember, user } from "@/db/schema";
import {
  DEFAULT_CONV, activeOffer, afterPayment, checkMailSig, checkUnsub, conversionStats, dueAt, mailSig, pickStep, safePath, trackMail, unsubToken, withUtm,
} from "@/lib/conversie";
import { runConversion } from "@/lib/conversie-mail";
import type { EmailMessage } from "@/lib/email";
import { DEFAULT_SETTINGS, accessFor } from "@/lib/plans";

const DAY = 86_400_000;
const HOUR = 3_600_000;
// Contul de test: făcut luni, 1 februarie 2027, la 10:00 (UTC); vânzarea pornită din ianuarie.
const T0 = new Date("2027-02-01T10:00:00Z");
const PS = { ...DEFAULT_SETTINGS, on: true, startedAt: "2027-01-01T00:00:00Z" };
const at = (day: number) => new Date(T0.getTime() + (day - 1) * DAY + HOUR);

describe("conversia: zilele, pur", () => {
  it("ziua d începe la start + (d − 1) zile; pașii de la sfârșit se mută cu zilele câștigate", () => {
    const end = new Date(T0.getTime() + 7 * DAY);
    expect(dueAt(1, T0, end, 7)).toEqual(T0);
    expect(dueAt(7, T0, end, 7)).toEqual(new Date(end.getTime() - DAY));
    expect(dueAt(8, T0, end, 7)).toEqual(end);
    const longer = new Date(end.getTime() + 7 * DAY);
    expect(dueAt(3, T0, longer, 7)).toEqual(new Date(T0.getTime() + 2 * DAY));
    expect(dueAt(8, T0, longer, 7)).toEqual(longer);
  });
  it("un singur pas pe zi, cel mai nou, niciodată unul mai vechi decât cel trimis", () => {
    const pick = (day: number, sent: string[] = [], extra?: Date) => {
      const now = at(day);
      const access = accessFor({ createdAt: T0, plan: null, paidUntil: null, freeUntil: extra ?? null }, PS, now);
      const trialEnd = access.kind === "proba" ? access.until : access.kind === "expirat" ? access.since : now;
      return pickStep({ access, start: T0, trialEnd, trialDays: 7, sent: new Set(sent), s: DEFAULT_CONV, now });
    };
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => pick(d))).toEqual(["bunvenit", "bunvenit", "progres", "progres", "planuri", "planuri", "ultimazi"]);
    expect(pick(8)).toBe("reducere");
    expect(pick(14, ["reducere"])).toBe("asteapta");
    expect(pick(5, ["ultimazi"])).toBeNull();
    // Peste fereastra de 3 zile nu mai pleacă un pas pierdut.
    expect(pick(20)).toBeNull();
    // Cu 7 zile câștigate din invitații, „se încheie azi” vine în ziua 14, iar reducerea în ziua 15.
    const ext = new Date(T0.getTime() + 14 * DAY);
    expect(pick(7, ["planuri"], ext)).toBeNull();
    expect(pick(14, ["planuri"], ext)).toBe("ultimazi");
    expect(pick(15, ["ultimazi"], ext)).toBe("reducere");
  });
  it("legăturile: doar adrese din site, cu semnele campaniei; semnăturile nu se pot ghici", () => {
    expect(safePath("https://rau.example")).toBe("/");
    expect(safePath("//rau.example")).toBe("/");
    expect(safePath("/plata?x=1")).toBe("/plata?x=1");
    expect(withUtm("/plata", "ultimazi")).toBe("/plata?utm_source=email&utm_medium=email&utm_campaign=conversie-ultimazi");
    expect(checkUnsub("ana", unsubToken("ana"))).toBe(true);
    expect(checkUnsub("ion", unsubToken("ana"))).toBe(false);
    expect(checkMailSig("m1", mailSig("m1"))).toBe(true);
    expect(checkMailSig("m2", mailSig("m1"))).toBe(false);
  });
});

describe("conversia: contul de test, cu zilele mutate de la 1 la 15", () => {
  let db: Db;
  const sent: EmailMessage[] = [];
  const mailer = async (m: EmailMessage) => { sent.push(m); return { ok: true as const, id: `re_${sent.length}` }; };
  const day = (d: number) => runConversion(db, { now: at(d), mailer, localOffer: true, site: "https://test.local" });

  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(appSetting).values({ key: "planuri", value: PS });
    await db.insert(user).values([
      { id: "ana", name: "Ana Pop", email: "ana.pop@exemplu.ro", locale: "ro", createdAt: T0 },
      { id: "ion", name: "Ion Rus", email: "ion@exemplu.ro", locale: "de", createdAt: T0 },
      { id: "vechi", name: "Maria", email: "maria@exemplu.ro", createdAt: new Date("2026-12-01T00:00:00Z") },
    ]);
    const [t] = await db.insert(tree).values({ name: "Neamul Pop", ownerId: "ana" }).returning({ id: tree.id });
    await db.insert(treeMember).values({ treeId: t.id, userId: "ana", role: "owner" });
    for (const g of ["Ana", "Avram", "Floarea", "Iosif"]) await db.insert(person).values({ treeId: t.id, givenName: g, createdBy: "ana" });
  });

  it("ziua 1: bun venit cu 3 pași, în limba fiecăruia, cu dezabonare și urmărire", async () => {
    const r = await day(1);
    expect(r.sent).toBe(2);
    const ana = sent.find((m) => m.to === "ana.pop@exemplu.ro")!;
    expect(ana.subject).toContain("Bun venit");
    expect(ana.text).toContain("Bună, Ana!");
    expect(ana.text).toContain("Adaugă-ți părinții");
    expect(ana.text).toContain("https://test.local/dezabonare?l=conversie&u=ana&t=");
    expect(ana.headers?.["List-Unsubscribe"]).toContain("/api/vesti/dezabonare?l=conversie&u=ana");
    expect(ana.html).toContain("/api/conversie/o?m=");
    expect(ana.html).toContain("/api/conversie/c?m=");
    expect(sent.find((m) => m.to === "ion@exemplu.ro")!.subject).toContain("Willkommen");
    // Contul de dinainte de pornirea vânzării (beta) nu primește nimic.
    expect(sent.some((m) => m.to === "maria@exemplu.ro")).toBe(false);
    // A doua rulare în aceeași zi nu mai trimite.
    expect((await day(1)).sent).toBe(0);
  });

  it("ziua 2 nimic; ziua 3: „Arborele tău are deja 4 persoane” + invitația", async () => {
    expect((await day(2)).sent).toBe(0);
    sent.length = 0;
    await day(3);
    const ana = sent.find((m) => m.to === "ana.pop@exemplu.ro")!;
    expect(ana.subject).toBe("Arborele tău are deja 4 persoane");
    expect(ana.text).toContain("u=%2Finvitatii%3Futm_source%3Demail");
  });

  it("Ion se dezabonează: nu mai primește nimic", async () => {
    await db.insert(consent).values({ userId: "ion", purpose: "conversie", textVersion: "t", granted: false, createdAt: at(4) });
    sent.length = 0;
    await day(5);
    expect(sent.map((m) => m.to)).toEqual(["ana.pop@exemplu.ro"]);
    expect(sent[0].subject).toContain("Ce primești");
    expect(sent[0].text).toContain("Familie");
  });

  it("ziua 7: „Perioada ta gratuită se încheie azi”; ziua 8: cod unic −20%, 48 de ore", async () => {
    sent.length = 0;
    await day(7);
    expect(sent[0].subject).toBe("Perioada ta gratuită se încheie azi");
    sent.length = 0;
    await day(8);
    expect(sent[0].subject).toBe("20% reducere pentru tine, doar 48 de ore");
    const [o] = await db.select().from(conversionOffer).where(eq(conversionOffer.userId, "ana"));
    expect(o.code).toMatch(/^CN[A-Z2-9]{8}$/);
    expect(o.percent).toBe(20);
    expect(o.expiresAt.getTime() - at(8).getTime()).toBe(48 * HOUR);
    expect(sent[0].text).toContain(o.code);
    expect(await activeOffer(db, "ana", new Date(at(8).getTime() + 47 * HOUR))).not.toBeNull();
    expect(await activeOffer(db, "ana", new Date(at(8).getTime() + 49 * HOUR))).toBeNull();
  });

  it("deschiderea, clicul și plata cu reducerea se trec la emailul din ziua 8", async () => {
    const [m] = await db.select().from(conversionMail).where(eq(conversionMail.step, "reducere"));
    await trackMail(db, m.id, "open", at(8));
    await trackMail(db, m.id, "click", at(8));
    const [o] = await db.select().from(conversionOffer).where(eq(conversionOffer.userId, "ana"));
    await afterPayment(db, { id: "cs_test_1", kind: "an", userId: "ana", amount: 3920, currency: "ron", offer: o.code }, new Date(at(8).getTime() + 2 * HOUR));
    const [after] = await db.select().from(conversionMail).where(eq(conversionMail.id, m.id));
    expect(after).toMatchObject({ opens: 1, clicks: 1, paymentId: "cs_test_1", amount: 3920 });
    const [used] = await db.select().from(conversionOffer).where(eq(conversionOffer.userId, "ana"));
    expect(used.usedAt).not.toBeNull();
    // A doua oară codul nu mai e bun.
    expect(await activeOffer(db, "ana", at(8))).toBeNull();
  });

  it("după plată, ziua 14 nu mai trimite nimic; fără plată ar fi plecat ultima reamintire", async () => {
    await db.insert(accountPlan).values({ userId: "ana", plan: "familie", paidUntil: new Date(at(8).getTime() + 365 * DAY), tier: "basic" });
    sent.length = 0;
    expect((await day(14)).sent).toBe(0);
    await db.delete(accountPlan).where(eq(accountPlan.userId, "ana"));
    await day(14);
    expect(sent[0].subject).toBe("Arborele tău te așteaptă");
    expect(sent[0].text).toContain("4 persoane");
    expect((await day(15)).sent).toBe(0);
  });

  it("Analiză → Conversii: rata pe fiecare email și banii din reducere", async () => {
    const s = await conversionStats(db, { from: "2027-01-01", to: "2027-03-01" });
    const by = Object.fromEntries(s.steps.map((x) => [x.step, x]));
    expect(by.bunvenit.sent).toBe(2);
    expect(by.reducere).toMatchObject({ sent: 1, opened: 1, clicked: 1, paid: 1, lei: 39.2 });
    expect(s.offers).toMatchObject({ made: 1, used: 1, lei: 39.2 });
    expect(s.optOuts).toBe(1);
  });

  it("simulatorul nu scrie nimic și nu trimite", async () => {
    const before = (await db.select().from(conversionMail)).length;
    const r = await runConversion(db, { now: at(5), onlyUserId: "ana", dryRun: true, simulate: true });
    expect(r.previews[0].step).toBe("planuri");
    expect((await db.select().from(conversionMail)).length).toBe(before);
  });
});

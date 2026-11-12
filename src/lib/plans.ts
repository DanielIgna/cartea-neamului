/**
 * Planurile și accesul, din panoul de admin („Manager control”). Cât timp plățile nu sunt pornite de acolo, nu e oprit nimeni.
 * Cel care ține site-ul alege cine rămâne gratuit pentru totdeauna (familia, prietenii) și până când a plătit fiecare.
 *
 * Ce rămâne mereu gratuit, orice plan ar avea omul: vederea arborelui, descărcarea arborelui (GEDCOM) și a datelor
 * din „Datele mele” (o cere și legea). După zilele gratuite, fără plată, arborii se pot doar vedea, nu se șterge nimic.
 */
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { accountPlan, appSetting } from "@/db/schema";
import { isPlan, type Plan } from "./plan-names";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
export { PLANS, isPlan, type Plan } from "./plan-names";

const num = (min: number, max: number, what: string) => z.coerce.number({ invalid_type_error: "Scrie un număr." })
  .min(min, min === 0 ? "Prețul nu poate fi negativ." : `Cel puțin ${min} ${what}.`).max(max, "E prea mult.");
const flag = z.preprocess((v) => v === true || v === "on" || v === "true" || v === "1", z.boolean());

/**
 * Modelul de plată ales de Daniel pe 2026-11-12: fiecare om (cel care pornește arborele și fiecare rudă invitată) are câteva
 * zile gratuite cu totul deschis; după ele poate doar să vadă, până plătește anul (50 lei / 10 €). Cartea PDF se plătește separat.
 * `on` pornește regulile în site; până atunci nu e oprit nimeni. `startedAt` e ziua pornirii: cine avea cont dinainte primește
 * zilele gratuite de atunci, nu de la facerea contului.
 */
export const PlanSettings = z.object({
  on: flag,
  startedAt: z.string().datetime().nullable().catch(null),
  trialDays: num(1, 90, "zile").int("Scrie un număr întreg."),
  priceLei: num(0, 5000, ""),
  priceEur: num(0, 1000, ""),
  invitePriceLei: num(0, 5000, ""),
  invitePriceEur: num(0, 1000, ""),
  bookLei: num(0, 5000, ""),
  bookEur: num(0, 1000, ""),
  betaDays: num(0, 3650, "zile").int("Scrie un număr întreg."),
});
export type PlanSettings = z.infer<typeof PlanSettings>;
export const DEFAULT_SETTINGS: PlanSettings = {
  on: false, startedAt: null, trialDays: 7, priceLei: 50, priceEur: 10, invitePriceLei: 50, invitePriceEur: 10, bookLei: 99, bookEur: 20,
  // Cei care au testat site-ul înainte de pornirea plăților au primul an gratuit (alegerea lui Daniel, 2026-11-12).
  betaDays: 365,
};
const KEY = "planuri";

/** Setările plăților, cum le-a lăsat cel care ține site-ul (sau cele propuse, dacă nu le-a schimbat). */
export async function planSettings(db: Pick<Db, "select">): Promise<PlanSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = PlanSettings.safeParse({ ...DEFAULT_SETTINGS, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

/** Salvează setările; ziua pornirii se ține minte prima dată când se pornesc plățile și se uită când se opresc. */
export async function savePlanSettings(db: Pick<Db, "insert" | "select">, v: PlanSettings, by: string, now = new Date()) {
  const before = await planSettings(db);
  const value: PlanSettings = { ...v, startedAt: v.on ? (before.on && before.startedAt ? before.startedAt : now.toISOString()) : null };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  return value;
}

/** Planul ales pentru un cont; „gratuit” fără notă și fără plată șterge alegerea, ca omul să fie din nou ca toți. */
export async function setAccountPlan(db: Pick<Db, "insert" | "delete">, userId: string, plan: Plan, note: string | null, by: string, now = new Date(),
  paidUntil: Date | null = null) {
  const clean = note?.trim().slice(0, 200) || null;
  if (plan === "gratuit" && !clean && !paidUntil) {
    await db.delete(accountPlan).where(eq(accountPlan.userId, userId));
    return;
  }
  await db.insert(accountPlan).values({ userId, plan, note: clean, paidUntil, setBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: accountPlan.userId, set: { plan, note: clean, paidUntil, setBy: by, updatedAt: now } });
}

export type AccountPlanRow = { plan: Plan; note: string | null; paidUntil: string | null; updatedAt: string | null };
export async function accountPlans(db: Pick<Db, "select">): Promise<Map<string, AccountPlanRow>> {
  const rows = await db.select().from(accountPlan);
  return new Map(rows.map((r) => [r.userId, {
    plan: isPlan(r.plan) ? r.plan : "gratuit", note: r.note, paidUntil: r.paidUntil?.toISOString() ?? null, updatedAt: r.updatedAt?.toISOString() ?? null,
  }]));
}

const DAY = 86_400_000;
/**
 * Ce poate face un om acum:
 * - „deschis”: plățile nu sunt pornite, toți pot tot (ca până acum);
 * - „mereu”: gratuit pentru totdeauna (familia, prietenii, contul demo, cel care ține site-ul);
 * - „platit”: are anul plătit (fără dată = pus „Familie” de mână, fără termen);
 * - „beta”: avea cont înainte de pornirea plăților, deci are primul an gratuit (`betaDays` de la pornire);
 * - „proba”: e în zilele gratuite;
 * - „expirat”: zilele gratuite (sau anul plătit) s-au terminat: arborii lui sunt doar de citit până plătește.
 * Fiecare om are zilele lui: și cel care pornește arborele, și fiecare rudă invitată (alegerea lui Daniel din 2026-11-12).
 */
export type Access =
  | { kind: "deschis" }
  | { kind: "mereu" }
  | { kind: "platit"; until: Date | null }
  | { kind: "beta"; until: Date }
  | { kind: "proba"; until: Date; daysLeft: number }
  | { kind: "expirat"; since: Date };

export function accessFor(a: { createdAt: Date; plan: Plan | null; paidUntil: Date | null; exempt?: boolean }, s: PlanSettings, now = new Date()): Access {
  if (!s.on) return { kind: "deschis" };
  if (a.exempt || a.plan === "mereu") return { kind: "mereu" };
  if (a.paidUntil && a.paidUntil > now) return { kind: "platit", until: a.paidUntil };
  if (a.plan === "familie" && !a.paidUntil) return { kind: "platit", until: null };
  const started = s.startedAt ? new Date(s.startedAt) : now;
  if (s.betaDays > 0 && a.createdAt < started) {
    const betaEnd = new Date(started.getTime() + s.betaDays * DAY);
    if (now < betaEnd) return { kind: "beta", until: betaEnd };
    return { kind: "expirat", since: a.paidUntil && a.paidUntil > betaEnd ? a.paidUntil : betaEnd };
  }
  const from = Math.max(a.createdAt.getTime(), started.getTime());
  const trialEnd = new Date(from + s.trialDays * DAY);
  if (now < trialEnd) return { kind: "proba", until: trialEnd, daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / DAY) };
  return { kind: "expirat", since: a.paidUntil && a.paidUntil > trialEnd ? a.paidUntil : trialEnd };
}
export const mayWrite = (a: Access) => a.kind !== "expirat";

/** Prețul anului pentru un om: cel care are un arbore al lui plătește prețul întreg, ruda invitată prețul pentru invitați. */
export const yearPrice = (ownsTree: boolean, s: PlanSettings) =>
  ownsTree ? { lei: s.priceLei, eur: s.priceEur } : { lei: s.invitePriceLei, eur: s.invitePriceEur };

/** Câți plătesc acum și cât ar aduce anul dacă toți cei în probă sau cu timpul expirat ar plăti. */
export function revenue(people: { access: Access; ownsTree: boolean }[], s: PlanSettings) {
  let paying = 0, leiNow = 0, wouldPay = 0, leiPossible = 0;
  for (const p of people) {
    const { lei } = yearPrice(p.ownsTree, s);
    if (p.access.kind === "platit") { paying++; leiNow += lei; leiPossible += lei; }
    if (p.access.kind === "proba" || p.access.kind === "expirat") { wouldPay++; leiPossible += lei; }
  }
  return { paying, wouldPay, leiYearNow: leiNow, leiYearPossible: leiPossible };
}

/** Mărimea fiecărui arbore: persoane și fișiere (poze, acte, înregistrări), cu proprietarul lui. Doar citiri. */
export async function treeSizes(db: Db) {
  const r = await db.execute(sql`select t.id, t.name, t.owner_id, t.created_at,
      (select count(*) from person p where p.tree_id = t.id) as persons,
      (select count(*) from document d where d.tree_id = t.id and d.file_key is not null) as files,
      (select count(*) from tree_member m where m.tree_id = t.id) as members
    from tree t order by persons desc`);
  return ((r.rows ?? []) as Record<string, unknown>[]).map((x) => ({
    id: String(x.id), name: String(x.name), ownerId: (x.owner_id as string) ?? null, createdAt: x.created_at ? new Date(x.created_at as string).toISOString() : null,
    persons: Number(x.persons ?? 0), files: Number(x.files ?? 0), members: Number(x.members ?? 0),
  }));
}

/** Oamenii cu ce le trebuie pentru acces: când și-au făcut contul, dacă sunt scutiți și dacă au un arbore al lor. */
export async function accessPeople(db: Db) {
  const r = await db.execute(sql`select u.id, u.email, u.email_verified, u.created_at,
      exists (select 1 from tree t where t.owner_id = u.id) as owns
    from "user" u`);
  return ((r.rows ?? []) as Record<string, unknown>[]).map((x) => {
    const createdAt = new Date(x.created_at as string);
    const email = String(x.email ?? "");
    return { id: String(x.id), createdAt, ownsTree: !!x.owns, exempt: isDemo(email) || isAdminUser({ email, emailVerified: !!x.email_verified, createdAt }) };
  });
}

export type PlanOverview = Awaited<ReturnType<typeof planOverview>>;

/**
 * Totul despre plăți dintr-o privire: setările, planul și accesul fiecărui om și ce ar aduce. Cât timp plățile sunt oprite,
 * accesul se socotește ca și cum ar fi pornite azi, ca să se vadă dinainte ce s-ar întâmpla.
 */
export async function planOverview(db: Db, now = new Date()) {
  const settings = await planSettings(db);
  const sim: PlanSettings = settings.on ? settings : { ...settings, on: true, startedAt: now.toISOString() };
  const plans = await accountPlans(db);
  const people = await accessPeople(db);
  const access = new Map<string, Access>();
  for (const p of people) {
    const ap = plans.get(p.id);
    access.set(p.id, accessFor({ createdAt: p.createdAt, plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, exempt: p.exempt }, sim, now));
  }
  const planOf = (uid: string | null): Plan => (uid ? plans.get(uid)?.plan ?? "gratuit" : "gratuit");
  const trees = (await treeSizes(db)).map((t) => ({ ...t, plan: planOf(t.ownerId), access: t.ownerId ? access.get(t.ownerId) ?? null : null }));
  const kinds = [...access.values()].map((a) => a.kind);
  return {
    settings, plans, trees, access,
    revenue: revenue(people.map((p) => ({ access: access.get(p.id)!, ownsTree: p.ownsTree })), sim),
    counts: {
      mereu: kinds.filter((k) => k === "mereu").length,
      platit: kinds.filter((k) => k === "platit").length,
      proba: kinds.filter((k) => k === "proba").length,
      expirat: kinds.filter((k) => k === "expirat").length,
      beta: kinds.filter((k) => k === "beta").length,
    },
  };
}

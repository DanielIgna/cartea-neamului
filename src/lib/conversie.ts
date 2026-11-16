/**
 * Conversia din zilele gratuite în plătit (Daniel, 16 noiembrie 2026). Înregistrarea rămâne fără card; în zilele gratuite și
 * puțin după ele, site-ul îl ajută pe om să ajungă la un plan:
 *
 * - șase emailuri (ziua 1, 3, 5, 7, 8 și 14; zilele se schimbă din Admin → Conversie), în limba omului, prin Resend, cu datele
 *   lui (prenumele, câte persoane are arborele, zilele rămase, legătura lui de invitație, prețurile din Admin). Fiecare are
 *   dezabonare dintr-un clic (pagină + antetul List-Unsubscribe) și pleacă doar cât automatizarea „conversie” din Admin →
 *   Autonomie e pornită (oprită până o pornește Daniel). Cel mult un email pe zi; un pas pierdut (automatizarea a fost oprită)
 *   nu se mai trimite după 3 zile, ca un cont vechi să nu primească tot șirul deodată;
 * - în ziua 8 (prima zi după zilele gratuite): un cod unic de reducere (implicit 20%), făcut ca cod promoțional în Stripe, cu o
 *   singură folosire și care expiră singur după 48 de ore; pe /plata se aplică singur;
 * - deschiderile (o poză de 1×1 în email) și clicurile (legătura trece prin /api/conversie/c) se numără pe fiecare email, iar plata
 *   de după se trece la ultimul email pe care omul a apăsat (sau, fără clic, la ultimul primit) în 7 zile;
 * - în cont: banda „Mai ai X zile gratuite” (AccessBanner), fereastra din ultima zi și, după expirare, reducerea în bandă.
 *
 * După zilele gratuite nu se șterge nimic: arborele se vede, doar adăugarea, schimbarea, invitațiile și descărcarea lui se
 * deschid din nou cu un plan (src/lib/plans.ts, src/lib/plata.ts).
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting, conversionMail, conversionOffer } from "@/db/schema";
import type { Access } from "./plans";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;
const HOUR = 3_600_000;

/* ---------- Pașii și setările ---------- */

/** Pașii șirului, în ordine: bun venit, progresul, planurile, ultima zi, reducerea, ultima reamintire. */
export const STEPS = ["bunvenit", "progres", "planuri", "ultimazi", "reducere", "asteapta"] as const;
export type Step = (typeof STEPS)[number];
export const isStep = (v: unknown): v is Step => typeof v === "string" && (STEPS as readonly string[]).includes(v);
/** Pașii din zilele gratuite și cei de după ele. */
const TRIAL_STEPS: readonly Step[] = ["bunvenit", "progres", "planuri", "ultimazi"];
const AFTER_STEPS: readonly Step[] = ["reducere", "asteapta"];
export const STEP_LABEL: Record<Step, string> = {
  bunvenit: "Bun venit + 3 pași", progres: "„Arborele tău are deja N persoane” + invitație", planuri: "Ce primești cu abonamentul",
  ultimazi: "„Perioada gratuită se încheie azi”", reducere: "Reducerea de după (cod unic)", asteapta: "Ultima reamintire",
};

const dayField = z.coerce.number({ invalid_type_error: "Scrie un număr." }).int("Scrie un număr întreg.").min(1, "Cel puțin ziua 1.").max(60, "Cel mult ziua 60.");
export const ConvSettings = z.object({
  /** Ziua fiecărui email, numărată de la începutul zilelor gratuite (ziua 1 = prima zi). */
  days: z.object({ bunvenit: dayField, progres: dayField, planuri: dayField, ultimazi: dayField, reducere: dayField, asteapta: dayField }),
  /** Procentul reducerii din ziua 8 și câte ore ține. */
  percent: z.coerce.number().int("Scrie un număr întreg.").min(5, "Cel puțin 5%.").max(90, "Cel mult 90%."),
  hours: z.coerce.number().int("Scrie un număr întreg.").min(1, "Cel puțin o oră.").max(240, "Cel mult 240 de ore."),
  /** Fereastra din ultima zi gratuită, în cont. */
  popup: z.preprocess((v) => v === true || v === "on" || v === "true" || v === "1", z.boolean()),
});
export type ConvSettings = z.infer<typeof ConvSettings>;
export const CONV_KEY = "conversie";
export const DEFAULT_CONV: ConvSettings = {
  days: { bunvenit: 1, progres: 3, planuri: 5, ultimazi: 7, reducere: 8, asteapta: 14 }, percent: 20, hours: 48, popup: true,
};

export async function convSettings(db: Pick<Db, "select">): Promise<ConvSettings> {
  try {
    const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, CONV_KEY));
    const v = (r?.value ?? {}) as Partial<ConvSettings>;
    const parsed = ConvSettings.safeParse({ ...DEFAULT_CONV, ...v, days: { ...DEFAULT_CONV.days, ...(v.days ?? {}) } });
    return parsed.success ? parsed.data : DEFAULT_CONV;
  } catch {
    return DEFAULT_CONV;
  }
}
export async function saveConvSettings(db: Pick<Db, "insert">, v: ConvSettings, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: CONV_KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/* ---------- Când pleacă fiecare pas (pur, ca să se poată testa cu zilele „mutate”) ---------- */

/** Cât timp după ziua lui mai poate pleca un pas pierdut. */
export const STEP_WINDOW_DAYS = 3;

/**
 * Când îi vine rândul unui pas: ziua `d` începe la `start + (d − 1) zile`. Pașii de la sfârșitul zilelor gratuite (ziua lor ≥
 * zilele gratuite) se mută odată cu sfârșitul, dacă omul a câștigat zile în plus (invitații): „se încheie azi” rămâne în ultima
 * zi adevărată, iar reducerea în prima zi de după.
 */
export function dueAt(day: number, start: Date, trialEnd: Date, trialDays: number): Date {
  const nominalEnd = start.getTime() + trialDays * DAY;
  const shift = day >= trialDays ? Math.max(0, trialEnd.getTime() - nominalEnd) : 0;
  return new Date(start.getTime() + (day - 1) * DAY + shift);
}

/**
 * Ce pas îi trebuie azi omului (cel mult unul), sau nimic:
 * - în zilele gratuite (`proba`), pașii din zilele gratuite, „se încheie azi” doar înainte de sfârșit;
 * - după ele, doar dacă n-a avut niciodată un an (nu e „păstrabil”): reducerea și ultima reamintire;
 * - cine a plătit, are an, beta sau e gratuit pentru totdeauna nu primește nimic.
 * Dintre pașii veniți și încă în fereastra lor se alege cel mai nou; nu se trimite un pas mai vechi decât unul deja trimis.
 */
export function pickStep(o: { access: Access; start: Date; trialEnd: Date; trialDays: number; sent: ReadonlySet<string>; s: ConvSettings; now: Date }): Step | null {
  const { access, now } = o;
  let pool: readonly Step[];
  if (access.kind === "proba") pool = TRIAL_STEPS;
  else if (access.kind === "expirat" && !access.keepable && !access.keptUntil) pool = AFTER_STEPS;
  else return null;
  const lastSent = Math.max(-1, ...STEPS.map((s, i) => (o.sent.has(s) ? i : -1)));
  let pick: Step | null = null;
  for (const step of pool) {
    const i = STEPS.indexOf(step);
    if (i <= lastSent) continue;
    const due = dueAt(o.s.days[step], o.start, o.trialEnd, o.trialDays).getTime();
    if (now.getTime() < due || now.getTime() >= due + STEP_WINDOW_DAYS * DAY) continue;
    if (step === "ultimazi" && now >= o.trialEnd) continue;
    pick = step;
  }
  return pick;
}

/* ---------- Semnăturile din legături (dezabonare, deschideri, clicuri) ---------- */

const secret = () => process.env.BETTER_AUTH_SECRET?.trim() || "cartea-neamului-local";
const sign = (what: string) => createHmac("sha256", secret()).update(what).digest("base64url").slice(0, 32);
const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export const unsubToken = (userId: string) => sign(`conversie:${userId}`);
export const checkUnsub = (userId: string, token: string) => same(unsubToken(userId), token);
export const mailSig = (mailId: string) => sign(`conversie-mail:${mailId}`);
export const checkMailSig = (mailId: string, s: string) => same(mailSig(mailId), s);

/** Doar adrese din site, ca legătura de clic să nu poată fi folosită ca să trimită oamenii altundeva. */
export function safePath(p: string | null | undefined): string {
  const v = (p ?? "").trim();
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") && !/[\r\n]/.test(v) ? v : "/";
}
/** Semnele utm, ca vizita din email să apară în Admin → Analiză la campania pasului. */
export function withUtm(path: string, step: Step) {
  const u = new URL(safePath(path), "https://x.invalid");
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", `conversie-${step}`);
  return `${u.pathname}${u.search}`;
}
export const clickUrl = (site: string, mailId: string, path: string) => `${site}/api/conversie/c?m=${mailId}&s=${mailSig(mailId)}&u=${encodeURIComponent(path)}`;
export const openUrl = (site: string, mailId: string) => `${site}/api/conversie/o?m=${mailId}&s=${mailSig(mailId)}`;
export const unsubUrl = (site: string, userId: string) => `${site}/dezabonare?l=conversie&u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`;
export const unsubPostUrl = (site: string, userId: string) => `${site}/api/vesti/dezabonare?l=conversie&u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`;

/** O deschidere (poza din email) sau un clic, numărate pe email. */
export async function trackMail(db: Db, mailId: string, what: "open" | "click", now = new Date()) {
  if (!/^[0-9a-f-]{36}$/i.test(mailId)) return;
  const at = sql`coalesce(${conversionMail.openedAt}, ${now.toISOString()}::timestamp)`;
  if (what === "open") {
    await db.update(conversionMail).set({ opens: sql`${conversionMail.opens} + 1`, openedAt: at }).where(eq(conversionMail.id, mailId));
  } else {
    // Un clic înseamnă și că emailul a fost deschis (unele programe nu încarcă pozele).
    await db.update(conversionMail).set({ clicks: sql`${conversionMail.clicks} + 1`, clickedAt: now, openedAt: at }).where(eq(conversionMail.id, mailId));
  }
}

/* ---------- Codul de reducere ---------- */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newOfferCode = () => `CN${Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("")}`;

export type Offer = { code: string; percent: number; expiresAt: Date; stripePromoId: string | null; usedAt: Date | null };

/** Stripe, cu versiunea API fixată, ca parametrii codurilor promoționale să rămână aceiași. */
async function stripeCall(path: string, method: "GET" | "POST", params: Record<string, string> | null, fetcher: typeof fetch) {
  const r = await fetcher(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    ...(params ? { body: new URLSearchParams(params) } : {}),
  });
  return { ok: r.ok, status: r.status, json: (await r.json().catch(() => ({}))) as { id?: string; error?: { message?: string; code?: string } } };
}

/**
 * Codul promoțional din Stripe: un cupon pe procent (`cn-conversie-20`, făcut o singură dată) și, pe el, codul omului, cu o
 * singură folosire și data de expirare. Întoarce id-ul codului (promo_…).
 */
export async function createStripePromo(code: string, percent: number, expiresAt: Date, userId: string, fetcher: typeof fetch = fetch): Promise<string> {
  const coupon = `cn-conversie-${percent}`;
  const got = await stripeCall(`coupons/${coupon}`, "GET", null, fetcher);
  if (!got.ok) {
    const made = await stripeCall("coupons", "POST", { id: coupon, percent_off: String(percent), duration: "once", name: `Cartea Neamului -${percent}%` }, fetcher);
    if (!made.ok && made.json.error?.code !== "resource_already_exists") throw new Error(`Stripe cupon: ${made.json.error?.message ?? made.status}`);
  }
  const promo = await stripeCall("promotion_codes", "POST", {
    coupon, code, max_redemptions: "1", expires_at: String(Math.floor(expiresAt.getTime() / 1000)), "metadata[userId]": userId, "metadata[sursa]": "conversie",
  }, fetcher);
  if (!promo.ok || !promo.json.id) throw new Error(`Stripe cod: ${promo.json.error?.message ?? promo.status}`);
  return promo.json.id;
}

const toOffer = (r: typeof conversionOffer.$inferSelect): Offer => ({ code: r.code, percent: r.percent, expiresAt: r.expiresAt, stripePromoId: r.stripePromoId, usedAt: r.usedAt });

/**
 * Codul de reducere al omului: unul singur, pentru totdeauna (dacă există deja, îl întoarce pe acela, chiar expirat). Cu
 * `stripe: true` se face și în Stripe; fără (la teste și în simulare) rămâne doar în baza de date.
 */
export async function ensureOffer(db: Db, userId: string, s: ConvSettings, now = new Date(), o: { stripe: boolean; fetcher?: typeof fetch } = { stripe: true }): Promise<Offer> {
  const [have] = await db.select().from(conversionOffer).where(eq(conversionOffer.userId, userId));
  if (have) return toOffer(have);
  const code = newOfferCode();
  const expiresAt = new Date(now.getTime() + s.hours * HOUR);
  const promo = o.stripe ? await createStripePromo(code, s.percent, expiresAt, userId, o.fetcher) : null;
  const [made] = await db.insert(conversionOffer).values({ code, userId, percent: s.percent, stripePromoId: promo, createdAt: now, expiresAt })
    .onConflictDoNothing().returning();
  if (made) return toOffer(made);
  const [again] = await db.select().from(conversionOffer).where(eq(conversionOffer.userId, userId));
  return toOffer(again);
}

/** Reducerea pe care omul o poate folosi acum (nefolosită, neexpirată). */
export async function activeOffer(db: Pick<Db, "select">, userId: string, now = new Date()): Promise<Offer | null> {
  const [r] = await db.select().from(conversionOffer).where(and(eq(conversionOffer.userId, userId), isNull(conversionOffer.usedAt)));
  return r && r.expiresAt > now ? toOffer(r) : null;
}

/**
 * După o plată încheiată (webhook): codul de reducere folosit (din semnul pus la plată sau din codul promoțional ales pe pagina
 * Stripe) și emailul căruia i se datorează plata anului: ultimul pe care s-a apăsat în 7 zile sau, fără clic, ultimul primit.
 */
export async function afterPayment(db: Db, p: { id: string; kind: string; userId: string; amount: number; currency: string; offer?: string | null; promo?: string | null }, now = new Date()) {
  if (!p.userId) return;
  if (p.offer || p.promo) {
    const by = p.offer ? eq(conversionOffer.code, p.offer) : eq(conversionOffer.stripePromoId, p.promo!);
    await db.update(conversionOffer).set({ usedAt: now, paymentId: p.id, amount: p.amount, currency: p.currency })
      .where(and(by, eq(conversionOffer.userId, p.userId), isNull(conversionOffer.usedAt)));
  }
  if (p.kind !== "an") return;
  const since = sql`${new Date(now.getTime() - 7 * DAY).toISOString()}::timestamp`;
  const [clicked] = await db.select({ id: conversionMail.id }).from(conversionMail)
    .where(and(eq(conversionMail.userId, p.userId), isNull(conversionMail.paidAt), sql`${conversionMail.clickedAt} > ${since}`))
    .orderBy(desc(conversionMail.clickedAt)).limit(1);
  const [last] = clicked ? [clicked] : await db.select({ id: conversionMail.id }).from(conversionMail)
    .where(and(eq(conversionMail.userId, p.userId), isNull(conversionMail.paidAt), sql`${conversionMail.sentAt} > ${since}`))
    .orderBy(desc(conversionMail.sentAt)).limit(1);
  if (last) await db.update(conversionMail).set({ paidAt: now, paymentId: p.id, amount: p.amount, currency: p.currency }).where(eq(conversionMail.id, last.id));
}

/* ---------- Cine primește ce ---------- */

export type Candidate = {
  id: string; name: string; email: string; emailVerified: boolean; locale: string; createdAt: Date; freeUntil: Date | null;
  plan: string | null; paidUntil: Date | null; tier: string | null; keepUntil: Date | null;
  sent: string[]; optOut: boolean;
};

/** Conturile din ultimele 90 de zile (sau doar unul), cu ce au primit deja și dacă s-au dezabonat de la acest șir. */
export async function candidates(db: Db, now = new Date(), onlyUserId?: string): Promise<Candidate[]> {
  const since = new Date(now.getTime() - 90 * DAY).toISOString();
  const r = await rows<Row>(db, sql`
    select u.id, u.name, u.email, u.email_verified, u.locale, u.created_at, u.free_until, p.plan, p.paid_until, p.tier, p.keep_until,
      (select array_agg(m.step) from conversion_mail m where m.user_id = u.id) as sent,
      coalesce((select not c.granted from consent c where c.user_id = u.id and c.purpose = 'conversie' order by c.created_at desc limit 1), false) as opt_out
    from "user" u left join account_plan p on p.user_id = u.id
    where ${onlyUserId ? sql`u.id = ${onlyUserId}` : sql`u.created_at > ${since}::timestamp and u.email not like 'demo@%'`}`);
  return r.map((x) => ({
    id: String(x.id), name: String(x.name ?? ""), email: String(x.email ?? ""), emailVerified: !!x.email_verified, locale: String(x.locale ?? "ro"),
    createdAt: new Date(x.created_at as string), freeUntil: x.free_until ? new Date(x.free_until as string) : null, plan: (x.plan as string) ?? null,
    paidUntil: x.paid_until ? new Date(x.paid_until as string) : null, tier: (x.tier as string) ?? null, keepUntil: x.keep_until ? new Date(x.keep_until as string) : null,
    sent: (x.sent as string[] | null) ?? [], optOut: !!x.opt_out,
  }));
}

/** Câte persoane are omul în arbori: întâi în ai lui, altfel în cei în care e membru. */
export async function personCount(db: Db, userId: string): Promise<number> {
  const [r] = await rows(db, sql`select
      (select count(*) from person p join tree t on t.id = p.tree_id where t.owner_id = ${userId}) as own,
      (select count(*) from person p join tree_member m on m.tree_id = p.tree_id where m.user_id = ${userId}) as any`);
  return n(r?.own) || n(r?.any);
}

/* ---------- Analiză → Conversii ---------- */

export type StepStats = { step: Step; sent: number; opened: number; clicked: number; paid: number; lei: number; eur: number };
const minorToMain = (v: unknown) => n(v) / 100;

/**
 * Din gratuit în plătit, pentru Admin → Analiză → Conversii: conturile noi din perioadă și câte au plătit un an; pe fiecare
 * email: trimise, deschise, cu clic și plățile de după; codurile de reducere: făcute, folosite și banii aduși.
 * `from` / `to` sunt zile (AAAA-LL-ZZ), inclusiv.
 */
export async function conversionStats(db: Db, range: { from: string; to: string }) {
  const [cohort] = await rows(db, sql`
    with c as (select u.id from "user" u where u.created_at::date between ${range.from}::date and ${range.to}::date and u.email not like 'demo@%')
    select count(*) as accounts,
      count(*) filter (where exists (select 1 from payment p where p.user_id = c.id and p.kind = 'an')) as paid,
      count(*) filter (where exists (select 1 from conversion_mail m where m.user_id = c.id)) as mailed
    from c`).catch(() => [{} as Row]);
  const perStep = await rows(db, sql`select step, count(*) as sent, count(opened_at) as opened, count(clicked_at) as clicked, count(paid_at) as paid,
      coalesce(sum(amount) filter (where currency = 'ron'), 0) as ron, coalesce(sum(amount) filter (where currency = 'eur'), 0) as eur
    from conversion_mail where sent_at::date between ${range.from}::date and ${range.to}::date group by step`).catch(() => []);
  const [offers] = await rows(db, sql`select count(*) as made, count(used_at) as used,
      count(*) filter (where used_at is null and expires_at < now()) as expired,
      coalesce(sum(amount) filter (where currency = 'ron'), 0) as ron, coalesce(sum(amount) filter (where currency = 'eur'), 0) as eur
    from conversion_offer where created_at::date between ${range.from}::date and ${range.to}::date`).catch(() => [{} as Row]);
  const [optOuts] = await rows(db, sql`select count(*) as c from (select distinct on (user_id) granted from consent where purpose = 'conversie' order by user_id, created_at desc) x where not granted`)
    .catch(() => [{} as Row]);
  const by = new Map(perStep.map((r) => [String(r.step), r]));
  const steps: StepStats[] = STEPS.map((step) => {
    const r = by.get(step) ?? {};
    return { step, sent: n(r.sent), opened: n(r.opened), clicked: n(r.clicked), paid: n(r.paid), lei: minorToMain(r.ron), eur: minorToMain(r.eur) };
  });
  return {
    cohort: { accounts: n(cohort?.accounts), paid: n(cohort?.paid), mailed: n(cohort?.mailed) },
    steps,
    offers: { made: n(offers?.made), used: n(offers?.used), expired: n(offers?.expired), lei: minorToMain(offers?.ron), eur: minorToMain(offers?.eur) },
    optOuts: n(optOuts?.c),
  };
}

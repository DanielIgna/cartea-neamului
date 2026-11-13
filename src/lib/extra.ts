/**
 * Îmbunătățirile de după planuri (Daniel, 2026-11-13): anul dăruit, aducerea aminte înainte de expirare (fără reînnoire
 * automată) și îndemnul de a înregistra glasul bunicilor. Pachetul Basic + cartea PDF și zilele pentru o rudă adusă sunt în
 * src/lib/plati.ts, „de la X lei” la cartea tipărită în setări (src/lib/plans.ts).
 */
import { and, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, document, gift, person, user } from "@/db/schema";
import { isTier, tierRank, type Tier } from "./plans";
import { setYear, YEAR_DAYS } from "./plati";

const DAY = 86_400_000;

/** Un an dăruit, după codul din legătură. */
export async function giftByCode(db: Pick<Db, "select">, code: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(code)) return null;
  const [g] = await db.select().from(gift).where(eq(gift.id, code));
  return g ?? null;
}

/** Darurile plătite de un om, cu legătura de trimis (cele noi întâi). */
export const giftsBy = (db: Pick<Db, "select">, userId: string) =>
  db.select().from(gift).where(eq(gift.buyerId, userId)).orderBy(desc(gift.createdAt));

/**
 * Primește anul dăruit: o singură dată, de un singur om. Cine are deja anul plătit pe un plan mai mare sau egal îl primește în
 * continuarea anului lui; altfel trece pe planul dăruit, de azi (sau după anul în curs) încă un an.
 */
export async function redeemGift(db: Db, code: string, userId: string, now = new Date()): Promise<"ok" | "used" | "invalid" | "own"> {
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    const g = await giftByCode(t, code);
    if (!g || !isTier(g.tier)) return "invalid";
    if (g.redeemedBy) return g.redeemedBy === userId ? "ok" : "used";
    if (g.buyerId === userId) return "own";
    const taken = await t.update(gift).set({ redeemedBy: userId, redeemedAt: now }).where(and(eq(gift.id, code), isNull(gift.redeemedBy))).returning({ id: gift.id });
    if (!taken.length) return "used";
    const [cur] = await t.select({ paidUntil: accountPlan.paidUntil, tier: accountPlan.tier }).from(accountPlan).where(eq(accountPlan.userId, userId));
    const running = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : null;
    const curTier: Tier | null = running && isTier(cur?.tier) ? cur!.tier as Tier : running ? "basic" : null;
    const tier: Tier = curTier && tierRank(curTier) >= tierRank(g.tier) ? curTier : g.tier;
    await setYear(t, userId, tier, new Date((running ?? now).getTime() + YEAR_DAYS * DAY), now);
    return "ok";
  });
}

/**
 * Cei al căror an plătit se termină în următoarele `days` zile și n-au primit încă aducerea aminte pentru anul ăsta.
 * Anul nu se reînnoiește singur: le scriem o dată, ca să se poată întoarce la plată dacă vor.
 */
export async function dueReminders(db: Pick<Db, "select">, days: number, now = new Date()) {
  if (days <= 0) return [];
  const until = new Date(now.getTime() + days * DAY);
  return db.select({ userId: user.id, name: user.name, email: user.email, locale: user.locale, paidUntil: accountPlan.paidUntil, tier: accountPlan.tier })
    .from(accountPlan).innerJoin(user, eq(user.id, accountPlan.userId))
    .where(and(gt(accountPlan.paidUntil, now), lte(accountPlan.paidUntil, until), sql`${accountPlan.plan} <> 'mereu'`,
      or(isNull(accountPlan.remindedFor), sql`${accountPlan.remindedFor} <> ${accountPlan.paidUntil}`)));
}

/** Ține minte că s-a trimis aducerea aminte pentru anul care se termină la `paidUntil`. */
export async function markReminded(db: Pick<Db, "update">, userId: string, paidUntil: Date) {
  await db.update(accountPlan).set({ remindedFor: paidUntil }).where(eq(accountPlan.userId, userId));
}

/**
 * Se poate trimite emailul singur? Doar cu un serviciu de email pus de cel care ține site-ul (cheie în Vercel):
 * RESEND_API_KEY și adresa de la care pleacă, MAIL_FROM (sau vechiul nume REMINDER_FROM).
 */
export const mailFrom = () => process.env.MAIL_FROM?.trim() || process.env.REMINDER_FROM?.trim() || "";
export const reminderMailReady = () => !!process.env.RESEND_API_KEY?.trim() && !!mailFrom();

/** Trimite un email prin Resend (REST, fără bibliotecă). Întoarce false dacă nu e pus serviciul sau n-a mers. */
export async function sendMail(to: string, subject: string, text: string, fetcher: typeof fetch = fetch, html?: string): Promise<boolean> {
  if (!reminderMailReady()) return false;
  try {
    const r = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to: [to], subject, text, ...(html ? { html } : {}) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Îndemnul „Înregistrează glasul bunicii”: după ce s-au completat primele fișe (cel puțin `minPersons`) și încă nu e nicio
 * înregistrare cu glasul în arbore. Întoarce cel mai în vârstă om în viață din arbore (dacă e trecut), la care să ducă îndemnul.
 */
export async function voiceNudge(db: Pick<Db, "select">, treeId: string, minPersons = 5) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(person).where(eq(person.treeId, treeId));
  if (Number(n) < minPersons) return null;
  const [a] = await db.select({ id: document.id }).from(document).where(and(eq(document.treeId, treeId), eq(document.kind, "audio"))).limit(1);
  if (a) return null;
  const [elder] = await db.select({ id: person.id, givenName: person.givenName }).from(person)
    .where(and(eq(person.treeId, treeId), eq(person.living, true), sql`${person.birthFrom} is not null`)).orderBy(person.birthFrom).limit(1);
  return { personId: elder?.id ?? null, name: elder?.givenName ?? null };
}

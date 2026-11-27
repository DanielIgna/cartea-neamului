import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, noticeDismissal } from "@/db/schema";

/**
 * Banda „Nou: Păstrarea” (Daniel, 2026-11-27): după „Am înțeles” nu mai apare la fiecare intrare.
 * Închiderea se ține pe cont (tabelul notice_dismissal), nu doar în browser.
 * - Conturile de dinainte de Păstrare (14.11.2026) o văd o dată, până o închid.
 * - În ultimele 30 de zile înainte să se încheie anul plătit, reapare rar: cel mult o dată pe săptămână, de cel mult 4 ori după prima închidere.
 */
export const KEEP_NOTICE = "pastrare";
export const KEEP_NOTICE_COOKIE = "cn-pastrare-anunt";
const LAUNCH = new Date("2026-11-14T00:00:00Z");
const DAY = 86_400_000;
export const KEEP_WINDOW_DAYS = 30;
export const KEEP_EVERY_DAYS = 7;
export const KEEP_MAX_TIMES = 5;

export type Dismissed = { at: Date; times: number } | null;

export function showKeepNotice(o: { createdAt: Date; paidUntil: Date | null; dismissed: Dismissed; now: Date }): boolean {
  const { createdAt, paidUntil, dismissed, now } = o;
  const left = paidUntil ? paidUntil.getTime() - now.getTime() : -1;
  const inWindow = left > 0 && left <= KEEP_WINDOW_DAYS * DAY;
  if (!dismissed) return createdAt < LAUNCH || inWindow;
  if (!inWindow) return false;
  // Închis chiar în fereastră: așteaptă o săptămână. Închis înainte de fereastră: apare o dată când începe.
  const windowStart = paidUntil!.getTime() - KEEP_WINDOW_DAYS * DAY;
  if (dismissed.at.getTime() < windowStart) return true;
  return now.getTime() - dismissed.at.getTime() >= KEEP_EVERY_DAYS * DAY && dismissed.times < KEEP_MAX_TIMES;
}

export async function keepNoticeState(db: Db, userId: string): Promise<{ paidUntil: Date | null; dismissed: Dismissed }> {
  const [[p], [d]] = await Promise.all([
    db.select({ paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, userId)).catch(() => []),
    db.select({ at: noticeDismissal.at, times: noticeDismissal.times }).from(noticeDismissal)
      .where(and(eq(noticeDismissal.userId, userId), eq(noticeDismissal.notice, KEEP_NOTICE))).catch(() => []),
  ]);
  return { paidUntil: p?.paidUntil ?? null, dismissed: d ?? null };
}

export async function dismissKeepNotice(db: Db, userId: string, now = new Date()) {
  await db.insert(noticeDismissal).values({ userId, notice: KEEP_NOTICE, at: now, times: 1 })
    .onConflictDoUpdate({ target: [noticeDismissal.userId, noticeDismissal.notice], set: { at: now, times: sql`${noticeDismissal.times} + 1` } });
}

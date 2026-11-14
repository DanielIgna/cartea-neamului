/**
 * Admin → Securitate: ce s-a întâmplat ciudat în ultimele zile (multe parole greșite, blocări, dispozitive noi, ștergeri multe
 * deodată, plăți ciudate). Doar citiri; jurnalul îl scrie src/lib/securitate.ts.
 */
import { cache } from "react";
import { and, count, countDistinct, desc, eq, gt, gte, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { auditLog, payment, securityEvent, user } from "@/db/schema";
import { ENTITY } from "./edit-log";
import type { SecurityKind } from "./securitate";

/** Pragurile de la care un rând apare la „De verificat”. */
export const ALERT = { failsPerIp: 10, failsPerEmail: 5, deletesPerActor: 15, paymentsPerUser: 3, accountsPerIp: 5 };

export type Alert = { level: "warn" | "bad"; text: string; who?: string };

export async function securityOverview(db: Pick<Db, "select">, now = new Date()) {
  const d1 = new Date(now.getTime() - 86_400_000), d7 = new Date(now.getTime() - 7 * 86_400_000);
  const byKind = async (since: Date) => Object.fromEntries((await db.select({ kind: securityEvent.kind, n: count() }).from(securityEvent)
    .where(gt(securityEvent.createdAt, since)).groupBy(securityEvent.kind)).map((r) => [r.kind, r.n])) as Partial<Record<SecurityKind, number>>;
  // Toate întrebările deodată (înainte erau 11 una după alta).
  const [day, week, twoStepRows, ips, emails, codes, deletes, pays, many, money, recent] = await Promise.all([
    byKind(d1),
    byKind(d7),
    db.select({ n: count() }).from(user).where(eq(user.twoFactorEnabled, true)),
    db.select({ ip: securityEvent.ip, n: count(), emails: countDistinct(securityEvent.email) }).from(securityEvent)
    .where(and(eq(securityEvent.kind, "parola_gresita"), gt(securityEvent.createdAt, d1))).groupBy(securityEvent.ip)
    .having(gte(count(), ALERT.failsPerIp)).orderBy(desc(count())).limit(20),
    db.select({ email: securityEvent.email, n: count(), ips: countDistinct(securityEvent.ip) }).from(securityEvent)
    .where(and(eq(securityEvent.kind, "parola_gresita"), gt(securityEvent.createdAt, d1))).groupBy(securityEvent.email)
    .having(gte(count(), ALERT.failsPerEmail)).orderBy(desc(count())).limit(20),
    db.select({ ip: securityEvent.ip, n: count() }).from(securityEvent)
    .where(and(eq(securityEvent.kind, "cod_gresit"), gt(securityEvent.createdAt, d1))).groupBy(securityEvent.ip).having(gte(count(), 6)).limit(20),
    db.select({ actor: auditLog.actorId, name: user.name, email: user.email, n: count() }).from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorId))
    .where(and(eq(auditLog.entity, ENTITY), eq(auditLog.action, "stergere"), gt(auditLog.createdAt, d1)))
    .groupBy(auditLog.actorId, user.name, user.email).having(gte(count(), ALERT.deletesPerActor)).orderBy(desc(count())).limit(20),
    db.select({ userId: payment.userId, name: user.name, email: user.email, n: count() }).from(payment)
    .leftJoin(user, eq(user.id, payment.userId)).where(gt(payment.createdAt, d1))
    .groupBy(payment.userId, user.name, user.email).having(gte(count(), ALERT.paymentsPerUser)).limit(20),
    db.select({ ip: securityEvent.ip, n: countDistinct(securityEvent.userId) }).from(securityEvent)
    .where(and(eq(securityEvent.kind, "intrare"), gt(securityEvent.createdAt, d1), sql`${securityEvent.ip} is not null`)).groupBy(securityEvent.ip)
    .having(gte(countDistinct(securityEvent.userId), ALERT.accountsPerIp)).limit(20),
    db.select({ kind: securityEvent.kind, detail: securityEvent.detail, at: securityEvent.createdAt }).from(securityEvent)
    .where(and(sql`${securityEvent.kind} in ('plata_disputa','plata_frauda')`, gt(securityEvent.createdAt, d7))).orderBy(desc(securityEvent.createdAt)).limit(20),
    db.select({ kind: securityEvent.kind, email: securityEvent.email, name: user.name, ip: securityEvent.ip, device: securityEvent.device,
    place: securityEvent.place, detail: securityEvent.detail, at: securityEvent.createdAt })
    .from(securityEvent).leftJoin(user, eq(user.id, securityEvent.userId))
    .where(sql`${securityEvent.kind} <> 'intrare'`).orderBy(desc(securityEvent.createdAt)).limit(100),
  ]);
  const [twoStep] = twoStepRows;

  const alerts: Alert[] = [];
  for (const r of ips) alerts.push({ level: r.emails > 3 ? "bad" : "warn", text: `${r.n} parole greșite în 24 h de la aceeași adresă, pe ${r.emails} emailuri diferite${r.emails > 3 ? " (cineva încearcă la mai multe conturi)" : ""}`, who: r.ip ?? "?" });
  for (const r of emails) alerts.push({ level: r.ips > 2 ? "bad" : "warn", text: `${r.n} parole greșite în 24 h pentru acest email, de la ${r.ips === 1 ? "o singură adresă" : `${r.ips} adrese`}`, who: r.email ?? "?" });
  for (const r of codes) alerts.push({ level: "bad", text: `${r.n} coduri greșite la pasul 2 în 24 h (parola era bună!)`, who: r.ip ?? "?" });

  for (const r of deletes) alerts.push({ level: "bad", text: `a șters ${r.n} persoane în 24 h (le poți pune înapoi din „Istoric și limite”)`, who: r.name ? `${r.name} · ${r.email}` : "cont șters" });

  for (const r of pays) alerts.push({ level: "warn", text: `${r.n} plăți în 24 h de la același cont (verifică în Stripe că nu e un card furat)`, who: r.name ? `${r.name} · ${r.email}` : "?" });

  for (const r of many) alerts.push({ level: "warn", text: `${r.n} conturi diferite au intrat în 24 h de la aceeași adresă (poate o familie pe același internet, poate conturi false)`, who: r.ip ?? "?" });

  for (const r of money) alerts.push({ level: "bad", text: `${r.kind === "plata_disputa" ? "Plată contestată la bancă" : "Avertisment de fraudă de la Stripe"}${r.detail ? `: ${r.detail}` : ""}`, who: r.at.toISOString() });

  return { day, week, twoStep: twoStep?.n ?? 0, alerts, recent };
}

/** Aceeași citire, o singură dată pe cerere: Panoul de bord, Autonomia și Sănătatea afacerii o cer fiecare. */
export const securityOverviewOnce = cache((db: Pick<Db, "select">) => securityOverview(db));

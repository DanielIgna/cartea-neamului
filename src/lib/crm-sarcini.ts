/**
 * CRM Etapa 8 (Daniel, 18.11.2026): sarcini cu termen pe organizație și rezumatul de dimineață.
 *
 * - Sarcinile („sună joi”, „revino peste 30 de zile”) apar în „Azi” din ziua termenului (și rămân acolo cât sunt restante).
 * - Se fac singure, o singură dată: „Sună: emailul n-a ajuns” la școlile cu email nelivrat și „Răspunde” la un răspuns pozitiv.
 * - Rezumatul de dimineață (automatizarea `crm-dimineata`, OPRITĂ, ora 08:00 a României) îi scrie lui Daniel ce e de făcut azi.
 */
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { automationMark, crmOrganizations, crmTasks } from "@/db/schema";
import { roClock, roDayStart } from "./crm-campanii";
import { SITE_URL } from "./site-url";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const DAY = 86_400_000;
const n = (v: unknown) => Number(v ?? 0) || 0;

/** Sfârșitul zilei de azi în România (sarcinile cu termen azi apar dimineața). */
export const roDayEnd = (now = new Date()) => new Date(roDayStart(new Date(roDayStart(now).getTime() + 30 * 3600_000)).getTime() - 1);

/* ---------- Termenele rapide ---------- */

export const DUE_CHOICES = [
  { key: "azi", label: "Azi" }, { key: "maine", label: "Mâine" }, { key: "luni", label: "Luni" }, { key: "joi", label: "Joi" },
  { key: "7", label: "Peste 7 zile" }, { key: "30", label: "Peste 30 de zile" },
] as const;

/** Termenul ales: o zi (ora 09:00 în România). `date` = „2026-11-20” are întâietate. */
export function dueFrom(choice: string | null | undefined, date: string | null | undefined, now = new Date()): Date | null {
  const at9 = (d: Date) => new Date(roDayStart(d).getTime() + 9 * 3600_000);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(`${date}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : at9(d);
  }
  const wd = roClock(now).weekday;
  const plus = (days: number) => at9(new Date(now.getTime() + days * DAY));
  switch (choice) {
    case "azi": return plus(0);
    case "maine": return plus(1);
    case "luni": return plus(((1 - wd + 7) % 7) || 7);
    case "joi": return plus(((4 - wd + 7) % 7) || 7);
    case "7": return plus(7);
    case "30": return plus(30);
    default: return null;
  }
}

/* ---------- Sarcinile ---------- */

export async function addTask(db: Db, t: { organizationId?: string | null; titlu: string; scadenta: Date; sursa?: string; dedupeKey?: string | null; by?: string | null }, now = new Date()) {
  const [r] = await db.insert(crmTasks).values({
    organizationId: t.organizationId ?? null, titlu: t.titlu.trim().slice(0, 300), scadenta: t.scadenta, sursa: t.sursa ?? "manual",
    dedupeKey: t.dedupeKey ?? null, createdBy: t.by ?? null, createdAt: now,
  }).onConflictDoNothing().returning({ id: crmTasks.id });
  return r?.id ?? null;
}

export async function closeTask(db: Db, id: string, status: "facuta" | "anulata", by: string | null, now = new Date()) {
  const r = await db.update(crmTasks).set({ status, doneAt: now, doneBy: by }).where(and(eq(crmTasks.id, id), eq(crmTasks.status, "deschisa"))).returning({ org: crmTasks.organizationId, titlu: crmTasks.titlu });
  return r[0] ?? null;
}

/** Închide sarcinile automate „de sunat” ale organizației (după „Am sunat”). */
export async function closeCallTasks(db: Db, orgId: string, by: string | null, now = new Date()) {
  await db.update(crmTasks).set({ status: "facuta", doneAt: now, doneBy: by })
    .where(and(eq(crmTasks.organizationId, orgId), eq(crmTasks.status, "deschisa"), eq(crmTasks.sursa, "nelivrat")));
}

/** Școala cu email nelivrat: „Sună” azi, o singură dată pe organizație. */
export async function ensureCallTask(db: Db, orgId: string, now = new Date()) {
  const [o] = await db.select({ tip: crmOrganizations.tip, nume: crmOrganizations.nume }).from(crmOrganizations).where(eq(crmOrganizations.id, orgId));
  if (!o || o.tip !== "scoala") return null;
  return addTask(db, { organizationId: orgId, titlu: `Sună la ${o.nume}: emailul n-a ajuns (cere adresa bună)`, scadenta: now, sursa: "nelivrat", dedupeKey: `sunat:${orgId}` }, now);
}

/** Un răspuns pozitiv: „Răspunde” azi, o dată pe răspuns. */
export async function ensureReplyTask(db: Db, orgId: string, replyKey: string, now = new Date()) {
  const [o] = await db.select({ nume: crmOrganizations.nume }).from(crmOrganizations).where(eq(crmOrganizations.id, orgId));
  if (!o) return null;
  return addTask(db, { organizationId: orgId, titlu: `Răspunde: ${o.nume} e interesată`, scadenta: now, sursa: "raspuns", dedupeKey: `raspuns:${replyKey}` }, now);
}

export type DueTask = { id: string; org: string | null; nume: string | null; titlu: string; scadenta: Date; sursa: string; telefon: string | null; email: string | null; restanta: boolean };

/** Ce e de făcut până la sfârșitul zilei de azi (restantele întâi). */
export async function dueTasks(db: Db, now = new Date()): Promise<DueTask[]> {
  const end = roDayEnd(now), start = roDayStart(now);
  const r = await rows<Row>(db, sql`select t.id, t.organization_id as org, o.nume, t.titlu, t.scadenta, t.sursa, o.telefon, o.email_oficial as email
    from crm_tasks t left join crm_organizations o on o.id = t.organization_id
    where t.status = 'deschisa' and t.scadenta <= ${end.toISOString()} order by t.scadenta limit 100`);
  return r.map((x) => {
    const due = new Date(String(x.scadenta));
    return { id: String(x.id), org: (x.org as string) ?? null, nume: (x.nume as string) ?? null, titlu: String(x.titlu), scadenta: due, sursa: String(x.sursa), telefon: (x.telefon as string) ?? null, email: (x.email as string) ?? null, restanta: due < start };
  });
}

export async function orgTasks(db: Db, orgId: string) {
  return db.select().from(crmTasks).where(eq(crmTasks.organizationId, orgId)).orderBy(sql`${crmTasks.status} = 'deschisa' desc, ${crmTasks.scadenta}`).limit(50);
}

/* ---------- Rezumatul de dimineață ---------- */

export async function morningDigest(db: Db, now = new Date()) {
  const since = new Date(now.getTime() - DAY).toISOString();
  const [tasks, [c]] = await Promise.all([
    dueTasks(db, now),
    rows<Row>(db, sql`select
      (select count(*) from crm_activities where tip = 'raspuns' and at > ${since}) as raspunsuri,
      (select count(*) from crm_activities where tip = 'raspuns' and at > ${since} and meta->>'clasificare' = 'interesat') as pozitive,
      (select count(*) from crm_approvals where status = 'in_asteptare') as aprobari,
      (select count(*) from crm_organizations where de_sunat and status not in ('nu_contacta','client','partener')) as de_sunat,
      (select count(*) from crm_sends where sent_at > ${since} and status not in ('blocat','eroare')) as trimise,
      (select count(*) from crm_activities where tip = 'plata' and at > ${since}) as plati`),
  ]);
  const late = tasks.filter((t) => t.restanta);
  const lines = [
    `Bună dimineața! Azi în CRM:`,
    "",
    `- ${tasks.length} sarcini de făcut${late.length ? ` (din care ${late.length} restante)` : ""}`,
    ...tasks.slice(0, 15).map((t) => `   • ${t.restanta ? "[restantă] " : ""}${t.titlu}`),
    `- ${n(c?.raspunsuri)} răspunsuri noi în ultimele 24 h${n(c?.pozitive) ? ` (${n(c?.pozitive)} pozitive)` : ""}`,
    `- ${n(c?.aprobari)} mesaje așteaptă aprobarea ta`,
    `- ${n(c?.de_sunat)} organizații de sunat`,
    `- ${n(c?.trimise)} emailuri de campanie trimise ieri, ${n(c?.plati)} plăți venite prin organizații`,
    "",
    `Deschide „Azi”: ${SITE_URL}/admin/crm`,
    "",
    "Poți opri acest email din Admin → Autonomie („CRM: rezumatul de dimineață”).",
  ];
  const empty = !tasks.length && !n(c?.raspunsuri) && !n(c?.aprobari) && !n(c?.de_sunat);
  return { subject: `CRM azi: ${tasks.length} sarcini, ${n(c?.raspunsuri)} răspunsuri, ${n(c?.aprobari)} de aprobat`, text: lines.join("\n"), empty, tasks: tasks.length };
}

/** O dată pe zi (cheia zilei României), doar dacă e ceva de făcut. */
export async function runMorningDigest(db: Db, o: { now?: Date; to: string; send: (to: string, subject: string, text: string) => Promise<boolean> }) {
  const now = o.now ?? new Date();
  const ref = roClock(now).date;
  const [done] = await db.select().from(automationMark).where(and(eq(automationMark.automation, "crm-dimineata"), eq(automationMark.ref, ref)));
  if (done) return { sent: false, note: "rezumatul de azi a plecat deja" };
  const d = await morningDigest(db, now);
  if (d.empty) return { sent: false, note: "nimic de făcut azi, n-am trimis" };
  if (!(await o.send(o.to, d.subject, d.text))) return { sent: false, error: true, note: "emailul n-a plecat" };
  await db.insert(automationMark).values({ automation: "crm-dimineata", ref, at: now }).onConflictDoNothing();
  return { sent: true, note: d.subject };
}

/**
 * CRM, monitorizarea (Daniel, 18.11.2026): pagina Admin → CRM → Sănătate și alertele pe email.
 * - Ultima rulare a fiecărei automatizări CRM, erorile din ultimele 24 h, emailurile de azi față de limită, rata de nelivrare,
 *   răspunsurile necitite, încercările de trimitere spre „nu contacta”, sincronizarea Gmail.
 * - Alertă (automatizarea `crm-alerte`, OPRITĂ): o automatizare CRM a dat eroare de 2 ori la rând, nelivrate peste 5%, sau
 *   s-a încercat o trimitere spre cineva de pe „nu contacta”. Aceeași alertă nu pleacă de două ori.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { AUTOMATIONS, automationSwitches, type AutoKey } from "./autonomie";
import { crmLimits } from "./crm-auto";
import { RESEND_LAST_KEY, sentToday } from "./crm-campanii";
import { gmailState } from "./crm-gmail";
import { SITE_URL } from "./site-url";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

export const CRM_KEYS: AutoKey[] = ["crm-scor", "crm-reactivare", "crm-ambasador", "crm-ciorne", "crm-campanii", "crm-gmail", "crm-dimineata", "crm-alerte"];
export const BOUNCE_LIMIT = 5; // %
export const BOUNCE_MIN_SAMPLE = 20;

export async function crmHealth(db: Db, now = new Date()) {
  const since24 = new Date(now.getTime() - DAY).toISOString(), since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  const keys = sql.join(CRM_KEYS.map((k) => sql`${k}`), sql`, `);
  const [sw, limits, today, gmail, runs, errors, [b], [u], [rl]] = await Promise.all([
    automationSwitches(db), crmLimits(db), sentToday(db, now), gmailState(db),
    rows<{ automation: string; started_at: string; status: string; note: string | null; prev_status: string | null }>(db, sql`
      select distinct on (automation) automation, started_at, status, note,
        (select r2.status from automation_run r2 where r2.automation = r.automation and r2.started_at < r.started_at order by r2.started_at desc limit 1) as prev_status
      from automation_run r where automation in (${keys}) order by automation, started_at desc`),
    rows<{ automation: string; started_at: string; note: string | null }>(db, sql`select automation, started_at, note from automation_run where automation in (${keys}) and status = 'eroare' and started_at > ${since24} order by started_at desc limit 20`),
    rows<Row>(db, sql`select count(*) filter (where status not in ('blocat','eroare')) as sent, count(*) filter (where bounced_at is not null) as bounced from crm_sends where sent_at > ${since30}`),
    rows<Row>(db, sql`select
      (select count(*) from crm_activities a join crm_organizations o on o.id = a.organization_id where a.tip = 'raspuns' and a.at > ${new Date(now.getTime() - 14 * DAY).toISOString()}
        and coalesce(a.meta->>'clasificare','') not in ('automat','refuz','dezabonare') and o.status <> 'nu_contacta'
        and not exists (select 1 from crm_activities x where x.organization_id = a.organization_id and x.at > a.at and x.tip in ('email_trimis','apel','whatsapp','nota','sarcina'))) as unread,
      (select count(*) from audit_log where entity = 'crm' and action = 'trimitere oprită (nu contacta)' and created_at > ${since24}) as blocked_mail,
      (select count(*) from crm_sends where status = 'blocat' and sent_at > ${since24}) as blocked_sends`),
    rows<{ value: { at?: string; type?: string } | null }>(db, sql`select value from app_setting where key = ${RESEND_LAST_KEY}`),
  ]);
  const byKey = new Map(runs.map((r) => [r.automation, r]));
  const sent30 = n(b?.sent), bounced30 = n(b?.bounced);
  const bounceRate = sent30 ? Math.round((bounced30 / sent30) * 1000) / 10 : 0;
  return {
    runs: CRM_KEYS.map((k) => {
      const a = AUTOMATIONS.find((x) => x.key === k);
      const r = byKey.get(k);
      return { key: k, label: a?.label ?? k, on: !!sw[k], paused: sw.paused?.[k] ?? null, last: r?.started_at ? new Date(r.started_at).toISOString() : null, status: r?.status ?? null, note: r?.note ?? null,
        twoFails: r?.status === "eroare" && r.prev_status === "eroare", runId: r?.started_at ?? null };
    }),
    errors: errors.map((e) => ({ key: e.automation, at: new Date(e.started_at).toISOString(), note: e.note })),
    sentToday: today, cap: limits.campanii,
    bounce: { sent: sent30, bounced: bounced30, rate: bounceRate, high: sent30 >= BOUNCE_MIN_SAMPLE && bounceRate > BOUNCE_LIMIT },
    unread: n(u?.unread), blocked: n(u?.blocked_mail) + n(u?.blocked_sends),
    resend: { secret: !!process.env.RESEND_WEBHOOK_SECRET?.trim(), lastAt: rl?.value?.at ?? null, lastType: rl?.value?.type ?? null },
    gmail: { linked: !!gmail.sealed, lastSync: gmail.lastSync ?? null, lastOk: gmail.lastOk ?? null, error: gmail.lastError ?? null },
  };
}
export type CrmHealth = Awaited<ReturnType<typeof crmHealth>>;

/** Alertele de trimis acum (cheie unică pe alertă, ca să nu plece de două ori). */
export function alertsFor(h: CrmHealth, now = new Date()) {
  const out: { key: string; text: string }[] = [];
  for (const r of h.runs) if (r.twoFails) out.push({ key: `fail:${r.key}:${r.runId}`, text: `„${r.label}” a dat eroare de 2 ori la rând: ${r.note ?? ""}` });
  if (h.bounce.high) out.push({ key: `bounce:${now.toISOString().slice(0, 10)}`, text: `Nelivrate ${h.bounce.rate}% în ultimele 30 de zile (${h.bounce.bounced} din ${h.bounce.sent}), peste pragul de ${BOUNCE_LIMIT}%. Verifică lista și oprește campaniile până lămurești.` });
  if (h.blocked) out.push({ key: `blocat:${now.toISOString().slice(0, 10)}`, text: `S-a încercat de ${h.blocked} ori în ultimele 24 h o trimitere spre adrese de pe „Nu contacta”. Emailurile au fost oprite; verifică de unde vin (Admin → CRM → Curățenie → Istoric).` });
  return out;
}

const SENT_KEY = "crm_alerte_trimise";
export async function runCrmAlerts(db: Db, o: { now?: Date; to: string; send: (to: string, subject: string, text: string) => Promise<boolean> }) {
  const now = o.now ?? new Date();
  const h = await crmHealth(db, now);
  const [r] = await db.select({ v: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${SENT_KEY}`);
  const sent = new Set(((r?.v as string[] | undefined) ?? []));
  const fresh = alertsFor(h, now).filter((a) => !sent.has(a.key));
  if (!fresh.length) return { alerts: 0, sent: false, note: "nicio alertă nouă" };
  const text = `Alertă CRM:\n\n${fresh.map((a) => `- ${a.text}`).join("\n")}\n\nDetalii: ${SITE_URL}/admin/crm?t=sanatate`;
  if (!(await o.send(o.to, `Cartea Neamului: ${fresh.length} ${fresh.length === 1 ? "alertă" : "alerte"} în CRM`, text))) return { alerts: fresh.length, sent: false, error: true, note: "emailul de alertă n-a plecat" };
  const list = [...sent, ...fresh.map((a) => a.key)].slice(-300);
  await db.insert(appSetting).values({ key: SENT_KEY, value: list, updatedAt: now }).onConflictDoUpdate({ target: appSetting.key, set: { value: list, updatedAt: now } });
  return { alerts: fresh.length, sent: true, note: fresh.map((a) => a.text).join(" · ").slice(0, 300) };
}

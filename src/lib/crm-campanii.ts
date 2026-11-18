/**
 * CRM Etapa 5 (Daniel, 18.11.2026): campanii către organizații (școli, firme) trimise din CRM.
 *
 * Reguli:
 * - Doar adresele oficiale publice ale organizațiilor (crm_organizations.email_oficial), câte un email pe organizație.
 * - Cel mult `limita_zi` pe campanie și `crm_limite.campanii` în total pe zi; doar luni–vineri, în fereastra orară a campaniei
 *   (ora României).
 * - O singură trimitere pe organizație: cine a primit deja un email de campanie (sau unul trecut în istoric din import) nu mai
 *   primește, decât dacă filtrul campaniei o cere explicit. Follow-up doar dacă e setat pe campanie, o singură dată, și doar
 *   la cine n-a răspuns.
 * - Lista „nu contacta” se verifică pe server de două ori: la alegerea destinatarilor și în `sendEmail` (marketing).
 * - Fiecare email are dezabonare (adresa + organizația intră pe „nu contacta”) și se leagă de organizație ca activitate:
 *   trimis, livrat, deschis, click, nelivrat, dezabonat.
 * - Totul pornește oprit: campania trebuie pornită de Daniel, iar automatizarea `crm-campanii` din Admin → Autonomie.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { crmCampaigns, crmOrganizations, crmSends, crmTemplates } from "@/db/schema";
import { addActivity, isOrgStatus, isOrgType, isSuppressed, setOrgStatus, suppress, type OrgStatus } from "./crm";
import { srcOf } from "./crm-admin";
import { COUNTIES } from "./place-key";
import { SITE_URL } from "./site-url";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const DAY = 86_400_000;

/* ---------- Ora României ---------- */

/** Ziua săptămânii (1 = luni … 7 = duminică), ora și data în România. */
export function roClock(now = new Date()) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", weekday: "short", hour: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday) + 1;
  return { weekday, hour: Number(p.hour), date: `${p.year}-${p.month}-${p.day}` };
}
/** Începutul zilei de azi în România, ca moment UTC (pentru „câte s-au trimis azi”). */
export function roDayStart(now = new Date()) {
  const { date } = roClock(now);
  for (const off of [2, 3]) {
    const t = new Date(`${date}T00:00:00+0${off}:00`);
    if (roClock(t).date === date && roClock(new Date(t.getTime() - 1)).date !== date) return t;
  }
  return new Date(`${date}T00:00:00+02:00`);
}
export const isWorkday = (now = new Date()) => roClock(now).weekday <= 5;
export const inWindow = (c: { oraStart: number; oraSfarsit: number }, now = new Date()) => {
  const h = roClock(now).hour;
  return h >= c.oraStart && h < c.oraSfarsit;
};

/* ---------- Șabloane ---------- */

export const PLACEHOLDERS = ["{organizatie}", "{localitate}", "{judet}"] as const;
export const TemplateInput = z.object({
  nume: z.string().trim().min(2, "Dă-i un nume.").max(120),
  tipOrg: z.string().trim().optional().transform((v) => (v && isOrgType(v) ? v : null)),
  subiect: z.string().trim().min(3, "Scrie subiectul.").max(160),
  corp: z.string().trim().min(20, "Textul e prea scurt.").max(5000),
  butonText: z.string().trim().max(60).optional().transform((v) => v || null),
  butonCale: z.string().trim().max(200).optional().transform((v) => (v && /^\/[a-z0-9/_\-?=&.]*$/i.test(v) ? v : null)),
});
export type TemplateInput = z.infer<typeof TemplateInput>;

export async function saveTemplate(db: Db, v: TemplateInput, by: string | null, id?: string | null, now = new Date()) {
  if (id) {
    await db.update(crmTemplates).set({ ...v, updatedAt: now }).where(eq(crmTemplates.id, id));
    return id;
  }
  const [r] = await db.insert(crmTemplates).values({ ...v, createdBy: by, createdAt: now, updatedAt: now }).returning({ id: crmTemplates.id });
  return r.id;
}

/* ---------- Campanii ---------- */

export const CAMPAIGN_STATUSES = ["ciorna", "pornita", "oprita", "terminata"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export const CAMPAIGN_LABEL: Record<CampaignStatus, string> = { ciorna: "Ciornă", pornita: "Pornită", oprita: "Oprită", terminata: "Terminată" };
export const isCampaignStatus = (v: unknown): v is CampaignStatus => typeof v === "string" && (CAMPAIGN_STATUSES as readonly string[]).includes(v);

export type CampaignFilter = { tip?: string | null; judet?: string | null; localitate?: string | null; statusuri?: OrgStatus[]; includeContactati?: boolean };
export const CampaignInput = z.object({
  nume: z.string().trim().min(2, "Dă-i un nume.").max(120),
  templateId: z.string().uuid("Alege un șablon."),
  tip: z.string().trim().optional().transform((v) => (v && isOrgType(v) ? v : null)),
  judet: z.string().trim().max(60).optional().transform((v) => v || null),
  localitate: z.string().trim().max(120).optional().transform((v) => v || null),
  statusuri: z.array(z.string()).optional().transform((v) => (v ?? []).filter(isOrgStatus).filter((s) => s !== "nu_contacta" && s !== "nelivrat")),
  includeContactati: z.boolean().optional().default(false),
  limitaZi: z.coerce.number().int().min(1, "Cel puțin 1 pe zi.").max(100, "Cel mult 100 pe zi.").default(20),
  oraStart: z.coerce.number().int().min(7).max(20).default(9),
  oraSfarsit: z.coerce.number().int().min(8).max(21).default(16),
  followUpZile: z.coerce.number().int().min(3).max(60).nullable().optional().transform((v) => v ?? null),
  followUpTemplateId: z.string().uuid().nullable().optional().transform((v) => v ?? null),
}).refine((v) => v.oraSfarsit > v.oraStart, { message: "Ora de sfârșit trebuie să fie după cea de început.", path: ["oraSfarsit"] })
  .refine((v) => !v.followUpZile || !!v.followUpTemplateId, { message: "Pentru follow-up alege și șablonul lui.", path: ["followUpTemplateId"] });
export type CampaignInput = z.infer<typeof CampaignInput>;

export async function createCampaign(db: Db, v: CampaignInput, by: string | null, now = new Date()) {
  const filtru: CampaignFilter = { tip: v.tip, judet: v.judet, localitate: v.localitate, statusuri: v.statusuri.length ? v.statusuri : ["nou"], includeContactati: v.includeContactati };
  const [r] = await db.insert(crmCampaigns).values({
    nume: v.nume, templateId: v.templateId, filtru, limitaZi: v.limitaZi, oraStart: v.oraStart, oraSfarsit: v.oraSfarsit,
    followUpZile: v.followUpZile, followUpTemplateId: v.followUpZile ? v.followUpTemplateId : null, createdBy: by, createdAt: now, updatedAt: now,
  }).returning({ id: crmCampaigns.id });
  return r.id;
}

export async function setCampaignStatus(db: Db, id: string, status: CampaignStatus, now = new Date()) {
  await db.update(crmCampaigns).set({ status, updatedAt: now, ...(status === "pornita" ? { startedAt: now } : {}) }).where(eq(crmCampaigns.id, id));
}

type Campaign = typeof crmCampaigns.$inferSelect;
type Template = typeof crmTemplates.$inferSelect;
export type Recipient = { id: string; tip: string; nume: string; localitate: string | null; judet: string | null; email: string; slug: string | null };

const notSuppressed = (col: SQL) => sql`not exists (select 1 from crm_suppression x where x.valoare = lower(${col}) or x.valoare = split_part(lower(${col}), '@', 2))`;

/** Organizațiile care primesc primul email al campaniei (cele mai prioritare întâi), fără cele pe „nu contacta”. */
export async function campaignRecipients(db: Db, c: Pick<Campaign, "id" | "filtru">, limit: number): Promise<Recipient[]> {
  const f = (c.filtru ?? {}) as CampaignFilter;
  const statuses = (f.statusuri?.length ? f.statusuri : ["nou"]).filter((s) => s !== "nu_contacta" && s !== "nelivrat");
  const statusSql = sql.join(statuses.map((s) => sql`${s}`), sql`, `);
  const r = await rows<Row>(db, sql`
    select o.id, o.tip, o.nume, o.localitate, o.judet, o.email_oficial as email, o.slug from crm_organizations o
    where o.email_oficial is not null and o.status in (${statusSql})
      ${f.tip ? sql`and o.tip = ${f.tip}` : sql``}
      ${f.judet ? sql`and lower(o.judet) in (lower(${f.judet}), lower(${COUNTIES[f.judet] ?? f.judet}))` : sql``}
      ${f.localitate ? sql`and lower(o.localitate) = lower(${f.localitate})` : sql``}
      and ${notSuppressed(sql`o.email_oficial`)}
      and not exists (select 1 from crm_sends s where s.organization_id = o.id)
      ${f.includeContactati ? sql`` : sql`and not exists (select 1 from crm_activities a where a.organization_id = o.id and a.tip in ('email_trimis','raspuns'))`}
    order by o.created_at, o.id limit ${limit}`);
  return r.map((x) => ({ id: String(x.id), tip: String(x.tip), nume: String(x.nume), localitate: (x.localitate as string) ?? null, judet: (x.judet as string) ?? null, email: String(x.email), slug: (x.slug as string) ?? null }));
}

/** Cui îi trimitem follow-up-ul: primul email a plecat de cel puțin N zile, n-a venit răspuns, nu s-a dezabonat, n-a sărit. */
export async function followUpRecipients(db: Db, c: Pick<Campaign, "id" | "followUpZile">, limit: number, now = new Date()): Promise<Recipient[]> {
  if (!c.followUpZile) return [];
  const before = new Date(now.getTime() - c.followUpZile * DAY).toISOString();
  const r = await rows<Row>(db, sql`
    select o.id, o.tip, o.nume, o.localitate, o.judet, s.email, o.slug from crm_sends s join crm_organizations o on o.id = s.organization_id
    where s.campaign_id = ${c.id} and s.pas = 1 and s.sent_at <= ${before} and s.status in ('trimis','livrat','deschis','click')
      and s.replied_at is null and o.status not in ('nu_contacta','nelivrat')
      and not exists (select 1 from crm_activities a where a.organization_id = o.id and a.tip = 'raspuns' and a.at > s.sent_at)
      and not exists (select 1 from crm_sends t where t.campaign_id = s.campaign_id and t.organization_id = s.organization_id and t.pas = 2)
      and ${notSuppressed(sql`s.email`)}
    order by s.sent_at limit ${limit}`);
  return r.map((x) => ({ id: String(x.id), tip: String(x.tip), nume: String(x.nume), localitate: (x.localitate as string) ?? null, judet: (x.judet as string) ?? null, email: String(x.email), slug: (x.slug as string) ?? null }));
}

/* ---------- Semnături și legături ---------- */

const secret = () => process.env.BETTER_AUTH_SECRET?.trim() || "cartea-neamului-local";
export const sendSig = (id: string) => createHmac("sha256", secret()).update(`crm-send:${id}`).digest("base64url").slice(0, 32);
export const checkSendSig = (id: string, s: string) => {
  const a = Buffer.from(sendSig(id)), b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
};
const q = (id: string) => `d=${id}&s=${sendSig(id)}`;
export const crmOpenUrl = (id: string) => `${SITE_URL}/api/crm/o?${q(id)}`;
export const crmClickUrl = (id: string, path: string) => `${SITE_URL}/api/crm/c?${q(id)}&u=${encodeURIComponent(path)}`;
export const crmUnsubPage = (id: string) => `${SITE_URL}/dezabonare-organizatie?${q(id)}`;
export const crmUnsubPost = (id: string) => `${SITE_URL}/api/crm/dezabonare?${q(id)}`;

/** Doar căi din site, ca linkul de click să nu poată duce altundeva. */
export function sitePath(p: string | null | undefined) {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.includes("\\")) return "/";
  return p.slice(0, 300);
}

/* ---------- Textul emailului ---------- */

export function fillTemplate(text: string, o: Pick<Recipient, "nume" | "localitate" | "judet">) {
  return text.replaceAll("{organizatie}", o.nume).replaceAll("{localitate}", o.localitate ?? "").replaceAll("{judet}", o.judet ?? "");
}

export function landingPath(t: Pick<Template, "butonCale">, o: Pick<Recipient, "tip" | "slug">, campaignId: string) {
  const base = t.butonCale || (o.tip === "scoala" ? "/scoala" : "/");
  const src = srcOf(o.tip, o.slug);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${src ? `src=${encodeURIComponent(src)}&` : ""}utm_source=email&utm_medium=email&utm_campaign=crm-${campaignId.slice(0, 8)}`;
}

export async function buildCampaignMail(t: Pick<Template, "subiect" | "corp" | "butonText" | "butonCale">, o: Recipient, sendId: string, campaignId: string) {
  const { renderMail, footerFor } = await import("./emailuri");
  const body = fillTemplate(t.corp, o);
  const blocks = [
    ...body.split(/\n\s*\n/).map((p) => ({ p: p.trim() })).filter((b) => b.p),
    ...(t.butonText ? [{ button: t.butonText, href: crmClickUrl(sendId, landingPath(t, o, campaignId)) }] : []),
    { note: "Ați primit acest email la adresa publică a instituției. Dacă nu doriți să vă mai scriem:", link: "dezabonare", href: crmUnsubPage(sendId) },
  ];
  const { html, text } = renderMail(blocks, await footerFor("ro"));
  const pixel = `<img src="${crmOpenUrl(sendId)}" width="1" height="1" alt="" style="display:none">`;
  return { subject: fillTemplate(t.subiect, o).slice(0, 160), html: html.includes("</body>") ? html.replace("</body>", `${pixel}</body>`) : html + pixel, text };
}

/* ---------- Trimiterea ---------- */

export type CampaignMailer = (m: { to: string; subject: string; html: string; text: string; tag: string; idempotencyKey: string; headers: Record<string, string>; replyTo?: string; marketing: true }) =>
  Promise<{ ok: true; id: string | null } | { skipped: true } | { ok: false }>;
const defaultMailer: CampaignMailer = async (m) => (await import("./email")).sendEmail(m);

export type BatchReport = { skipped?: string; campaigns: number; sent: number; followUps: number; blocked: number; failed: number; finished: number; byCampaign: Record<string, number> };

/** Câte emailuri de campanie au plecat azi (ziua României); `campaignId` = doar ale unei campanii. */
export async function sentToday(db: Db, now = new Date(), campaignId?: string) {
  const [r] = await rows<{ n: unknown }>(db, sql`select count(*) as n from crm_sends where sent_at >= ${roDayStart(now).toISOString()}
    and status <> 'blocat' ${campaignId ? sql`and campaign_id = ${campaignId}` : sql``}`);
  return Number(r?.n ?? 0);
}

/**
 * Un lot: pentru fiecare campanie pornită, în fereastra ei, cât mai e loc azi (pe campanie și în total): follow-up-urile scadente
 * întâi, apoi organizațiile noi. Rândul din crm_sends se scrie înaintea trimiterii, deci aceeași organizație nu primește de două ori.
 */
export async function runCampaignBatch(db: Db, o: { now?: Date; mailer?: CampaignMailer; dailyCap?: number; ignoreClock?: boolean } = {}): Promise<BatchReport> {
  const now = o.now ?? new Date();
  const rep: BatchReport = { campaigns: 0, sent: 0, followUps: 0, blocked: 0, failed: 0, finished: 0, byCampaign: {} };
  if (!o.ignoreClock && !isWorkday(now)) return { ...rep, skipped: "azi e weekend: campaniile pleacă doar luni–vineri" };
  const cap = o.dailyCap ?? (await (await import("./crm-auto")).crmLimits(db)).campanii;
  let left = cap - (await sentToday(db, now));
  if (left <= 0) return { ...rep, skipped: `limita pe zi (${cap}) e atinsă` };
  const mailer = o.mailer ?? defaultMailer;
  const { siteInbox } = await import("./email");
  const camps = await db.select().from(crmCampaigns).where(eq(crmCampaigns.status, "pornita")).orderBy(crmCampaigns.startedAt);
  for (const c of camps) {
    if (left <= 0) break;
    if (!o.ignoreClock && !inWindow(c, now)) continue;
    rep.campaigns++;
    let room = Math.min(left, c.limitaZi - (await sentToday(db, now, c.id)));
    if (room <= 0) continue;
    const [tpl] = await db.select().from(crmTemplates).where(eq(crmTemplates.id, c.templateId));
    const [fu] = c.followUpTemplateId ? await db.select().from(crmTemplates).where(eq(crmTemplates.id, c.followUpTemplateId)) : [];
    if (!tpl) continue;
    const queue: { r: Recipient; pas: 1 | 2; t: Template }[] = [
      ...(fu ? (await followUpRecipients(db, c, room, now)).map((r) => ({ r, pas: 2 as const, t: fu })) : []),
    ];
    if (queue.length < room) queue.push(...(await campaignRecipients(db, c, room - queue.length)).map((r) => ({ r, pas: 1 as const, t: tpl })));
    if (!queue.length && !c.followUpZile) {
      await setCampaignStatus(db, c.id, "terminata", now);
      rep.finished++;
      continue;
    }
    for (const { r, pas, t } of queue) {
      if (room <= 0 || left <= 0) break;
      const [row] = await db.insert(crmSends).values({ campaignId: c.id, organizationId: r.id, templateId: t.id, pas, email: r.email, sentAt: now })
        .onConflictDoNothing().returning({ id: crmSends.id });
      if (!row) continue;
      if (await isSuppressed(db, r.email)) {
        await db.update(crmSends).set({ status: "blocat", motiv: "pe lista „nu contacta”" }).where(eq(crmSends.id, row.id));
        rep.blocked++;
        continue;
      }
      const m = await buildCampaignMail(t, r, row.id, c.id);
      // Proba din preview: cu CRM_TEST_RECIPIENT pus (doar în Vercel → Preview), toate emailurile pleacă la adresa de test.
      const testTo = process.env.CRM_TEST_RECIPIENT?.trim();
      const res = await mailer({ to: testTo || r.email, subject: testTo ? `[PROBĂ pentru ${r.email}] ${m.subject}` : m.subject, html: m.html, text: m.text, tag: "crm-campanie", marketing: true, replyTo: siteInbox(), idempotencyKey: `crm-send-${row.id}`,
        headers: { "List-Unsubscribe": `<${crmUnsubPost(row.id)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
      if ("skipped" in res) {
        await db.update(crmSends).set({ status: "blocat", motiv: "oprit la trimitere (nu contacta)" }).where(eq(crmSends.id, row.id));
        rep.blocked++;
        continue;
      }
      if (!res.ok) {
        await db.update(crmSends).set({ status: "eroare", motiv: "trimiterea a eșuat" }).where(eq(crmSends.id, row.id));
        rep.failed++;
        continue;
      }
      await db.update(crmSends).set({ resendId: res.id }).where(eq(crmSends.id, row.id));
      await addActivity(db, { tip: "email_trimis", canal: "email", rezumat: `${pas === 2 ? "Follow-up" : "Campanie"} „${c.nume}”: ${m.subject}`, at: now, organizationId: r.id, externalId: `send:${row.id}`, meta: { campaignId: c.id, templateId: t.id, sendId: row.id, pas } });
      if (pas === 1) await setOrgStatus(db, r.id, "contactat", { now });
      rep.sent++;
      if (pas === 2) rep.followUps++;
      rep.byCampaign[c.nume] = (rep.byCampaign[c.nume] ?? 0) + 1;
      room--;
      left--;
    }
  }
  return rep;
}

/** Un email de probă cu textul campaniei, doar către adresa dată (a adminului). Nu se scrie nimic la organizație. */
export async function sendTestMail(db: Db, templateId: string, to: string, mailer: CampaignMailer = defaultMailer) {
  const [t] = await db.select().from(crmTemplates).where(eq(crmTemplates.id, templateId));
  if (!t) return { ok: false as const };
  const fake: Recipient = { id: "test", tip: t.tipOrg ?? "scoala", nume: "Școala Gimnazială de Probă", localitate: "Cluj-Napoca", judet: "Cluj", email: to, slug: "proba" };
  const m = await buildCampaignMail(t, fake, "00000000-0000-0000-0000-000000000000", "proba000");
  return mailer({ to, subject: `[Probă] ${m.subject}`, html: m.html, text: m.text, tag: "crm-proba", marketing: true, idempotencyKey: `crm-proba-${templateId}-${Date.now()}`, headers: {} });
}

/* ---------- Urmărirea: livrat, deschis, click, nelivrat, dezabonat ---------- */

export const SEND_EVENTS = ["livrat", "deschis", "click", "nelivrat", "dezabonat"] as const;
export type SendEvent = (typeof SEND_EVENTS)[number];
const RANK: Record<string, number> = { blocat: -1, eroare: -1, trimis: 0, livrat: 1, deschis: 2, click: 3, nelivrat: 9, dezabonat: 10 };
const ACT: Record<SendEvent, "email_livrat" | "email_deschis" | "email_click" | "email_nelivrat" | "dezabonat"> = {
  livrat: "email_livrat", deschis: "email_deschis", click: "email_click", nelivrat: "email_nelivrat", dezabonat: "dezabonat",
};
const ACT_TEXT: Record<SendEvent, string> = { livrat: "Emailul a ajuns", deschis: "Emailul a fost deschis", click: "Click în email", nelivrat: "Emailul nu a ajuns (adresă inexistentă)", dezabonat: "S-a dezabonat din email" };

/** Trece un eveniment pe trimitere și, o singură dată pe tip, pe istoricul organizației. Nelivrat → „nu contacta” (nelivrat) +
 * „de sunat”; dezabonat → adresa și organizația pe „nu contacta”. */
export async function trackSend(db: Db, sendId: string, ev: SendEvent, now = new Date(), o: { soft?: boolean } = {}) {
  const [s] = await db.select().from(crmSends).where(eq(crmSends.id, sendId));
  if (!s) return false;
  const set: Partial<typeof crmSends.$inferInsert> = {};
  if (ev === "livrat" && !s.deliveredAt) set.deliveredAt = now;
  if (ev === "deschis" && !s.openedAt) set.openedAt = now;
  if (ev === "click") { set.clicks = s.clicks + 1; if (!s.clickedAt) set.clickedAt = now; if (!s.openedAt) set.openedAt = now; }
  if (ev === "nelivrat" && !o.soft && !s.bouncedAt) set.bouncedAt = now;
  if (ev === "dezabonat" && !s.unsubscribedAt) set.unsubscribedAt = now;
  if (!(ev === "nelivrat" && o.soft) && (RANK[ev] ?? 0) > (RANK[s.status] ?? 0)) set.status = ev;
  if (Object.keys(set).length) await db.update(crmSends).set(set).where(eq(crmSends.id, sendId));
  const first = await addActivity(db, { tip: ACT[ev], canal: "email", rezumat: o.soft ? "Emailul nu a ajuns acum (cutie plină sau eroare temporară)" : ACT_TEXT[ev], at: now, organizationId: s.organizationId,
    externalId: `send:${sendId}:${ev}${o.soft ? ":soft" : ""}`, meta: { campaignId: s.campaignId, sendId } });
  if (ev === "nelivrat" && !o.soft) {
    await suppress(db, s.email, "nelivrat", { sursa: "campanie", now });
    await setOrgStatus(db, s.organizationId, "nelivrat", { now });
    await db.update(crmOrganizations).set({ deSunat: true, updatedAt: now }).where(eq(crmOrganizations.id, s.organizationId));
    await (await import("./crm-sarcini")).ensureCallTask(db, s.organizationId, now);
  }
  if (ev === "dezabonat") {
    await suppress(db, s.email, "dezabonat", { sursa: "campanie", now });
    await setOrgStatus(db, s.organizationId, "nu_contacta", { now, force: true });
  }
  return first;
}

export async function sendByResendId(db: Db, resendId: string) {
  const [s] = await db.select({ id: crmSends.id }).from(crmSends).where(eq(crmSends.resendId, resendId)).limit(1);
  return s?.id ?? null;
}

/* ---------- Webhook-ul Resend (semnătură Svix) ---------- */

/** Verifică semnătura Svix a webhook-ului (antetele svix-id, svix-timestamp, svix-signature; cheia whsec_…). */
export function verifyResendWebhook(body: string, h: { id: string | null; timestamp: string | null; signature: string | null }, secretKey: string | undefined, now = new Date()) {
  if (!secretKey || !h.id || !h.timestamp || !h.signature) return false;
  const ts = Number(h.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now.getTime() / 1000 - ts) > 5 * 60) return false;
  const key = Buffer.from(secretKey.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${body}`).digest("base64");
  return h.signature.split(" ").some((part) => {
    const [, sig] = part.split(",");
    if (!sig) return false;
    const a = Buffer.from(sig), b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** Cheia app_setting cu ultimul eveniment Resend semnat primit ({ at, type }). */
export const RESEND_LAST_KEY = "crm_resend_ultim";

/** Un eveniment Resend → evenimentul nostru (sau null dacă nu ne privește). */
export function resendEvent(p: { type?: string; data?: { email_id?: string; bounce?: { type?: string } } }): { resendId: string; ev: SendEvent; soft?: boolean } | null {
  const id = p.data?.email_id;
  if (!id) return null;
  switch (p.type) {
    case "email.delivered": return { resendId: id, ev: "livrat" };
    case "email.opened": return { resendId: id, ev: "deschis" };
    case "email.clicked": return { resendId: id, ev: "click" };
    case "email.bounced": return { resendId: id, ev: "nelivrat", soft: /transient|temporar|soft/i.test(p.data?.bounce?.type ?? "") };
    case "email.complained": return { resendId: id, ev: "dezabonat" };
    default: return null;
  }
}

/* ---------- Cifrele pentru Admin ---------- */

export type CampaignStats = { id: string; nume: string; status: string; template: string; limitaZi: number; ore: string; followUp: number | null; trimise: number; livrate: number; deschise: number; clickuri: number; nelivrate: number; dezabonate: number; raspunsuri: number; blocate: number; ramase: number };

export async function campaignList(db: Db): Promise<CampaignStats[]> {
  const camps = await db.select({ c: crmCampaigns, t: crmTemplates.nume }).from(crmCampaigns).innerJoin(crmTemplates, eq(crmTemplates.id, crmCampaigns.templateId)).orderBy(sql`${crmCampaigns.createdAt} desc`);
  const counts = await rows<Row>(db, sql`select s.campaign_id,
      count(*) filter (where s.status not in ('blocat','eroare')) as trimise,
      count(*) filter (where s.delivered_at is not null) as livrate, count(*) filter (where s.opened_at is not null) as deschise,
      count(*) filter (where s.clicked_at is not null) as clickuri, count(*) filter (where s.bounced_at is not null) as nelivrate,
      count(*) filter (where s.unsubscribed_at is not null) as dezabonate, count(*) filter (where s.status = 'blocat') as blocate,
      count(*) filter (where s.replied_at is not null or exists (select 1 from crm_activities a where a.organization_id = s.organization_id and a.tip = 'raspuns' and a.at > s.sent_at)) as raspunsuri
    from crm_sends s group by s.campaign_id`);
  const byId = new Map(counts.map((r) => [String(r.campaign_id), r]));
  const out: CampaignStats[] = [];
  for (const { c, t } of camps) {
    const n = byId.get(c.id) ?? {};
    const num = (k: string) => Number((n as Row)[k] ?? 0);
    const ramase = c.status === "terminata" ? 0 : (await campaignRecipients(db, c, 1000)).length;
    out.push({ id: c.id, nume: c.nume, status: c.status, template: t, limitaZi: c.limitaZi, ore: `${c.oraStart}–${c.oraSfarsit}`, followUp: c.followUpZile,
      trimise: num("trimise"), livrate: num("livrate"), deschise: num("deschise"), clickuri: num("clickuri"), nelivrate: num("nelivrate"), dezabonate: num("dezabonate"), raspunsuri: num("raspunsuri"), blocate: num("blocate"), ramase });
  }
  return out;
}

export async function templateList(db: Db) {
  return db.select().from(crmTemplates).orderBy(sql`${crmTemplates.createdAt} desc`);
}

/** Emailurile de campanie ale unei organizații (pentru fișa ei). */
export async function orgSends(db: Db, orgId: string) {
  return db.select({ s: crmSends, campanie: crmCampaigns.nume }).from(crmSends).innerJoin(crmCampaigns, eq(crmCampaigns.id, crmSends.campaignId))
    .where(and(eq(crmSends.organizationId, orgId))).orderBy(sql`${crmSends.sentAt} desc`);
}

/**
 * CRM Etapa 11 (Daniel, 18.11.2026): siguranță și curățenie.
 * - Dubluri: aceeași adresă, același domeniu propriu sau același nume + oraș; unirea se face doar după previzualizare și mută tot
 *   istoricul pe organizația păstrată.
 * - Istoric (audit): cine, ce, când, pentru fiecare modificare făcută din Admin → CRM (tabela audit_log, entity „crm”).
 * - Export CSV pentru orice listă și ștergere GDPR la cerere (organizație + persoane + activități), cu adresa păstrată, dacă vrei,
 *   doar pe lista „nu contacta” (ca să nu-i mai scriem din greșeală).
 */
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import {
  appSetting, auditLog, crmActivities, crmAmbassadors, crmApprovals, crmContacts, crmDeals, crmOrgAccounts, crmOrganizations, crmSends, crmTasks,
} from "@/db/schema";
import { FREE_MAIL_DOMAINS, advanceStatus, cleanEmail, dedupeKeyOf, isOrgStatus, slugify, suppress } from "./crm";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;

/* ---------- Istoricul (audit) ---------- */

export const AUDIT_ENTITY = "crm";
export async function crmAudit(db: Pick<Db, "insert">, actorId: string | null, action: string, entityId: string | null, diff?: Record<string, unknown> | null, now = new Date()) {
  try {
    await db.insert(auditLog).values({ treeId: null, actorId, entity: AUDIT_ENTITY, entityId: entityId || "-", action: action.slice(0, 120), diff: diff ?? null, createdAt: now });
  } catch (e) {
    console.error("crm audit", e);
  }
}
/** Câmpurile unui formular, scurtate (fără fișiere și fără câmpurile interne). */
export function formDiff(form: FormData | null | undefined) {
  if (!form) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== "string" || k.startsWith("$") || k === "back") continue;
    out[k] = v.length > 200 ? `${v.slice(0, 200)}…` : v;
  }
  return Object.keys(out).length ? out : null;
}
export async function auditList(db: Db, limit = 200) {
  return rows<{ id: string; at: string; actor: string | null; action: string; entity_id: string; diff: unknown; org: string | null }>(db, sql`
    select a.id, a.created_at as at, u.name as actor, a.action, a.entity_id, a.diff, o.nume as org
    from audit_log a left join "user" u on u.id = a.actor_id left join crm_organizations o on o.id::text = a.entity_id
    where a.entity = ${AUDIT_ENTITY} order by a.created_at desc limit ${limit}`);
}

/* ---------- Dublurile ---------- */

export type OrgLite = { id: string; tip: string; nume: string; localitate: string | null; email: string | null; status: string; createdAt: Date };
export type DupPair = { a: OrgLite; b: OrgLite; motiv: "aceeasi_adresa" | "acelasi_domeniu" | "nume_si_oras"; key: string };
export const DUP_LABEL: Record<DupPair["motiv"], string> = { aceeasi_adresa: "aceeași adresă", acelasi_domeniu: "același domeniu", nume_si_oras: "același nume și oraș" };
const IGNORE_KEY = "crm_nu_dubluri";
export const pairKey = (x: string, y: string) => [x, y].sort().join(":");

const normName = (s: string) => (slugify(s, 120) ?? "").replace(/\b(scoala|gimnaziala|liceul|colegiul|national|tehnologic|teoretic|nr|srl|sa|s-r-l)\b/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");

/** Perechile care par aceeași organizație (cele marcate „nu sunt dubluri” nu mai apar). */
export async function findDuplicates(db: Db, limit = 100): Promise<DupPair[]> {
  const orgs = (await db.select({ id: crmOrganizations.id, tip: crmOrganizations.tip, nume: crmOrganizations.nume, localitate: crmOrganizations.localitate, email: crmOrganizations.emailOficial, status: crmOrganizations.status, createdAt: crmOrganizations.createdAt })
    .from(crmOrganizations).orderBy(crmOrganizations.createdAt).limit(20000)) as OrgLite[];
  const [ig] = await db.select({ v: appSetting.value }).from(appSetting).where(eq(appSetting.key, IGNORE_KEY));
  const ignored = new Set((ig?.v as string[] | undefined) ?? []);
  const out: DupPair[] = [];
  const seen = new Set<string>();
  const push = (a: OrgLite, b: OrgLite, motiv: DupPair["motiv"]) => {
    const key = pairKey(a.id, b.id);
    if (seen.has(key) || ignored.has(key)) return;
    seen.add(key);
    out.push(a.createdAt <= b.createdAt ? { a, b, motiv, key } : { a: b, b: a, motiv, key });
  };
  const group = (keyOf: (o: OrgLite) => string | null, motiv: DupPair["motiv"]) => {
    const m = new Map<string, OrgLite[]>();
    for (const o of orgs) {
      const k = keyOf(o);
      if (!k) continue;
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    for (const list of m.values()) for (let i = 1; i < list.length && i < 10; i++) push(list[0], list[i], motiv);
  };
  group((o) => cleanEmail(o.email), "aceeasi_adresa");
  group((o) => {
    const d = cleanEmail(o.email)?.split("@")[1];
    return d && !FREE_MAIL_DOMAINS.has(d) ? d : null;
  }, "acelasi_domeniu");
  group((o) => {
    const nm = normName(o.nume);
    return nm && o.localitate ? `${o.tip}|${nm}|${slugify(o.localitate)}` : null;
  }, "nume_si_oras");
  return out.slice(0, limit);
}

export async function ignoreDuplicate(db: Db, a: string, b: string, by: string | null) {
  const [ig] = await db.select({ v: appSetting.value }).from(appSetting).where(eq(appSetting.key, IGNORE_KEY));
  const list = [...new Set([...((ig?.v as string[] | undefined) ?? []), pairKey(a, b)])].slice(-5000);
  await db.insert(appSetting).values({ key: IGNORE_KEY, value: list, updatedBy: by }).onConflictDoUpdate({ target: appSetting.key, set: { value: list, updatedBy: by, updatedAt: new Date() } });
}

const MOVABLE = ["crm_contacts", "crm_activities", "crm_deals", "crm_approvals", "crm_sends", "crm_tasks", "crm_org_accounts", "crm_ambassadors"] as const;
const MOVABLE_LABEL: Record<(typeof MOVABLE)[number], string> = {
  crm_contacts: "persoane de contact", crm_activities: "activități", crm_deals: "deal-uri", crm_approvals: "aprobări", crm_sends: "emailuri de campanie",
  crm_tasks: "sarcini", crm_org_accounts: "conturi aduse", crm_ambassadors: "profesori",
};

/** Ce s-ar întâmpla la unire: ce se mută de pe cea ștearsă și ce câmpuri goale se completează pe cea păstrată. */
export async function mergePreview(db: Db, keepId: string, dropId: string) {
  const [keep] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, keepId));
  const [drop] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, dropId));
  if (!keep || !drop || keepId === dropId) return null;
  const counts: { label: string; n: number }[] = [];
  for (const t of MOVABLE) {
    const [r] = await rows<{ c: unknown }>(db, sql`select count(*) as c from ${sql.raw(t)} where organization_id = ${dropId}`);
    if (n(r?.c)) counts.push({ label: MOVABLE_LABEL[t], n: n(r?.c) });
  }
  const FIELDS = ["localitate", "judet", "site", "emailOficial", "telefon", "sursaDatelor", "note", "partnerId", "cod", "stripePromoId", "schoolId"] as const;
  const fill: Record<string, unknown> = {};
  for (const f of FIELDS) if ((keep[f] === null || keep[f] === "") && drop[f] !== null && drop[f] !== "") fill[f] = drop[f];
  const status = isOrgStatus(keep.status) && isOrgStatus(drop.status) ? advanceStatus(keep.status, drop.status) : keep.status;
  return { keep, drop, counts, fill, status, deSunat: keep.deSunat || drop.deSunat };
}

/** Unește două organizații: totul de pe `drop` trece pe `keep`, câmpurile goale se completează, apoi `drop` se șterge. */
export async function mergeOrgs(db: Db, keepId: string, dropId: string, by: string | null, now = new Date()) {
  const p = await mergePreview(db, keepId, dropId);
  if (!p) return false;
  await db.transaction(async (tx) => {
    // Emailul de campanie din aceeași campanie la ambele: îl păstrăm pe cel al organizației păstrate.
    await tx.execute(sql`delete from crm_sends d where d.organization_id = ${dropId}
      and exists (select 1 from crm_sends k where k.organization_id = ${keepId} and k.campaign_id = d.campaign_id and k.pas = d.pas)`);
    for (const t of MOVABLE) await tx.execute(sql`update ${sql.raw(t)} set organization_id = ${keepId} where organization_id = ${dropId}`);
    const dropSlug = p.drop.slug;
    await tx.delete(crmOrganizations).where(eq(crmOrganizations.id, dropId));
    const email = (p.fill.emailOficial as string | undefined) ?? p.keep.emailOficial;
    const newKey = p.fill.emailOficial ? dedupeKeyOf({ tip: p.keep.tip, nume: p.keep.nume, localitate: p.keep.localitate, emailOficial: email }) : p.keep.dedupeKey;
    await tx.update(crmOrganizations).set({
      ...p.fill, status: p.status, deSunat: p.deSunat, dedupeKey: newKey,
      note: [p.keep.note, p.drop.note].filter(Boolean).join("\n").slice(0, 4000) || null, updatedAt: now,
    }).where(eq(crmOrganizations.id, keepId));
    await tx.insert(crmActivities).values({ tip: "nota", canal: "crm", rezumat: `Unită cu „${p.drop.nume}”${dropSlug ? ` (${dropSlug})` : ""}`, at: now, organizationId: keepId, createdBy: by });
  });
  await crmAudit(db, by, "unire organizații", keepId, { pastrata: p.keep.nume, stearsa: p.drop.nume, mutate: p.counts }, now);
  return true;
}

/* ---------- Ștergerea GDPR ---------- */

/** Șterge organizația, persoanele ei de contact și tot istoricul. Cu `keepSuppression`, adresele rămân doar pe „nu contacta”. */
export async function gdprDeleteOrg(db: Db, orgId: string, o: { keepSuppression: boolean; by: string | null; now?: Date }) {
  const now = o.now ?? new Date();
  const [org] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, orgId));
  if (!org) return false;
  const contacts = await db.select({ email: crmContacts.email }).from(crmContacts).where(eq(crmContacts.organizationId, orgId));
  const emails = [org.emailOficial, ...contacts.map((c) => c.email)].map((e) => cleanEmail(e)).filter((e): e is string => !!e);
  await db.transaction(async (tx) => {
    await tx.delete(crmApprovals).where(eq(crmApprovals.organizationId, orgId));
    await tx.delete(crmActivities).where(eq(crmActivities.organizationId, orgId));
    await tx.delete(crmContacts).where(eq(crmContacts.organizationId, orgId));
    await tx.delete(crmDeals).where(eq(crmDeals.organizationId, orgId));
    await tx.delete(crmTasks).where(eq(crmTasks.organizationId, orgId));
    await tx.delete(crmSends).where(eq(crmSends.organizationId, orgId));
    await tx.delete(crmOrgAccounts).where(eq(crmOrgAccounts.organizationId, orgId));
    await tx.update(crmAmbassadors).set({ organizationId: null }).where(eq(crmAmbassadors.organizationId, orgId));
    await tx.delete(crmOrganizations).where(eq(crmOrganizations.id, orgId));
    // Ce scria în istoricul de modificări despre ea: rămâne doar faptul că s-a modificat, fără date.
    await tx.update(auditLog).set({ diff: null }).where(and(eq(auditLog.entity, AUDIT_ENTITY), eq(auditLog.entityId, orgId)));
  });
  if (o.keepSuppression) for (const e of emails) await suppress(db, e, "nu_contacta", { sursa: "stergere-gdpr", by: o.by, now });
  await crmAudit(db, o.by, "ștergere GDPR", orgId, { adreseRamasePeNuContacta: o.keepSuppression ? emails.length : 0 }, now);
  return true;
}

/** O persoană de contact, la cererea ei. */
export async function gdprDeleteContact(db: Db, contactId: string, o: { keepSuppression: boolean; by: string | null; now?: Date }) {
  const [c] = await db.select().from(crmContacts).where(eq(crmContacts.id, contactId));
  if (!c) return false;
  await db.delete(crmContacts).where(eq(crmContacts.id, contactId));
  const e = cleanEmail(c.email);
  if (o.keepSuppression && e) await suppress(db, e, "nu_contacta", { sursa: "stergere-gdpr", by: o.by, now: o.now });
  await crmAudit(db, o.by, "ștergere GDPR persoană", c.organizationId, null, o.now);
  return true;
}

/* ---------- Exportul CSV ---------- */

export const EXPORTS = {
  organizatii: "Organizațiile", activitati: "Istoricul (activitățile)", deal: "Deal-urile", nucontacta: "Lista „nu contacta”", campanii: "Emailurile de campanie",
  sarcini: "Sarcinile", profesori: "Profesorii ambasadori", aprobari: "Aprobările", istoric: "Istoricul modificărilor",
} as const;
export type ExportKind = keyof typeof EXPORTS;
export const isExportKind = (v: unknown): v is ExportKind => typeof v === "string" && v in EXPORTS;

const QUERIES: Record<ExportKind, SQL> = {
  organizatii: sql`select o.id, o.tip, o.nume, o.localitate, o.judet, o.tara, o.site, o.email_oficial, o.telefon, o.status, o.de_sunat, o.cod, o.slug, o.sursa_datelor, o.created_at, o.updated_at from crm_organizations o order by o.nume`,
  activitati: sql`select a.at, o.nume as organizatie, a.tip, a.canal, a.rezumat, a.meta->>'clasificare' as clasificare from crm_activities a left join crm_organizations o on o.id = a.organization_id order by a.at desc limit 50000`,
  deal: sql`select o.nume as organizatie, d.* from crm_deals d join crm_organizations o on o.id = d.organization_id order by d.created_at desc`,
  nucontacta: sql`select valoare, tip, motiv, sursa, created_at from crm_suppression order by created_at desc`,
  campanii: sql`select c.nume as campanie, o.nume as organizatie, s.email, s.pas, s.status, s.motiv, s.sent_at, s.delivered_at, s.opened_at, s.clicked_at, s.clicks, s.bounced_at, s.unsubscribed_at, s.replied_at
    from crm_sends s join crm_campaigns c on c.id = s.campaign_id join crm_organizations o on o.id = s.organization_id order by s.sent_at desc limit 50000`,
  sarcini: sql`select t.scadenta, o.nume as organizatie, t.titlu, t.status, t.sursa, t.created_at, t.done_at from crm_tasks t left join crm_organizations o on o.id = t.organization_id order by t.scadenta desc`,
  profesori: sql`select a.nume, a.email, a.telefon, a.slug, a.cod, a.activ, o.nume as scoala, a.created_at,
    (select count(*) from crm_ambassador_accounts x where x.ambassador_id = a.id) as elevi from crm_ambassadors a left join crm_organizations o on o.id = a.organization_id order by a.nume`,
  aprobari: sql`select a.created_at, a.tip_actiune, a.status, a.risc, a.motiv, o.nume as organizatie, a.cand from crm_approvals a left join crm_organizations o on o.id = a.organization_id order by a.created_at desc`,
  istoric: sql`select a.created_at, u.name as cine, a.action as ce, a.entity_id, a.diff from audit_log a left join "user" u on u.id = a.actor_id where a.entity = 'crm' order by a.created_at desc limit 50000`,
};

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Formulele nu se execută în Excel (=, +, -, @ la început).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
/** CSV cu „;” (cum îl deschide Excel în română) și BOM pentru diacritice. */
export function toCsv(list: Row[]) {
  if (!list.length) return "﻿";
  const cols = Object.keys(list[0]);
  return `﻿${[cols.join(";"), ...list.map((r) => cols.map((c) => cell(r[c])).join(";"))].join("\r\n")}\r\n`;
}
export async function exportCsv(db: Db, kind: ExportKind) {
  return toCsv(await rows(db, QUERIES[kind]));
}


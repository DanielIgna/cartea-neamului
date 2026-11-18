/**
 * Scorul (0–100) și etapa fiecărui utilizator, plus prioritatea organizațiilor din CRM (Daniel, 17.11.2026, CRM Etapa 3).
 * Totul din reguli scrise de mână, arătate în Admin → CRM → Scor: fără cutie neagră și fără cifre inventate. Conturile de test
 * nu primesc scor. Se recalculează cel mult o dată pe oră (la deschiderea panoului) și zilnic din ceasul Autonomiei; se scriu
 * doar rândurile care s-au schimbat.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, crmUserSignals } from "@/db/schema";
import { realUserSql } from "./crm";
import { accessFor, accountPlans, planSettings, type Access, type PlanSettings } from "./plans";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

/* ---------- Etapele ---------- */

export const LIFE_STAGES = ["cont", "activat", "angajat", "platitor", "ambasador", "in_risc", "pierdut"] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];
export const LIFE_LABEL: Record<LifeStage, string> = {
  cont: "Cont creat", activat: "Activat", angajat: "Angajat", platitor: "Plătitor", ambasador: "Ambasador", in_risc: "În risc", pierdut: "Pierdut",
};
export const LIFE_RULE: Record<LifeStage, string> = {
  cont: "și-a făcut cont",
  activat: "are cel puțin 3 persoane în arbore",
  angajat: "a invitat o rudă sau a adăugat poze / amintiri",
  platitor: "are anul plătit",
  ambasador: "a adus cel puțin 2 conturi prin legătura lui",
  in_risc: "nicio activitate de 14 zile, sau i s-au terminat zilele gratuite / anul plătit fără reînnoire",
  pierdut: "zilele gratuite s-au terminat de 30 de zile și n-a plătit niciodată",
};

export type Facts = {
  verified: boolean; persons: number; treePersons: number; invited: boolean; inviteAccepted: boolean; activeDays30: number;
  goodSource: boolean; emailClick: boolean; codeUsed: boolean; media: boolean; paidEver: boolean; brought: number; lastActivity: Date | null;
};

/* ---------- Scorul ---------- */

export const SCORE_RULES: { key: string; label: string; max: number; pts: (f: Facts) => number }[] = [
  { key: "email", label: "Email confirmat (sau intrare cu Google)", max: 10, pts: (f) => (f.verified ? 10 : 0) },
  { key: "persoane", label: "Persoane adăugate: 2 puncte pe persoană", max: 20, pts: (f) => Math.min(20, 2 * f.persons) },
  { key: "rude", label: "A invitat o rudă (10) și ruda a intrat (încă 5)", max: 15, pts: (f) => (f.invited ? 10 : 0) + (f.inviteAccepted ? 5 : 0) },
  { key: "zile", label: "Zile active în ultimele 30: 3 puncte pe zi", max: 15, pts: (f) => Math.min(15, 3 * f.activeDays30) },
  { key: "sursa", label: "Venit prin școală, firmă, recomandare sau partener", max: 10, pts: (f) => (f.goodSource ? 10 : 0) },
  { key: "planuri", label: "A apăsat într-un email despre planuri (vizitele pe prețuri sunt anonime, nu se pot lega de om)", max: 5, pts: (f) => (f.emailClick ? 5 : 0) },
  { key: "cod", label: "A folosit un cod (card cadou sau reducere)", max: 10, pts: (f) => (f.codeUsed ? 10 : 0) },
  { key: "amintiri", label: "A adăugat poze sau amintiri", max: 5, pts: (f) => (f.media ? 5 : 0) },
  { key: "plata", label: "A plătit", max: 10, pts: (f) => (f.paidEver ? 10 : 0) },
];
export function scoreOf(f: Facts): { score: number; parts: Record<string, number> } {
  const parts = Object.fromEntries(SCORE_RULES.map((r) => [r.key, Math.max(0, Math.min(r.max, r.pts(f)))]));
  return { score: Math.min(100, Object.values(parts).reduce((a, b) => a + b, 0)), parts };
}

/** Etapa, în ordinea în care contează: pierdut, în risc, ambasador, plătitor, angajat, activat, cont. */
export function lifeStageOf(f: Facts, access: Access, created: Date, now = new Date()): LifeStage {
  if (access.kind === "expirat" && !f.paidEver && now.getTime() - access.since.getTime() >= 30 * DAY) return "pierdut";
  const last = f.lastActivity ?? created;
  if (now.getTime() - last.getTime() >= 14 * DAY || access.kind === "expirat") return "in_risc";
  if (f.brought >= 2) return "ambasador";
  if (access.kind === "platit") return "platitor";
  if (f.invited || f.media) return "angajat";
  if (f.treePersons >= 3) return "activat";
  return "cont";
}

/* ---------- Faptele, dintr-o singură interogare ---------- */

const GOOD_SOURCE = `(s.invite or coalesce(s.first_src, s.source, '') ~ '^(scoala|firma|partener|magazin|asociatie)-' or s.answer = 'recomandare'
  or exists (select 1 from partner_referral pr where pr.user_id = u.id))`;

export async function userFacts(db: Db, now = new Date()) {
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  return rows<Row & { id: string; created_at: string; email: string; email_verified: boolean; free_until: string | null }>(db, sql`
    with act as (
      select user_id as uid, created_at as at from session union all select user_id, updated_at from session
      union all select created_by, created_at from person where created_by is not null
      union all select author_id, created_at from memory where author_id is not null
      union all select uploaded_by, created_at from document where uploaded_by is not null
    )
    select u.id, u.email, u.email_verified, u.created_at, u.free_until,
      (u.email_verified or exists (select 1 from account a where a.user_id = u.id and a.provider_id = 'google')) as verified,
      (select count(*) from person p where p.created_by = u.id) as persons,
      coalesce((select max(c) from (select count(*) as c from person p join tree_member m on m.tree_id = p.tree_id and m.user_id = u.id group by p.tree_id) x), 0) as tree_persons,
      (exists (select 1 from invitation i where i.created_by = u.id) or exists (select 1 from invite_referral r where r.referrer_id = u.id)) as invited,
      (exists (select 1 from invitation i where i.created_by = u.id and i.accepted_at is not null) or exists (select 1 from invite_referral r where r.referrer_id = u.id)) as invite_accepted,
      (select count(distinct date_trunc('day', a.at)) from act a where a.uid = u.id and a.at > ${since30}) as active_days,
      (select max(a.at) from act a where a.uid = u.id) as last_activity,
      coalesce((select ${sql.raw(GOOD_SOURCE)} from account_source s where s.user_id = u.id), exists (select 1 from partner_referral pr where pr.user_id = u.id)) as good_source,
      exists (select 1 from conversion_mail cm where cm.user_id = u.id and cm.clicked_at is not null and cm.step in ('planuri','ultimazi','reducere','asteapta')) as email_click,
      (exists (select 1 from gift_cards g where g.redeemed_by_user_id = u.id) or exists (select 1 from conversion_offer o where o.user_id = u.id and o.used_at is not null)) as code_used,
      (exists (select 1 from memory mm where mm.author_id = u.id) or exists (select 1 from document d where d.uploaded_by = u.id and d.kind in ('photo','audio'))) as media,
      exists (select 1 from payment p where p.user_id = u.id) as paid_ever,
      (select count(*) from invite_referral r where r.referrer_id = u.id and r.status <> 'respins') as brought,
      (select coalesce(s.first_src, s.source) from account_source s where s.user_id = u.id) as sursa
    from "user" u where ${realUserSql("u")}`);
}

export const factsOf = (r: Row): Facts => ({
  verified: !!r.verified, persons: n(r.persons), treePersons: n(r.tree_persons), invited: !!r.invited, inviteAccepted: !!r.invite_accepted,
  activeDays30: n(r.active_days), goodSource: !!r.good_source, emailClick: !!r.email_click, codeUsed: !!r.code_used, media: !!r.media,
  paidEver: !!r.paid_ever, brought: n(r.brought), lastActivity: r.last_activity ? new Date(r.last_activity as string) : null,
});

/* ---------- Recalcularea ---------- */

export const REFRESH_KEY = "crm_scor_ultima";

/** Recalculează scorurile; scrie doar ce s-a schimbat. Accesul se socotește ca în Manager control (cu plățile oprite, ca și cum ar fi pornite). */
export async function refreshSignals(db: Db, now = new Date()) {
  const s0 = await planSettings(db);
  const s: PlanSettings = s0.on ? s0 : { ...s0, on: true, startedAt: s0.startedAt ?? now.toISOString() };
  const [facts, plans, existing] = await Promise.all([userFacts(db, now), accountPlans(db), db.select().from(crmUserSignals)]);
  const old = new Map(existing.map((e) => [e.userId, e]));
  let changed = 0;
  for (const r of facts) {
    const f = factsOf(r);
    const ap = plans.get(r.id);
    const created = new Date(r.created_at);
    const access = accessFor({ createdAt: created, plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, tier: ap?.tier,
      freeUntil: r.free_until ? new Date(r.free_until) : null, keepUntil: ap?.keepUntil ? new Date(ap.keepUntil) : null }, s, now);
    const { score, parts } = scoreOf(f);
    const etapa = lifeStageOf(f, access, created, now);
    const sursa = (r.sursa as string | null) ?? null;
    const o = old.get(r.id);
    if (o && o.scor === score && o.etapa === etapa && (o.sursa ?? null) === sursa && (o.ultimaActivitate?.getTime() ?? null) === (f.lastActivity?.getTime() ?? null)) continue;
    const detalii = { parts, brought: f.brought, persons: f.persons, treePersons: f.treePersons };
    await db.insert(crmUserSignals).values({ userId: r.id, sursa, scor: score, etapa, ultimaActivitate: f.lastActivity, detalii, updatedAt: now })
      .onConflictDoUpdate({ target: crmUserSignals.userId, set: { sursa, scor: score, etapa, ultimaActivitate: f.lastActivity, detalii, updatedAt: now } });
    changed++;
  }
  // Conturile care au devenit „de test” sau au fost șterse nu mai au scor.
  const real = new Set(facts.map((r) => r.id));
  const gone = existing.filter((e) => !real.has(e.userId)).map((e) => e.userId);
  if (gone.length) await db.delete(crmUserSignals).where(sql`${crmUserSignals.userId} in (${sql.join(gone.map((g) => sql`${g}`), sql`, `)})`);
  await db.insert(appSetting).values({ key: REFRESH_KEY, value: { at: now.toISOString(), users: facts.length, changed }, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: { at: now.toISOString(), users: facts.length, changed }, updatedAt: now } });
  return { users: facts.length, changed, removed: gone.length };
}

/** La deschiderea panoului: recalculează doar dacă ultima rulare e mai veche de o oră. */
export async function refreshIfStale(db: Db, now = new Date()) {
  const [r] = await db.select({ v: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${REFRESH_KEY}`);
  const at = (r?.v as { at?: string } | undefined)?.at;
  if (at && now.getTime() - new Date(at).getTime() < 3600_000) return null;
  const out = await refreshSignals(db, now);
  await (await import("./crm-bani")).refreshOrgAccounts(db, now).catch((e) => console.error("crm: conturi aduse", e));
  return out;
}

export async function signalsMap(db: Pick<Db, "select">) {
  const r = await db.select().from(crmUserSignals);
  return new Map(r.map((x) => [x.userId, x]));
}

export async function stageCounts(db: Db) {
  const r = await rows<{ etapa: string; c: unknown; scor: unknown }>(db, sql`select etapa, count(*) as c, round(avg(scor)) as scor from crm_user_signals group by etapa`);
  return Object.fromEntries(LIFE_STAGES.map((k) => { const x = r.find((y) => y.etapa === k); return [k, { count: n(x?.c), avgScore: n(x?.scor) }]; })) as Record<LifeStage, { count: number; avgScore: number }>;
}

/* ---------- Prioritatea organizațiilor ---------- */

/** Anul școlar (1 septembrie – 20 iunie): atunci școlile cântăresc mai mult. */
export const schoolSeason = (now = new Date()) => { const m = now.getUTCMonth(), d = now.getUTCDate(); return m >= 8 || m < 5 || (m === 5 && d <= 20); };

export const ORG_RULES = [
  "A răspuns +25, interesat +40, în discuție +45, deja client/partener +20; nelivrat −10; „nu contacta” = 0",
  "Școală +15 în anul școlar (5 în vacanță), firmă +10, asociație din diaspora +8, alt tip +5",
  "Mărimea din deal: de la 10 conturi +6, de la 30 +12, de la 100 +20",
  "Județ unde au venit deja conturi pe linkurile altor organizații +10",
];
export function orgPriority(o: { tip: string; status: string; maxAccounts: number; warmCounty: boolean }, now = new Date()): number {
  if (o.status === "nu_contacta") return 0;
  let p = ({ a_raspuns: 25, interesat: 40, in_discutie: 45, client: 20, partener: 20, nelivrat: -10 } as Record<string, number>)[o.status] ?? 0;
  p += o.tip === "scoala" ? (schoolSeason(now) ? 15 : 5) : o.tip === "firma" ? 10 : o.tip === "asociatie_diaspora" ? 8 : 5;
  p += o.maxAccounts >= 100 ? 20 : o.maxAccounts >= 30 ? 12 : o.maxAccounts >= 10 ? 6 : 0;
  if (o.warmCounty) p += 10;
  return Math.max(0, Math.min(100, p));
}

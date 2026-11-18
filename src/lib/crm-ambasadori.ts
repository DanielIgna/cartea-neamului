/**
 * CRM Etapa 10 (Daniel, 18.11.2026): profesorii ambasadori.
 *
 * Un profesor are linkul lui (`?src=prof-<slug>`), poate avea codul lui NEAM-XXXX (aceeași reducere ca NEAM90) și poate fi legat
 * de codul clasei lui din Admin → Școli. Elevii (conturile) aduși așa se țin în crm_ambassador_accounts; plățile lor dau
 * recompensa, calculată după regulile din Admin (app_setting `crm_recompense`). Recompensele date se trec de mână (cât, când),
 * ca să se vadă cât mai e de dat. Datele de contact ale profesorului se țin doar cu acordul lui. Conturile de test nu contează.
 */
import { eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { accountSource, appSetting, crmAmbassadorAccounts, crmAmbassadorPayouts, crmAmbassadors } from "@/db/schema";
import { cleanEmail, slugify } from "./crm";
import { createNeamPromo } from "./crm-bani";
import { realAccountSql } from "./conturi-test";
import { SITE_URL } from "./site-url";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
export const AMB_PREFIX = "prof-";
export const ambSrc = (slug: string) => `${AMB_PREFIX}${slug}`;
export const ambLink = (slug: string) => `${SITE_URL}/scoala?src=${ambSrc(slug)}`;

/* ---------- Regulile recompensei (Admin) ---------- */

export const REWARD_KEY = "crm_recompense";
export const RewardRules = z.object({
  leiPerCont: z.coerce.number().int().min(0).max(500).default(0),
  leiPerPlata: z.coerce.number().int().min(0).max(500).default(10),
  pragAnGratuit: z.coerce.number().int().min(0).max(500).default(10),
  minimPlata: z.coerce.number().int().min(0).max(5000).default(40),
});
export type RewardRules = z.infer<typeof RewardRules>;
export const DEFAULT_RULES: RewardRules = { leiPerCont: 0, leiPerPlata: 10, pragAnGratuit: 10, minimPlata: 40 };

export async function rewardRules(db: Pick<Db, "select">): Promise<RewardRules> {
  try {
    const [r] = await db.select({ v: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${REWARD_KEY}`);
    const p = RewardRules.safeParse({ ...DEFAULT_RULES, ...((r?.v ?? {}) as object) });
    return p.success ? p.data : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}
export async function saveRewardRules(db: Pick<Db, "insert">, v: RewardRules, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: REWARD_KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/** Recompensa: lei pe fiecare elev cu cont + lei pe fiecare elev care a plătit; la fiecare `pragAnGratuit` elevi plătitori, un an gratuit. */
export function rewardFor(r: RewardRules, accounts: number, paid: number) {
  const lei = r.leiPerCont * accounts + r.leiPerPlata * paid;
  const ani = r.pragAnGratuit > 0 ? Math.floor(paid / r.pragAnGratuit) : 0;
  return { lei, ani };
}

/* ---------- Profesorii ---------- */

export const AmbassadorInput = z.object({
  nume: z.string().trim().min(3, "Scrie numele profesorului.").max(120),
  email: z.string().trim().max(200).optional().transform((v) => cleanEmail(v) ?? null),
  telefon: z.string().trim().max(40).optional().transform((v) => v || null),
  acord: z.boolean(),
  organizationId: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  schoolCodeId: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  nota: z.string().trim().max(500).optional().transform((v) => v || null),
}).refine((v) => v.acord || (!v.email && !v.telefon), { message: "Emailul sau telefonul profesorului se păstrează doar cu acordul lui.", path: ["acord"] });
export type AmbassadorInput = z.infer<typeof AmbassadorInput>;

export async function createAmbassador(db: Db, v: AmbassadorInput, by: string | null, now = new Date()) {
  const base = slugify(v.nume, 30) ?? "profesor";
  for (let i = 0; i < 20; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const [r] = await db.insert(crmAmbassadors).values({
      nume: v.nume, email: v.acord ? v.email : null, telefon: v.acord ? v.telefon : null, acordLa: v.acord && (v.email || v.telefon) ? now : null,
      organizationId: v.organizationId, schoolCodeId: v.schoolCodeId, nota: v.nota, slug, createdBy: by, createdAt: now,
    }).onConflictDoNothing().returning({ id: crmAmbassadors.id, slug: crmAmbassadors.slug });
    if (r) return r;
  }
  throw new Error("nu am găsit un nume liber pentru link");
}

export async function ambassadorCode(db: Db, id: string, f: typeof fetch = fetch) {
  const [a] = await db.select({ cod: crmAmbassadors.cod }).from(crmAmbassadors).where(eq(crmAmbassadors.id, id));
  if (!a) throw new Error("profesorul nu există");
  if (a.cod) return a.cod;
  const p = await createNeamPromo({ sursa: "profesor", crmAmbassador: id }, f);
  await db.update(crmAmbassadors).set({ cod: p.code, stripePromoId: p.promoId }).where(eq(crmAmbassadors.id, id));
  return p.code;
}

export async function addPayout(db: Db, ambassadorId: string, suma: number, nota: string | null, by: string | null, now = new Date()) {
  await db.insert(crmAmbassadorPayouts).values({ ambassadorId, suma: Math.round(suma), nota, at: now, createdBy: by });
}

/* ---------- Elevii aduși ---------- */

/** Leagă conturile noi de profesori: după link (?src=prof-…) și după codul clasei. Prima legătură rămâne. */
export async function refreshAmbassadorAccounts(db: Db, now = new Date()) {
  const r = await rows<{ user_id: string; amb: string; via: string; at: string }>(db, sql`
    select s.user_id, a.id as amb, 'src' as via, u.created_at as at from account_source s
      join crm_ambassadors a on ${AMB_PREFIX} || a.slug in (s.first_src, s.source, s.last_src)
      join "user" u on u.id = s.user_id
      where ${realAccountSql("u")} and not exists (select 1 from crm_ambassador_accounts x where x.user_id = s.user_id)
    union all
    select ss.user_id, a.id, 'clasa', ss.created_at from school_signup ss join crm_ambassadors a on a.school_code_id = ss.code_id
      join "user" u on u.id = ss.user_id
      where ${realAccountSql("u")} and not exists (select 1 from crm_ambassador_accounts x where x.user_id = ss.user_id)
    union all
    select sp.user_id, a.id, 'clasa', sp.created_at from school_payment sp join crm_ambassadors a on a.school_code_id = sp.code_id
      join "user" u on u.id = sp.user_id
      where ${realAccountSql("u")} and not exists (select 1 from crm_ambassador_accounts x where x.user_id = sp.user_id)`);
  let added = 0;
  for (const x of r) {
    const ins = await db.insert(crmAmbassadorAccounts).values({ userId: x.user_id, ambassadorId: x.amb, via: x.via, at: x.at ? new Date(x.at) : now }).onConflictDoNothing().returning();
    added += ins.length;
  }
  return { added };
}

/** La înscriere: contul venit pe linkul unui profesor se leagă imediat. Nu aruncă. */
export async function attributeToAmbassador(db: Db, userId: string, now = new Date()) {
  try {
    const [s] = await db.select().from(accountSource).where(eq(accountSource.userId, userId));
    for (const src of [s?.firstSrc, s?.source, s?.lastSrc]) {
      if (!src?.startsWith(AMB_PREFIX)) continue;
      const [a] = await db.select({ id: crmAmbassadors.id }).from(crmAmbassadors).where(eq(crmAmbassadors.slug, src.slice(AMB_PREFIX.length)));
      if (a) {
        await db.insert(crmAmbassadorAccounts).values({ userId, ambassadorId: a.id, via: "src", at: now }).onConflictDoNothing();
        return;
      }
    }
  } catch (e) {
    console.error("crm: profesor", e);
  }
}

/** La plată: codul NEAM-XXXX al unui profesor leagă contul de el. */
export async function ambassadorOnPayment(db: Db, p: { userId: string; promo?: string | null; offer?: string | null }, now = new Date()) {
  if (!p.userId || (!p.promo && !p.offer)) return false;
  const [a] = await db.select({ id: crmAmbassadors.id }).from(crmAmbassadors)
    .where(sql`(${crmAmbassadors.stripePromoId} is not null and ${crmAmbassadors.stripePromoId} = ${p.promo ?? ""}) or ${crmAmbassadors.cod} = ${p.offer ?? ""}`).limit(1);
  if (!a) return false;
  await db.insert(crmAmbassadorAccounts).values({ userId: p.userId, ambassadorId: a.id, via: "cod", at: now }).onConflictDoNothing();
  return true;
}

/* ---------- Cifrele ---------- */

export type AmbassadorRow = { id: string; nume: string; email: string | null; telefon: string | null; slug: string; cod: string | null; activ: boolean; org: string | null; orgNume: string | null; clasa: string | null;
  elevi: number; platitori: number; venit: number; recompensaLei: number; aniGratuiti: number; dat: number; deDat: number };

export async function ambassadorList(db: Db): Promise<AmbassadorRow[]> {
  const rules = await rewardRules(db);
  const r = await rows<Row>(db, sql`
    select a.id, a.nume, a.email, a.telefon, a.slug, a.cod, a.activ, a.organization_id as org, o.nume as org_nume, c.code as clasa,
      (select count(*) from crm_ambassador_accounts x join "user" u on u.id = x.user_id where x.ambassador_id = a.id and ${realAccountSql("u")}) as elevi,
      (select count(distinct x.user_id) from crm_ambassador_accounts x join "user" u on u.id = x.user_id join payment p on p.user_id = x.user_id
        where x.ambassador_id = a.id and ${realAccountSql("u")} and p.amount >= ${rules.minimPlata * 100}) as platitori,
      (select coalesce(sum(p.amount), 0) from crm_ambassador_accounts x join "user" u on u.id = x.user_id join payment p on p.user_id = x.user_id
        where x.ambassador_id = a.id and ${realAccountSql("u")} and p.currency = 'ron') as venit,
      (select coalesce(sum(suma), 0) from crm_ambassador_payouts y where y.ambassador_id = a.id) as dat
    from crm_ambassadors a left join crm_organizations o on o.id = a.organization_id left join school_code c on c.id = a.school_code_id
    order by a.activ desc, a.created_at desc`);
  return r.map((x) => {
    const elevi = n(x.elevi), platitori = n(x.platitori);
    const rw = rewardFor(rules, elevi, platitori);
    return { id: String(x.id), nume: String(x.nume), email: (x.email as string) ?? null, telefon: (x.telefon as string) ?? null, slug: String(x.slug), cod: (x.cod as string) ?? null, activ: !!x.activ,
      org: (x.org as string) ?? null, orgNume: (x.org_nume as string) ?? null, clasa: (x.clasa as string) ?? null, elevi, platitori, venit: n(x.venit) / 100,
      recompensaLei: rw.lei, aniGratuiti: rw.ani, dat: n(x.dat), deDat: Math.max(0, rw.lei - n(x.dat)) };
  });
}

/**
 * CRM Etapa 7 (Daniel, 18.11.2026): legătura cu banii.
 *
 * Un cont nou e „adus” de o organizație (crm_org_accounts, o singură organizație pe cont, prima care l-a adus):
 * - prin linkul ei `?src=<tip>-<slug>` (sursa first-touch sau ultima din account_source),
 * - prin codul ei NEAM-XXXX (aceeași reducere ca NEAM90, făcut în Stripe cu metadata organizației), la plată,
 * - prin codul unei clase din Admin → Școli, dacă școala e legată de organizație pe fișa ei.
 * Plățile conturilor aduse se trec ca activitate „plată” pe organizație; prima o trece în „client”. Conturile de test nu contează.
 */
import { randomInt } from "node:crypto";
import { eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { accountSource, crmOrgAccounts, crmOrganizations } from "@/db/schema";
import { addActivity, setOrgStatus } from "./crm";
import { srcOf } from "./crm-admin";
import { realAccountSql } from "./conturi-test";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;

/* ---------- Codul NEAM-XXXX ---------- */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newOrgCode() {
  let s = "NEAM-";
  for (let i = 0; i < 4; i++) s += ALPHA[randomInt(ALPHA.length)];
  return s;
}
export const BASE_CODE = "NEAM90";

async function stripe(path: string, params: Record<string, string> | null, f: typeof fetch, method: "GET" | "POST" = "POST") {
  const r = await f(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    ...(params ? { body: new URLSearchParams(params) } : {}),
  });
  return { ok: r.ok, status: r.status, json: (await r.json().catch(() => ({}))) as Record<string, unknown> & { id?: string; error?: { message?: string } } };
}

/** Codul NEAM-XXXX al organizației, pe același cupon ca NEAM90 (deci aceeași reducere). Dacă există deja, îl întoarce. */
export async function createOrgCode(db: Db, orgId: string, f: typeof fetch = fetch) {
  const [org] = await db.select({ cod: crmOrganizations.cod, tip: crmOrganizations.tip, nume: crmOrganizations.nume }).from(crmOrganizations).where(eq(crmOrganizations.id, orgId));
  if (!org) throw new Error("organizația nu există");
  if (org.cod) return org.cod;
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("lipsește STRIPE_SECRET_KEY");
  const base = await stripe(`promotion_codes?code=${BASE_CODE}&limit=1`, null, f, "GET");
  const coupon = ((base.json.data as { coupon?: { id?: string } }[] | undefined)?.[0]?.coupon?.id) ?? null;
  if (!coupon) throw new Error(`codul ${BASE_CODE} nu există în Stripe`);
  for (let i = 0; i < 5; i++) {
    const code = newOrgCode();
    const promo = await stripe("promotion_codes", { coupon, code, "metadata[sursa]": "crm", "metadata[crmOrg]": orgId }, f);
    if (!promo.ok || !promo.json.id) {
      if (/already exists|exist/i.test(promo.json.error?.message ?? "")) continue;
      throw new Error(`Stripe: ${promo.json.error?.message ?? promo.status}`);
    }
    await db.update(crmOrganizations).set({ cod: code, stripePromoId: promo.json.id, updatedAt: new Date() }).where(eq(crmOrganizations.id, orgId));
    return code;
  }
  throw new Error("nu am găsit un cod liber");
}

/* ---------- Conturile aduse și plățile lor ---------- */

/** Leagă conturile noi de organizații (după ?src= și după codul școlii). Prima legătură rămâne. */
export async function refreshOrgAccounts(db: Db, now = new Date()) {
  const orgs = await db.select({ id: crmOrganizations.id, tip: crmOrganizations.tip, slug: crmOrganizations.slug }).from(crmOrganizations).where(sql`${crmOrganizations.slug} is not null`);
  const bySrc = new Map<string, string>();
  for (const o of orgs) {
    const s = srcOf(o.tip, o.slug);
    if (s) bySrc.set(s, o.id);
  }
  let added = 0;
  if (bySrc.size) {
    const keys = sql.join([...bySrc.keys()].map((k) => sql`${k}`), sql`, `);
    const r = await rows<{ user_id: string; src: string; at: string }>(db, sql`
      select s.user_id, case when s.first_src in (${keys}) then s.first_src when s.source in (${keys}) then s.source else s.last_src end as src, u.created_at as at
      from account_source s join "user" u on u.id = s.user_id
      where (s.first_src in (${keys}) or s.source in (${keys}) or s.last_src in (${keys})) and ${realAccountSql("u")}
        and not exists (select 1 from crm_org_accounts a where a.user_id = s.user_id)`);
    for (const x of r) {
      const org = bySrc.get(x.src);
      if (!org) continue;
      const ins = await db.insert(crmOrgAccounts).values({ userId: x.user_id, organizationId: org, via: "src", at: new Date(x.at) }).onConflictDoNothing().returning();
      added += ins.length;
    }
  }
  const sc = await rows<{ user_id: string; org: string; at: string }>(db, sql`
    select ss.user_id, o.id as org, ss.created_at as at from school_signup ss join school_code c on c.id = ss.code_id
    join crm_organizations o on o.school_id = c.school_id join "user" u on u.id = ss.user_id
    where ${realAccountSql("u")} and not exists (select 1 from crm_org_accounts a where a.user_id = ss.user_id)`);
  for (const x of sc) {
    const ins = await db.insert(crmOrgAccounts).values({ userId: x.user_id, organizationId: x.org, via: "scoala", at: new Date(x.at) }).onConflictDoNothing().returning();
    added += ins.length;
  }
  // Plățile cu codul unei clase sau codul NEAM-XXXX, chiar fără cont legat la înscriere.
  const paid = await rows<{ user_id: string; org: string; at: string }>(db, sql`
    select sp.user_id, o.id as org, sp.created_at as at from school_payment sp join school_code c on c.id = sp.code_id
    join crm_organizations o on o.school_id = c.school_id join "user" u on u.id = sp.user_id
    where ${realAccountSql("u")} and not exists (select 1 from crm_org_accounts a where a.user_id = sp.user_id)`);
  for (const x of paid) {
    const ins = await db.insert(crmOrgAccounts).values({ userId: x.user_id, organizationId: x.org, via: "scoala", at: new Date(x.at) }).onConflictDoNothing().returning();
    added += ins.length;
  }
  const money = await syncOrgMoney(db, now);
  return { added, ...money };
}

/** La înscriere (src/lib/auth.ts): contul nou se leagă imediat de organizația din linkul lui sau din codul școlii. Nu aruncă. */
export async function attributeNewAccount(db: Db, userId: string, now = new Date()) {
  try {
    const [s] = await db.select().from(accountSource).where(eq(accountSource.userId, userId));
    for (const src of [s?.firstSrc, s?.source, s?.lastSrc]) {
      const m = src?.match(/^[a-z]+-(.+)$/);
      if (!m) continue;
      const cands = await db.select({ id: crmOrganizations.id, tip: crmOrganizations.tip, slug: crmOrganizations.slug }).from(crmOrganizations).where(sql`${crmOrganizations.slug} = ${m[1]} or ${crmOrganizations.slug} like ${`${m[1].slice(0, 30)}%`}`).limit(20);
      const org = cands.find((o) => srcOf(o.tip, o.slug) === src);
      if (org) {
        await db.insert(crmOrgAccounts).values({ userId, organizationId: org.id, via: "src", at: now }).onConflictDoNothing();
        break;
      }
    }
    const [sc] = await rows<{ org: string }>(db, sql`select o.id as org from school_signup ss join school_code c on c.id = ss.code_id
      join crm_organizations o on o.school_id = c.school_id where ss.user_id = ${userId} limit 1`);
    if (sc) await db.insert(crmOrgAccounts).values({ userId, organizationId: sc.org, via: "scoala", at: now }).onConflictDoNothing();
    await syncOrgMoney(db, now);
  } catch (e) {
    console.error("crm: contul nou", e);
  }
}

/** Pe istoricul organizației: contul nou adus și fiecare plată a conturilor aduse (o singură dată). Prima plată → „client”. */
export async function syncOrgMoney(db: Db, now = new Date()) {
  const accounts = await rows<{ user_id: string; org: string; via: string; at: string }>(db, sql`
    select a.user_id, a.organization_id as org, a.via, a.at from crm_org_accounts a
    where not exists (select 1 from crm_activities x where x.external_id = 'cont:' || a.user_id)`);
  for (const a of accounts) {
    await addActivity(db, { tip: "cont_creat", canal: "site", rezumat: `Cont nou adus (${VIA_LABEL[a.via] ?? a.via})`, at: new Date(a.at), organizationId: a.org, userId: a.user_id, externalId: `cont:${a.user_id}` });
  }
  const pays = await rows<{ id: string; org: string; user_id: string; amount: unknown; currency: string; kind: string; at: string }>(db, sql`
    select p.id, a.organization_id as org, p.user_id, p.amount, p.currency, p.kind, p.created_at as at
    from payment p join crm_org_accounts a on a.user_id = p.user_id join "user" u on u.id = p.user_id
    where p.amount > 0 and ${realAccountSql("u")} and not exists (select 1 from crm_activities x where x.external_id = 'plata:' || p.id)
    order by p.created_at`);
  let payments = 0;
  for (const p of pays) {
    const amount = n(p.amount) / 100;
    if (await addActivity(db, { tip: "plata", canal: "site", rezumat: `Plată ${p.kind}: ${amount.toLocaleString("ro-RO")} ${p.currency === "ron" ? "lei" : p.currency.toUpperCase()}`, at: new Date(p.at), organizationId: p.org, userId: p.user_id,
      externalId: `plata:${p.id}`, meta: { amount: n(p.amount), currency: p.currency, kind: p.kind } })) {
      payments++;
      await setOrgStatus(db, p.org, "client", { now });
    }
  }
  return { accounts: accounts.length, payments };
}

export const VIA_LABEL: Record<string, string> = { src: "linkul organizației", cod: "codul organizației", scoala: "codul școlii", manual: "legat de mână" };

/** După o plată (webhook Stripe): dacă s-a folosit codul NEAM-XXXX al unei organizații, contul se leagă de ea; apoi istoricul. */
export async function afterCrmPayment(db: Db, p: { userId: string; promo?: string | null; offer?: string | null }, now = new Date()) {
  if (p.userId && (p.promo || p.offer)) {
    const [org] = await db.select({ id: crmOrganizations.id }).from(crmOrganizations)
      .where(p.promo ? sql`${crmOrganizations.stripePromoId} = ${p.promo} or ${crmOrganizations.cod} = ${p.offer ?? ""}` : sql`${crmOrganizations.cod} = ${p.offer ?? ""}`).limit(1);
    if (org) await db.insert(crmOrgAccounts).values({ userId: p.userId, organizationId: org.id, via: "cod", at: now }).onConflictDoNothing();
  }
  return syncOrgMoney(db, now);
}

/* ---------- Cifrele ---------- */

export type OrgMoney = { accounts: number; paidAccounts: number; ron: number; eur: number; firstPaid: string | null };

/** Pe organizație: conturi aduse (reale), câte au plătit, venitul total (lei și euro, din plățile lor). */
export async function moneyByOrg(db: Db, orgId?: string): Promise<Map<string, OrgMoney>> {
  const r = await rows<Row>(db, sql`
    select a.organization_id as org, count(distinct a.user_id) as accounts,
      count(distinct p.user_id) filter (where p.amount > 0) as paid_accounts,
      coalesce(sum(p.amount) filter (where p.currency = 'ron'), 0) as ron, coalesce(sum(p.amount) filter (where p.currency = 'eur'), 0) as eur,
      min(p.created_at) filter (where p.amount > 0) as first_paid
    from crm_org_accounts a join "user" u on u.id = a.user_id left join payment p on p.user_id = a.user_id
    where ${realAccountSql("u")} ${orgId ? sql`and a.organization_id = ${orgId}` : sql``}
    group by a.organization_id`);
  return new Map(r.map((x) => [String(x.org), { accounts: n(x.accounts), paidAccounts: n(x.paid_accounts), ron: n(x.ron) / 100, eur: n(x.eur) / 100, firstPaid: x.first_paid ? new Date(String(x.first_paid)).toISOString() : null }]));
}

export async function orgAccountsList(db: Db, orgId: string) {
  return rows<{ user_id: string; name: string; via: string; at: string; paid: unknown }>(db, sql`
    select a.user_id, u.name, a.via, a.at, (select coalesce(sum(p.amount), 0) from payment p where p.user_id = a.user_id) as paid
    from crm_org_accounts a join "user" u on u.id = a.user_id where a.organization_id = ${orgId} and ${realAccountSql("u")} order by a.at desc limit 100`);
}

/** Legarea de mână a unei școli din Admin → Școli de organizație (pentru codurile pe clasă). */
export async function linkSchool(db: Db, orgId: string, schoolId: string | null) {
  await db.update(crmOrganizations).set({ schoolId, updatedAt: new Date() }).where(eq(crmOrganizations.id, orgId));
}

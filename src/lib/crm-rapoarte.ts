/**
 * CRM Etapa 9 (Daniel, 18.11.2026): rapoarte.
 * - Pâlnia: contactat → a răspuns → interesat → client, pe organizații, cu filtre (tip, județ, localitate, luna primului contact,
 *   campanie). „Contactat” = primul email trimis (din campanie, import sau ingestie); răspunsurile automate nu contează.
 * - Rezultatele pe șablon: trimise, livrate, deschise, click, răspunsuri, pozitive, clienți, nelivrate, dezabonări și ratele lor,
 *   ca să păstrăm textul care merge.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { COUNTIES } from "./place-key";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
export const rate = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export type FunnelFilter = { tip?: string | null; judet?: string | null; localitate?: string | null; luna?: string | null; campanie?: string | null };
export type Funnel = { contactat: number; raspuns: number; interesat: number; client: number; rates: { raspuns: number; interesat: number; client: number; total: number } };

export async function funnel(db: Db, f: FunnelFilter = {}): Promise<Funnel> {
  const month = f.luna && /^\d{4}-\d{2}$/.test(f.luna) ? f.luna : null;
  const camp = f.campanie && /^[0-9a-f-]{36}$/i.test(f.campanie) ? f.campanie : null;
  const contact = camp
    ? sql`(select min(s.sent_at) from crm_sends s where s.organization_id = o.id and s.campaign_id = ${camp} and s.status not in ('blocat','eroare'))`
    : sql`(select min(a.at) from crm_activities a where a.organization_id = o.id and a.tip = 'email_trimis')`;
  const [r] = await rows<Row>(db, sql`
    with base as (
      select o.id, o.status, ${contact} as contact_at from crm_organizations o
      where true
        ${f.tip ? sql`and o.tip = ${f.tip}` : sql``}
        ${f.judet ? sql`and lower(o.judet) in (lower(${f.judet}), lower(${COUNTIES[f.judet] ?? f.judet}))` : sql``}
        ${f.localitate ? sql`and lower(o.localitate) = lower(${f.localitate})` : sql``}
    ), c as (
      select b.*,
        exists (select 1 from crm_activities a where a.organization_id = b.id and a.tip = 'raspuns' and a.at >= b.contact_at and coalesce(a.meta->>'clasificare','') <> 'automat') as raspuns,
        (b.status in ('interesat','in_discutie','client','partener') or exists (select 1 from crm_activities a where a.organization_id = b.id and a.tip = 'raspuns' and a.at >= b.contact_at and a.meta->>'clasificare' = 'interesat')) as interesat,
        (b.status = 'client' or exists (select 1 from crm_activities a where a.organization_id = b.id and a.tip = 'plata' and a.at >= b.contact_at)) as client
      from base b where b.contact_at is not null ${month ? sql`and to_char(b.contact_at at time zone 'UTC' at time zone 'Europe/Bucharest', 'YYYY-MM') = ${month}` : sql``}
    )
    select count(*) as contactat, count(*) filter (where raspuns) as raspuns, count(*) filter (where interesat) as interesat, count(*) filter (where client) as client from c`);
  const x = { contactat: n(r?.contactat), raspuns: n(r?.raspuns), interesat: n(r?.interesat), client: n(r?.client) };
  return { ...x, rates: { raspuns: rate(x.raspuns, x.contactat), interesat: rate(x.interesat, x.raspuns), client: rate(x.client, x.interesat), total: rate(x.client, x.contactat) } };
}

export type TemplateStats = { id: string; nume: string; trimise: number; livrate: number; deschise: number; click: number; raspunsuri: number; pozitive: number; clienti: number; nelivrate: number; dezabonari: number;
  rataRaspuns: number; rataPozitiv: number; rataClient: number; rataDeschidere: number };

/** Pe șablon (și follow-up-urile lui): ce s-a întâmplat după emailurile trimise cu el. */
export async function templateStats(db: Db): Promise<TemplateStats[]> {
  const r = await rows<Row>(db, sql`
    select t.id, t.nume,
      count(s.id) filter (where s.status not in ('blocat','eroare')) as trimise,
      count(s.id) filter (where s.delivered_at is not null) as livrate,
      count(s.id) filter (where s.opened_at is not null) as deschise,
      count(s.id) filter (where s.clicked_at is not null) as click,
      count(s.id) filter (where s.replied_at is not null or exists (select 1 from crm_activities a where a.organization_id = s.organization_id and a.tip = 'raspuns' and a.at >= s.sent_at and coalesce(a.meta->>'clasificare','') <> 'automat')) as raspunsuri,
      count(s.id) filter (where exists (select 1 from crm_activities a where a.organization_id = s.organization_id and a.tip = 'raspuns' and a.at >= s.sent_at and a.meta->>'clasificare' = 'interesat')) as pozitive,
      count(s.id) filter (where exists (select 1 from crm_activities a where a.organization_id = s.organization_id and a.tip = 'plata' and a.at >= s.sent_at)) as clienti,
      count(s.id) filter (where s.bounced_at is not null) as nelivrate,
      count(s.id) filter (where s.unsubscribed_at is not null) as dezabonari
    from crm_templates t left join crm_sends s on s.template_id = t.id
    group by t.id, t.nume order by count(s.id) desc, t.nume`);
  return r.map((x) => {
    const s = { id: String(x.id), nume: String(x.nume), trimise: n(x.trimise), livrate: n(x.livrate), deschise: n(x.deschise), click: n(x.click), raspunsuri: n(x.raspunsuri), pozitive: n(x.pozitive), clienti: n(x.clienti), nelivrate: n(x.nelivrate), dezabonari: n(x.dezabonari) };
    return { ...s, rataRaspuns: rate(s.raspunsuri, s.trimise), rataPozitiv: rate(s.pozitive, s.trimise), rataClient: rate(s.clienti, s.trimise), rataDeschidere: rate(s.deschise, s.livrate || s.trimise) };
  });
}

/** Lunile în care s-a trimis ceva (pentru filtrul „luna”). */
export async function contactMonths(db: Db) {
  const r = await rows<{ m: string }>(db, sql`select distinct to_char(at at time zone 'UTC' at time zone 'Europe/Bucharest', 'YYYY-MM') as m from crm_activities where tip = 'email_trimis' order by m desc limit 24`);
  return r.map((x) => x.m);
}

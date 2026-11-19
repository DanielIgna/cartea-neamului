/**
 * Cifrele pentru analiza de luni (Daniel, 19.11.2026): vizitele, conturile și plățile reale ale ultimelor zile, puse lângă
 * perioada dinainte, plus Search Console dacă e legat. Le citește asistentul care scrie raportul săptămânal, prin
 * /api/raport/saptamanal cu `Authorization: Bearer <RAPORT_TOKEN>`. Doar cifre adunate: niciun nume, email sau adresă de arbore.
 *
 * Ce nu se numără, ca cifrele să arate clienții adevărați:
 * - conturile de test (src/lib/conturi-test.ts) și conturile cu „Acces gratuit” (planul `mereu`: Daniel, Cristina, familia);
 * - plățile de dinainte de REAL_PAYMENTS_SINCE: cele 3 plăți de până pe 19.11.2026 au fost teste Stripe făcute de Daniel.
 */
import { sql } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import type { Db } from "@/db";
import { realAccountSql, realUserIdSql } from "./conturi-test";
import { groupBy, sessionsOf, summary, uniqueVisitors, type Range } from "./analiza";
import { localDayHour } from "./vizite";
import { gscSnapshot, seoSettings } from "./seo";
import { SITE_URL } from "./site-url";

/** Prima zi din care plățile sunt ale clienților (ora României). */
export const REAL_PAYMENTS_SINCE = "2026-11-20";

const DAY = 86_400_000;
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const num = (v: unknown) => Number(v ?? 0) || 0;
const localDay = (col: string) => sql.raw(`((${col}) at time zone 'UTC' at time zone 'Europe/Bucharest')::date`);
const notFree = (col: string) => sql`not exists (select 1 from account_plan ap where ap.user_id = ${sql.raw(col)} and ap.plan = 'mereu')`;

/** Tokenul din `Authorization: Bearer …` (RAPORT_TOKEN în Vercel, cel puțin 24 de semne). Fără token pus, adresa e închisă. */
export function reportAuthorized(header: string | null, token = process.env.RAPORT_TOKEN?.trim()): boolean {
  if (!token || token.length < 24 || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7).trim()), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Perioada curentă (ultimele `days` zile încheiate, fără azi) și cea dinainte, de aceeași lungime. */
export function reportRanges(days: number, today = localDayHour().day): { cur: Range; prev: Range } {
  const to = addDays(today, -1), from = addDays(to, -(days - 1));
  return { cur: { from, to, days }, prev: { from: addDays(from, -days), to: addDays(from, -1), days } };
}

async function rows(db: Db, q: ReturnType<typeof sql>) {
  const r = await db.execute(q);
  return (r.rows ?? []) as Record<string, unknown>[];
}

/** Conturile reale noi, arborii lor și câte au plătit (oricând după, de la REAL_PAYMENTS_SINCE). */
async function accounts(db: Db, r: Range) {
  const [x] = await rows(db, sql`with u as (select uu.id from "user" uu where ${realAccountSql("uu")} and ${notFree("uu.id")}
      and ${localDay("uu.created_at")} between ${r.from} and ${r.to})
    select count(*) as accounts,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id)) as trees,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id and (select count(*) from person p where p.tree_id = t.id) >= 5)) as grown,
      count(*) filter (where exists (select 1 from payment p where p.user_id = u.id and ${localDay("p.created_at")} >= ${REAL_PAYMENTS_SINCE})) as paid
    from u`);
  const perDay = await rows(db, sql`select ${localDay("uu.created_at")}::text as day, count(*) as c from "user" uu
    where ${realAccountSql("uu")} and ${notFree("uu.id")} and ${localDay("uu.created_at")} between ${r.from} and ${r.to} group by 1 order by 1`);
  return {
    new: num(x?.accounts), startedTree: num(x?.trees), treeWith5People: num(x?.grown), paidSoFar: num(x?.paid),
    perDay: perDay.map((d) => ({ day: String(d.day).slice(0, 10), accounts: num(d.c) })),
  };
}

/** Plățile reale din interval, pe fel (an / carte / păstrare…), plan și monedă. */
async function payments(db: Db, r: Range) {
  const from = r.from < REAL_PAYMENTS_SINCE ? REAL_PAYMENTS_SINCE : r.from;
  const list = from > r.to ? [] : await rows(db, sql`select p.kind, coalesce(ap.tier, '') as tier, p.currency, count(*) as c, sum(p.amount) as s
    from payment p left join account_plan ap on ap.user_id = p.user_id
    where ${localDay("p.created_at")} between ${from} and ${r.to}
      and (p.user_id is null or (${realUserIdSql("p.user_id")} and ${notFree("p.user_id")}))
    group by 1, 2, 3 order by 4 desc`);
  const [ex] = await rows(db, sql`select count(*) as c from payment p where ${localDay("p.created_at")} between ${r.from} and ${r.to}`);
  const count = list.reduce((a, x) => a + num(x.c), 0);
  return {
    count,
    lei: list.filter((x) => x.currency === "ron").reduce((a, x) => a + num(x.s) / 100, 0),
    eur: list.filter((x) => x.currency === "eur").reduce((a, x) => a + num(x.s) / 100, 0),
    byKind: list.map((x) => ({ kind: String(x.kind), tier: String(x.tier) || null, currency: String(x.currency), count: num(x.c), amount: num(x.s) / 100 })),
    excluded: num(ex?.c) - count,
  };
}

/** Vizitele: pe zile, pe surse (google, facebook, email…) și pe campanii (utm_campaign), cu câți au ajuns la cont. */
async function visits(db: Db, r: Range) {
  const s = await sessionsOf(db, r);
  const u = await uniqueVisitors(db, r);
  const byDay = new Map<string, number>();
  for (const x of s) byDay.set(x.day, (byDay.get(x.day) ?? 0) + 1);
  const pick = (g: ReturnType<typeof groupBy>) => g.slice(0, 15).map((x) => ({ key: x.key, sessions: x.count, bounceRate: x.bounceRate, signup: x.signup, tree: x.tree, pay: x.pay }));
  const top = await rows(db, sql`select path, count(*) as v from page_view where day between ${r.from} and ${r.to} and path not like '/admin%' group by path order by v desc limit 20`);
  return {
    visitors: u.visitors, views: u.views, ...summary(s),
    signupSessions: s.filter((x) => x.signup).length,
    perDay: Array.from({ length: r.days }, (_, i) => addDays(r.from, i)).map((d) => ({ day: d, sessions: byDay.get(d) ?? 0 })),
    bySource: pick(groupBy(s, (x) => x.source)),
    byCampaign: pick(groupBy(s, (x) => x.campaign)),
    topPages: top.map((x) => ({ path: String(x.path), views: num(x.v) })),
  };
}

/** Search Console (dacă e legat): clicuri, afișări, locul mediu, cuvintele și paginile de top. */
async function searchConsole(db: Db, days: number) {
  const snap = await gscSnapshot(await seoSettings(db), SITE_URL, days);
  if (snap.state !== "legat") return { state: snap.state, error: snap.error };
  const t = (x: { clicks: number; impressions: number; position: number } | null) => x && { clicks: x.clicks, impressions: x.impressions, position: Math.round(x.position * 10) / 10 };
  return {
    state: snap.state,
    totals: { cur: t(snap.totals.cur), prev: t(snap.totals.prev) },
    topQueries: [...snap.queries].sort((a, b) => b.impressions - a.impressions).slice(0, 25)
      .map((q) => ({ query: q.query, clicks: q.clicks, impressions: q.impressions, position: Math.round(q.position * 10) / 10 })),
    topPages: [...snap.pages].sort((a, b) => b.impressions - a.impressions).slice(0, 25)
      .map((p) => ({ page: p.keys[0], clicks: p.clicks, impressions: p.impressions, position: Math.round(p.position * 10) / 10 })),
    pagesWithImpressions: snap.pages.length,
  };
}

export async function weeklyReport(db: Db, days = 7, opts: { today?: string; gsc?: boolean } = {}) {
  const { cur, prev } = reportRanges(days, opts.today);
  const [vc, vp, ac, ap, pc, pp] = await Promise.all([
    visits(db, cur), visits(db, prev), accounts(db, cur), accounts(db, prev), payments(db, cur), payments(db, prev),
  ]);
  const gsc = opts.gsc === false ? null : await searchConsole(db, days).catch((e) => ({ state: "eroare" as const, error: String(e) }));
  return {
    generatedAt: new Date().toISOString(), days, realPaymentsSince: REAL_PAYMENTS_SINCE,
    note: "Fără conturile de test, fără conturile cu „Acces gratuit” (familia) și fără plățile de test de dinainte de realPaymentsSince.",
    current: { range: cur, visits: vc, accounts: ac, payments: pc },
    previous: { range: prev, visits: vp, accounts: ap, payments: pp },
    searchConsole: gsc,
  };
}

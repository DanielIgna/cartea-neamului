import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { ENV_KEYS, envSet } from "./admin";
import { ERRORS_SEEN_KEY } from "./admin-stats";
import { securityOverview } from "./admin-securitate";
import { emailReady } from "./email";
import { planSettings } from "./plans";
import { stripeReady } from "./plati";
import { activeServiceAccount, seoSettings } from "./seo";
import journal from "../../drizzle/meta/_journal.json";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;

/** Semnele de lângă meniul din Admin: ce așteaptă o privire (probleme noi, poze propuse, cereri ADN, erori pe server în 24 h). */
export type AdminBadges = { probleme: number; propuneri: number; adn: number; infra: number };

/** Numărul erorilor pe server de după ultima marcare „rezolvate”, din ultimele 24 h și 7 zile. */
async function errorCounts(db: Db) {
  const [r] = await rows(db, sql`with seen as (select coalesce((select (value->>'at')::timestamptz from app_setting where key = ${ERRORS_SEEN_KEY}), 'epoch'::timestamptz) as at)
    select count(*) filter (where created_at > now() - interval '1 day') as d1, count(*) filter (where created_at > now() - interval '7 days') as d7,
      max(created_at) as last
    from audit_log, seen where entity = 'eroare' and created_at > seen.at`);
  return { d1: n(r?.d1), d7: n(r?.d7), last: r?.last ? new Date(r.last as string).toISOString() : null };
}

/** Totul într-o singură întrebare la baza de date, ca meniul să nu încetinească paginile. */
export async function adminBadges(db: Db): Promise<AdminBadges> {
  const [r] = await rows(db, sql`with seen as (select coalesce((select (value->>'at')::timestamptz from app_setting where key = ${ERRORS_SEEN_KEY}), 'epoch'::timestamptz) as at)
    select (select count(*) from problem_report where status = 'nou') as probleme,
      (select count(*) from home_submission where status = 'pending') as propuneri,
      (select count(*) from dna_request where resolved_at is null) as adn,
      (select count(*) from audit_log, seen where entity = 'eroare' and created_at > seen.at and created_at > now() - interval '1 day') as infra`);
  return { probleme: n(r?.probleme), propuneri: n(r?.propuneri), adn: n(r?.adn), infra: n(r?.infra) };
}

export type Check = { label: string; ok: boolean; note: string };

/**
 * Rezumatul de pe prima pagină a panoului: erori, probleme raportate, plăți, securitate, SEO și verificările de bază
 * (baza de date, migrații, chei). Doar citiri, din ce se strânge deja în site; Google nu e întrebat aici, ca pagina să vină repede.
 */
export async function adminBriefing(db: Db) {
  const t0 = Date.now();
  await db.execute(sql`select 1`);
  const pingMs = Date.now() - t0;
  const [badges, errors, sec, seo, plans, payRows, lastPay, mig] = await Promise.all([
    adminBadges(db),
    errorCounts(db),
    securityOverview(db).catch(() => null),
    seoSettings(db).catch(() => null),
    planSettings(db),
    rows(db, sql`select currency, count(*) as c, coalesce(sum(amount), 0) as amount from payment where created_at > now() - interval '7 days' group by currency`).catch(() => []),
    rows(db, sql`select max(created_at) as at, count(*) as total from payment`).catch(() => []),
    rows(db, sql`select count(*) as c from drizzle.__drizzle_migrations`).catch(() => null),
  ]);
  const pay7 = { count: 0, lei: 0, eur: 0 };
  for (const p of payRows) {
    pay7.count += n(p.c);
    if (String(p.currency).toLowerCase() === "eur") pay7.eur += n(p.amount) / 100; else pay7.lei += n(p.amount) / 100;
  }
  const missing = ENV_KEYS.filter((k) => k.needed && !envSet(k.key)).map((k) => k.key);
  const applied = mig ? n(mig[0]?.c) : null;
  const expected = journal.entries.length;
  const gsc = seo ? activeServiceAccount(seo) : null;
  const checks: Check[] = [
    { label: "Baza de date", ok: pingMs < 1500, note: `răspunde în ${pingMs} ms` },
    { label: "Migrații", ok: applied == null || applied >= expected, note: applied == null ? "nu s-au putut citi" : `${applied}/${expected}` },
    { label: "Chei obligatorii", ok: missing.length === 0, note: missing.length ? `lipsesc: ${missing.join(", ")}` : "toate puse" },
    { label: "Plăți (Stripe)", ok: stripeReady() && !!process.env.STRIPE_WEBHOOK_SECRET?.trim(), note: stripeReady() ? (process.env.STRIPE_WEBHOOK_SECRET?.trim() ? "chei puse" : "lipsește cheia webhook") : "cheile nu sunt puse" },
    { label: "Emailuri (Resend)", ok: emailReady(), note: emailReady() ? "pornite" : "lipsește RESEND_API_KEY" },
    { label: "Search Console", ok: !!gsc, note: gsc ? (gsc.source === "panou" ? "legat din panou" : "legat din Vercel") : "nelegat" },
  ];
  return {
    badges, errors, pay7,
    payments: { total: n(lastPay[0]?.total), lastAt: lastPay[0]?.at ? new Date(lastPay[0].at as string).toISOString() : null, salesOn: plans.on },
    security: sec ? { alerts: sec.alerts, bad: sec.alerts.filter((a) => a.level === "bad").length, day: sec.day } : null,
    seo: { linked: !!gsc, verification: !!(seo?.verification || process.env.GOOGLE_SITE_VERIFICATION?.trim()), watch: seo?.watch.length ?? 0 },
    checks,
    env: { name: process.env.VERCEL_ENV ?? "local", sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
  };
}

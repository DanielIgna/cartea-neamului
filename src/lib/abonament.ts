/**
 * Abonamentele cu reînnoire automată (Daniel, 25.11.2026). Planul (Basic, Familie, Premium) se plătește lunar, trimestrial sau
 * anual prin Stripe și se reînnoiește singur până omul apasă „Oprește reînnoirea” pe /plata. Accesul se socotește tot din
 * `account_plan.paid_until` (src/lib/plans.ts), ca până acum: fiecare plată primită de la Stripe îl mută la capătul perioadei.
 *
 * Reguli:
 * - prima plată se face pe pagina Stripe (src/lib/plati.ts, `createCheckout` cu `sub`); reînnoirile vin ca facturi plătite
 *   („invoice.paid”), opririle și reluările ca „customer.subscription.updated/deleted”;
 * - reînnoirea de fidelitate: la anual, din al doilea an prețul e cel de reînnoire din Admin. După prima plată, abonamentul trece
 *   pe prețul de reînnoire și i se scoate reducerea (codurile, NEAM90 inclus, sunt doar pentru prima plată) — `fixSubscription`;
 * - cine are deja un an plătit o dată (dinainte de abonamente) poate porni reînnoirea „de la data de sfârșit”: Stripe ține cardul
 *   și nu ia nimic până atunci (perioadă de probă Stripe până la `paid_until`);
 * - emailul de dinainte: cu 7 zile înainte de fiecare plată anuală sau trimestrială (`sendRenewalReminders`, zilnic);
 * - oprirea: dintr-un clic. Dacă Stripe nu răspunde, oprirea se ține minte și se reîncearcă zilnic; omul nu mai e taxat oricum
 *   (reînnoirea se oprește la capătul perioadei plătite, iar accesul rămâne până atunci).
 *
 * Cheia STRIPE_SECRET_KEY trebuie să aibă drept de scriere pe Subscriptions (și pe Customer portal, pentru schimbarea cardului).
 */
import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, payment, user } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";
import { emailReady, sendEmail, siteInbox } from "./email";
import { footerFor, renderMail, formatPaid } from "./emailuri";
import { isPeriod, isTier, periodPrice, RENEW_GRACE_MS, type Period, type PlanSettings, type Tier } from "./plans";
import { convertEur, rateOf, type Currency, type PaidSession } from "./plati";
import { SITE_URL } from "./site-url";

const DAY = 86_400_000;
/** Cu câte zile înainte de plata anuală sau trimestrială scriem omului. */
export const REMIND_DAYS = 7;

type StripeJson = Record<string, unknown> & { id?: string; error?: { message?: string; code?: string } };
/** O cerere la Stripe, cu versiunea API fixă (răspunsurile au aceeași formă orice versiune ar avea contul). */
export async function stripeApi(path: string, method: "GET" | "POST" | "DELETE", params: Record<string, string> | null = null, fetcher: typeof fetch = fetch) {
  const r = await fetcher(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    ...(params ? { body: new URLSearchParams(params) } : {}),
  });
  return { ok: r.ok, status: r.status, json: (await r.json().catch(() => ({}))) as StripeJson };
}

/** Intervalul din Stripe pentru o perioadă. */
export const stripeInterval = (p: Period) => (p === "an" ? { interval: "year", count: 1 } : { interval: "month", count: p === "trimestru" ? 3 : 1 });

/** Suma (în unitatea mică) a unui preț din Admin, în moneda abonamentului: lei ca atare, celelalte socotite din euro. */
export function amountIn(cur: string, p: { lei: number; eur: number }, s: PlanSettings) {
  if (cur === "ron") return Math.round(p.lei * 100);
  return Math.round(convertEur(p.eur, rateOf(cur as Currency, s)) * 100);
}

/**
 * „Fidel”: a mai avut un an (plătit, dăruit, primul an din beta) sau plătește deja. Atunci anul se plătește la prețul de reînnoire.
 * Socotit din plățile „an” primite și din data contului față de pornirea plăților.
 */
export async function isLoyal(db: Pick<Db, "select">, userId: string, s: PlanSettings): Promise<boolean> {
  const [p] = await db.select({ id: payment.id }).from(payment).where(and(eq(payment.userId, userId), eq(payment.kind, "an"))).limit(1);
  if (p) return true;
  const [u] = await db.select({ createdAt: user.createdAt, paidUntil: accountPlan.paidUntil, plan: accountPlan.plan })
    .from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, userId));
  if (!u) return false;
  // Un an primit (card cadou, an dăruit, pus din Admin) sau contul din beta, făcut înainte de pornirea plăților.
  if (u.paidUntil) return true;
  return !!s.startedAt && s.betaDays > 0 && u.createdAt < new Date(s.startedAt);
}

export type SubRow = {
  stripeSub: string | null; stripeCustomer: string | null; period: Period | null; renews: boolean; amount: number | null; currency: string | null;
  paidUntil: Date | null; tier: Tier | null; cancelPending: boolean;
};
/** Abonamentul omului, cum îl știm din baza de date (fără cerere la Stripe). */
export async function subscriptionOf(db: Pick<Db, "select">, userId: string): Promise<SubRow | null> {
  const [r] = await db.select({
    stripeSub: accountPlan.stripeSub, stripeCustomer: accountPlan.stripeCustomer, period: accountPlan.subPeriod, renews: accountPlan.subRenews,
    amount: accountPlan.subAmount, currency: accountPlan.subCurrency, paidUntil: accountPlan.paidUntil, tier: accountPlan.tier, cancelPending: accountPlan.subCancelPending,
  }).from(accountPlan).where(eq(accountPlan.userId, userId));
  if (!r) return null;
  return { ...r, period: isPeriod(r.period) ? r.period : null, tier: isTier(r.tier) ? r.tier : null };
}
/** Data următoarei plăți: sfârșitul perioadei plătite (fără rezerva de o zi și jumătate). */
export const nextCharge = (paidUntil: Date) => new Date(paidUntil.getTime() - RENEW_GRACE_MS);

/**
 * Leagă abonamentul de cont, după pagina de plată încheiată: id-urile din Stripe, perioada, suma reînnoirii. La pornirea „de la
 * data de sfârșit”, abonamentul vechi (dacă era unul, de pildă la schimbarea perioadei) se oprește de tot: noul îl înlocuiește.
 */
export async function linkSubscription(db: Db, paid: PaidSession, now = new Date(), fetcher: typeof fetch = fetch) {
  if (!paid.sub || !paid.userId) return;
  const [cur] = await db.select({ stripeSub: accountPlan.stripeSub }).from(accountPlan).where(eq(accountPlan.userId, paid.userId));
  const old = cur?.stripeSub && cur.stripeSub !== paid.sub.id ? cur.stripeSub : null;
  const set = {
    stripeSub: paid.sub.id, stripeCustomer: paid.sub.customer, subPeriod: paid.sub.period, subRenews: true, subAmount: paid.sub.renewAmount,
    subCurrency: paid.currency || null, subCancelPending: false, subRemindedFor: null,
    // Prima plată făcută acum: abonamentul trece pe prețul de reînnoire și fără reducere (`fixSubscription`).
    subFixed: paid.sub.start !== "now", updatedAt: now,
  };
  await db.insert(accountPlan).values({ userId: paid.userId, plan: "gratuit", ...set }).onConflictDoUpdate({ target: accountPlan.userId, set });
  if (old) await stripeApi(`subscriptions/${old}`, "DELETE", null, fetcher).catch(() => null);
}

/**
 * După prima plată (sau după trecerea pe un plan mai mare): prețul reînnoirii pus pe abonament și reducerea scoasă, ca reînnoirea
 * să fie la prețul de reînnoire, fără cod. Fără proratare: plata de acum rămâne cum a fost. Întoarce true dacă e gata.
 */
export async function fixSubscription(db: Db, userId: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const [r] = await db.select({ sub: accountPlan.stripeSub, amount: accountPlan.subAmount, period: accountPlan.subPeriod, tier: accountPlan.tier, fixed: accountPlan.subFixed })
    .from(accountPlan).where(eq(accountPlan.userId, userId));
  if (!r?.sub || r.fixed) return true;
  const got = await stripeApi(`subscriptions/${r.sub}`, "GET", null, fetcher);
  if (!got.ok) return false;
  const s = got.json as { status?: string; discount?: unknown; items?: { data?: { id: string; price?: { unit_amount?: number; currency?: string; product?: string; recurring?: { interval?: string; interval_count?: number } } }[] } };
  if (s.status === "canceled" || s.status === "incomplete_expired") {
    await db.update(accountPlan).set({ subFixed: true }).where(eq(accountPlan.userId, userId));
    return true;
  }
  const item = s.items?.data?.[0];
  if (!item?.price?.product || !item.price.currency) return false;
  const params: Record<string, string> = { proration_behavior: "none" };
  if (isTier(r.tier)) params["metadata[tier]"] = r.tier;
  if (isPeriod(r.period)) params["metadata[period]"] = r.period;
  if (r.amount && r.amount !== item.price.unit_amount) {
    const iv = isPeriod(r.period) ? stripeInterval(r.period) : { interval: item.price.recurring?.interval ?? "year", count: item.price.recurring?.interval_count ?? 1 };
    Object.assign(params, {
      "items[0][id]": item.id, "items[0][price_data][currency]": item.price.currency, "items[0][price_data][product]": item.price.product,
      "items[0][price_data][unit_amount]": String(r.amount), "items[0][price_data][recurring][interval]": iv.interval,
      "items[0][price_data][recurring][interval_count]": String(iv.count),
    });
  }
  const up = await stripeApi(`subscriptions/${r.sub}`, "POST", params, fetcher);
  if (!up.ok) return false;
  // Codul de reducere (NEAM90, școala, oferta de după zilele gratuite) e doar pentru prima plată.
  if (s.discount) {
    const del = await stripeApi(`subscriptions/${r.sub}/discount`, "DELETE", null, fetcher);
    if (!del.ok && del.status !== 404) return false;
  }
  await db.update(accountPlan).set({ subFixed: true }).where(eq(accountPlan.userId, userId));
  return true;
}

/**
 * După trecerea pe un plan mai mare (plătită ca diferență pe zilele rămase): abonamentul, dacă e, se reînnoiește de acum pe planul
 * nou, cu aceeași perioadă. Prețul nou se pune pe abonament la următoarea `fixSubscription`.
 */
export async function subAfterUpgrade(db: Db, userId: string, tier: Tier, s: PlanSettings, fetcher: typeof fetch = fetch) {
  const sub = await subscriptionOf(db, userId);
  if (!sub?.stripeSub || !sub.period || !sub.currency) return;
  const p = periodPrice(tier, sub.period, true, s, true);
  if (!p) return;
  await db.update(accountPlan).set({ subAmount: amountIn(sub.currency, p, s), subFixed: false }).where(eq(accountPlan.userId, userId));
  await fixSubscription(db, userId, fetcher);
}

/** Oprește reînnoirea dintr-un clic: accesul rămâne până la capătul perioadei plătite, fără altă plată. */
export async function stopRenewal(db: Db, userId: string, fetcher: typeof fetch = fetch): Promise<"oprit" | "amanat" | "nimic"> {
  const sub = await subscriptionOf(db, userId);
  if (!sub?.stripeSub) return "nimic";
  // Întâi la noi: din clipa asta nu mai trimitem emailuri de reînnoire și pagina arată reînnoirea oprită.
  await db.update(accountPlan).set({ subRenews: false, subCancelPending: true, updatedAt: new Date() }).where(eq(accountPlan.userId, userId));
  const r = await stripeApi(`subscriptions/${sub.stripeSub}`, "POST", { cancel_at_period_end: "true" }, fetcher).catch(() => null);
  if (r?.ok || r?.status === 404) {
    await db.update(accountPlan).set({ subCancelPending: false }).where(eq(accountPlan.userId, userId));
    return "oprit";
  }
  return "amanat";
}

/** Pornește din nou reînnoirea oprită (cât abonamentul încă există la Stripe). */
export async function resumeRenewal(db: Db, userId: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const sub = await subscriptionOf(db, userId);
  if (!sub?.stripeSub || !sub.paidUntil || sub.paidUntil <= new Date()) return false;
  const r = await stripeApi(`subscriptions/${sub.stripeSub}`, "POST", { cancel_at_period_end: "false" }, fetcher).catch(() => null);
  if (!r?.ok) return false;
  await db.update(accountPlan).set({ subRenews: true, subCancelPending: false, updatedAt: new Date() }).where(eq(accountPlan.userId, userId));
  return true;
}

/** Pagina Stripe pentru schimbarea cardului și facturi (Customer portal); `null` dacă nu se poate deschide. */
export async function cardPortal(customer: string, returnUrl: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  const r = await stripeApi("billing_portal/sessions", "POST", { customer, return_url: returnUrl }, fetcher).catch(() => null);
  const url = r?.ok ? (r.json.url as string | undefined) : undefined;
  return url ?? null;
}

/* ---------- Evenimentele Stripe pentru abonamente (src/app/api/plata/stripe/route.ts) ---------- */

type Inv = {
  id?: string; billing_reason?: string; amount_paid?: number; currency?: string; subscription?: string | null; customer?: string | null;
  subscription_details?: { metadata?: Record<string, string> } | null;
  parent?: { subscription_details?: { subscription?: string; metadata?: Record<string, string> } | null } | null;
  lines?: { data?: { period?: { end?: number } }[] };
};

/**
 * O reînnoire plătită („invoice.paid” cu motivul „subscription_cycle”): plata se trece o singură dată (cheia e factura) și anul,
 * trimestrul sau luna se adaugă până la capătul perioadei facturate. Întoarce plata, ca să plece confirmarea pe email.
 */
export async function renewalPaid(db: Db, event: unknown, now = new Date()): Promise<PaidSession | null> {
  const e = event as { type?: string; data?: { object?: Inv } };
  if (e?.type !== "invoice.paid") return null;
  const inv = e.data?.object;
  if (!inv?.id || inv.billing_reason !== "subscription_cycle") return null;
  const subId = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
  const md = inv.subscription_details?.metadata ?? inv.parent?.subscription_details?.metadata ?? {};
  if (!subId) return null;
  const [row] = await db.select({ userId: accountPlan.userId, tier: accountPlan.tier, paidUntil: accountPlan.paidUntil, period: accountPlan.subPeriod })
    .from(accountPlan).where(eq(accountPlan.stripeSub, subId));
  const userId = row?.userId ?? md.userId;
  if (!userId) return null;
  const ends = (inv.lines?.data ?? []).map((l) => l.period?.end ?? 0).filter((x) => x > 0);
  const end = ends.length ? new Date(Math.max(...ends) * 1000 + RENEW_GRACE_MS) : null;
  const tier: Tier = isTier(row?.tier) ? row.tier : isTier(md.tier) ? md.tier : "basic";
  return db.transaction(async (tx) => {
    const inserted = await tx.insert(payment).values({ id: inv.id!, userId, kind: "an", amount: Number(inv.amount_paid ?? 0), currency: String(inv.currency ?? ""), promo: "", createdAt: now })
      .onConflictDoNothing().returning({ id: payment.id });
    if (!inserted.length) return null;
    const [cur] = await tx.select({ paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, userId));
    const base = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : now;
    const period: Period = isPeriod(row?.period) ? row.period : isPeriod(md.period) ? md.period : "an";
    const fallback = new Date(base);
    fallback.setUTCMonth(fallback.getUTCMonth() + (period === "an" ? 12 : period === "trimestru" ? 3 : 1));
    const until = end && end > base ? end : end ?? fallback;
    await tx.insert(accountPlan).values({ userId, plan: "familie", paidUntil: until, tier, stripeSub: subId, updatedAt: now })
      .onConflictDoUpdate({ target: accountPlan.userId, set: { paidUntil: until, tier, stripeSub: subId, updatedAt: now,
        plan: sql`case when ${accountPlan.plan} = 'mereu' then 'mereu' else 'familie' end` } });
    return { id: inv.id!, kind: "an" as const, userId, treeId: null, amount: Number(inv.amount_paid ?? 0), currency: String(inv.currency ?? ""), tier };
  });
}

/** Abonamentul schimbat sau încheiat la Stripe (oprit din portal, plata eșuată de mai multe ori, șters): ținem pasul. */
export async function subscriptionChanged(db: Db, event: unknown): Promise<boolean> {
  const e = event as { type?: string; data?: { object?: { id?: string; status?: string; cancel_at_period_end?: boolean; cancel_at?: number | null } } };
  if (e?.type !== "customer.subscription.updated" && e?.type !== "customer.subscription.deleted") return false;
  const o = e.data?.object;
  if (!o?.id) return true;
  const ended = e.type === "customer.subscription.deleted" || ["canceled", "incomplete_expired", "unpaid"].includes(o.status ?? "");
  if (ended) {
    await db.update(accountPlan).set({ stripeSub: null, subRenews: false, subCancelPending: false, updatedAt: new Date() }).where(eq(accountPlan.stripeSub, o.id));
  } else {
    const renews = !o.cancel_at_period_end && !o.cancel_at;
    // O oprire cerută de om, încă neajunsă la Stripe, nu se pierde dacă vine între timp o schimbare de la Stripe.
    await db.update(accountPlan).set({ subRenews: sql`${renews} and not ${accountPlan.subCancelPending}`, updatedAt: new Date() }).where(eq(accountPlan.stripeSub, o.id));
  }
  return true;
}

/* ---------- Zilnic (src/app/api/cron/abonamente) ---------- */

/** Cei cu reînnoirea anuală sau trimestrială în următoarele 7 zile, fără emailul trimis încă pentru plata asta. */
export async function dueRenewalReminders(db: Pick<Db, "select">, now = new Date()) {
  const until = new Date(now.getTime() + REMIND_DAYS * DAY + RENEW_GRACE_MS);
  return db.select({ userId: user.id, name: user.name, email: user.email, locale: user.locale, paidUntil: accountPlan.paidUntil, tier: accountPlan.tier,
    period: accountPlan.subPeriod, amount: accountPlan.subAmount, currency: accountPlan.subCurrency })
    .from(accountPlan).innerJoin(user, eq(user.id, accountPlan.userId))
    .where(and(eq(accountPlan.subRenews, true), isNotNull(accountPlan.stripeSub), sql`${accountPlan.subPeriod} in ('an', 'trimestru')`,
      sql`${accountPlan.paidUntil} > ${now}`, sql`${accountPlan.paidUntil} <= ${until}`,
      sql`(${accountPlan.subRemindedFor} is null or ${accountPlan.subRemindedFor} <> ${accountPlan.paidUntil})`));
}

/** Emailul cu 7 zile înainte de plata anuală sau trimestrială: data, suma și legătura spre oprire. */
export async function sendRenewalReminders(db: Db, now = new Date()) {
  if (!emailReady()) return { due: 0, sent: 0 };
  const due = await dueRenewalReminders(db, now);
  let sent = 0;
  for (const r of due) {
    if (!r.email || !r.paidUntil) continue;
    const l: Locale = isLocale(r.locale) ? r.locale : "ro";
    const [t, tp, app] = await Promise.all([getT("Sub", l), getT("Plata", l), getAppName(l)]);
    const date = new Intl.DateTimeFormat(l, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(nextCharge(r.paidUntil));
    const plan = tp(`tiers.${isTier(r.tier) ? r.tier : "basic"}.name` as "tiers.basic.name");
    const amount = r.amount && r.currency ? formatPaid(r.amount, r.currency, l) : "";
    const period = t(`periodsLow.${isPeriod(r.period) ? r.period : "an"}` as "periodsLow.an");
    const { html, text } = renderMail([
      { p: r.name ? t("mailHello", { name: r.name }) : t("mailHelloNoName") },
      { p: t("mailBody", { app, plan, period, date, amount }) },
      { p: t("mailStop") },
      { button: t("mailButton"), href: `${SITE_URL}/plata#abonament` },
      { p: t("mailThanks") },
    ], await footerFor(l));
    const res = await sendEmail({ to: r.email, subject: t("mailSubject", { app, date }), html, text, replyTo: siteInbox(), idempotencyKey: `reinnoire/${r.userId}/${r.paidUntil.toISOString()}`, tag: "reinnoire" });
    if ("ok" in res && res.ok) {
      await db.update(accountPlan).set({ subRemindedFor: r.paidUntil }).where(eq(accountPlan.userId, r.userId));
      sent++;
    }
  }
  return { due: due.length, sent };
}

/** Reîncearcă opririle care n-au ajuns la Stripe și punerea prețului de reînnoire. */
export async function retrySubscriptions(db: Db, fetcher: typeof fetch = fetch) {
  const pending = await db.select({ userId: accountPlan.userId, cancel: accountPlan.subCancelPending, fixed: accountPlan.subFixed, sub: accountPlan.stripeSub }).from(accountPlan)
    .where(and(isNotNull(accountPlan.stripeSub), sql`(${accountPlan.subCancelPending} or not ${accountPlan.subFixed})`));
  let cancelled = 0, fixed = 0;
  for (const p of pending) {
    if (p.cancel) {
      const r = await stripeApi(`subscriptions/${p.sub}`, "POST", { cancel_at_period_end: "true" }, fetcher).catch(() => null);
      if (r?.ok || r?.status === 404) { await db.update(accountPlan).set({ subCancelPending: false }).where(eq(accountPlan.userId, p.userId)); cancelled++; }
    }
    if (!p.fixed && (await fixSubscription(db, p.userId, fetcher).catch(() => false))) fixed++;
  }
  return { pending: pending.length, cancelled, fixed };
}

/** Câți au reînnoirea pornită, pe perioade (Admin → Manager control). */
export async function subscriptionCounts(db: Pick<Db, "select">) {
  const rows = await db.select({ period: accountPlan.subPeriod, n: sql<number>`count(*)::int` }).from(accountPlan)
    .where(and(eq(accountPlan.subRenews, true), isNotNull(accountPlan.stripeSub))).groupBy(accountPlan.subPeriod);
  const out = { luna: 0, trimestru: 0, an: 0, total: 0 };
  for (const r of rows) if (isPeriod(r.period)) { out[r.period] = Number(r.n); out.total += Number(r.n); }
  return out;
}


/**
 * Plata cu cardul prin Stripe Checkout, fără bibliotecă: o cerere la API pentru pagina de plată și verificarea semnăturii
 * confirmării (webhook). Banii ajung în contul firmei din Stripe și de acolo în contul bancar al firmei.
 *
 * Ce se poate plăti:
 * - „an”: un an în Cartea Neamului pe un plan (Basic, Familie, Premium). Pe același plan se adaugă la anul deja plătit;
 *   trecerea la un plan mai scump în timpul anului costă doar diferența pe zilele rămase și nu mută data de sfârșit.
 * - „carte”: cartea PDF a unui arbore, pentru cel care a plătit, 12 luni (o poate reface și descărca de câte ori vrea).
 *   La planurile cu cartea inclusă, cartea aleasă se trece tot aici, cu suma 0 și moneda „inclus”.
 *
 * Cheile se pun în Vercel: STRIPE_SECRET_KEY și STRIPE_WEBHOOK_SECRET (whsec_…). Cheia secretă poate fi una întreagă
 * (sk_live_… / sk_test_…) sau, mai sigur, una restricționată (rk_live_… / rk_test_…) cu drept de scriere pe Checkout Sessions:
 * site-ul doar deschide pagini de plată, restul vine prin webhook. Cheile nu se scriu niciodată în cod.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, payment, tree, user } from "@/db/schema";
import { isTier, tierBook, tierOf, tierPrice, tierRank, type Access, type PlanSettings, type Tier } from "./plans";

export type PayKind = "an" | "carte";
export const isPayKind = (v: unknown): v is PayKind => v === "an" || v === "carte";
const DAY = 86_400_000;
export const YEAR_DAYS = 365;

export const stripeReady = () => !!process.env.STRIPE_SECRET_KEY?.trim();

/** O sumă (în lei sau euro) cu eticheta ei, scrisă cum se scrie în limba omului. */
export function money(v: number, locale: string) {
  const lei = locale === "ro";
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);
  return { amount: Math.round(v * 100), currency: lei ? "ron" : "eur", label: lei ? `${n} lei` : `${n} €` };
}

/** Prețul în unitatea mică (bani / cenți): lei pentru română, euro pentru celelalte limbi. Anul, pe planul ales (implicit Basic). */
export function priceFor(kind: PayKind, locale: string, ownsTree: boolean, s: PlanSettings, tier: Tier = "basic") {
  const lei = locale === "ro";
  const p = tierPrice(tier, ownsTree, s);
  return money(kind === "carte" ? (lei ? s.bookLei : s.bookEur) : (lei ? p.lei : p.eur), locale);
}

/**
 * Cât costă anul pe un plan, pentru omul ăsta, acum (reguli din 2026-11-13):
 * - fără an plătit sau cu anul expirat: prețul întreg, un an de azi;
 * - pe același plan, cu anul în curs: prețul întreg, se adaugă un an la data de sfârșit;
 * - spre un plan mai scump, cu anul în curs: (prețNou − prețVechi) × zile rămase / 365, rotunjit la 2 zecimale, cel puțin
 *   1 leu / 1 €; data de sfârșit rămâne aceeași;
 * - spre un plan mai ieftin, în timpul anului: nu se poate.
 * Gratuit mereu și „Plătit” fără termen nu au ce plăti.
 */
export type YearQuote =
  | { ok: true; tier: Tier; value: number; upgradeFrom: Tier | null; until: Date | null; daysLeft: number }
  | { ok: false; reason: "downgrade" | "free" };
export function quoteYear(tier: Tier, access: Access, ownsTree: boolean, locale: string, s: PlanSettings, now = new Date()): YearQuote {
  if (access.kind === "mereu" || (access.kind === "platit" && !access.until)) return { ok: false, reason: "free" };
  const lei = locale === "ro";
  const full = lei ? tierPrice(tier, ownsTree, s).lei : tierPrice(tier, ownsTree, s).eur;
  if (access.kind !== "platit" || !access.until || access.until <= now) return { ok: true, tier, value: full, upgradeFrom: null, until: null, daysLeft: 0 };
  const cur = access.tier;
  const daysLeft = Math.ceil((access.until.getTime() - now.getTime()) / DAY);
  if (tierRank(tier) < tierRank(cur)) return { ok: false, reason: "downgrade" };
  if (tier === cur) return { ok: true, tier, value: full, upgradeFrom: null, until: access.until, daysLeft };
  const old = lei ? tierPrice(cur, ownsTree, s).lei : tierPrice(cur, ownsTree, s).eur;
  const diff = Math.round((full - old) * (Math.min(daysLeft, YEAR_DAYS) / YEAR_DAYS) * 100) / 100;
  return { ok: true, tier, value: Math.max(1, diff), upgradeFrom: cur, until: access.until, daysLeft };
}

/** Limba paginii de plată din Stripe (toate limbile site-ului au una). */
const stripeLocale = (l: string) => (l.startsWith("en") ? "en" : l);

/** Deschide o pagină de plată în Stripe și dă adresa ei. */
export async function createCheckout(o: {
  kind: PayKind; userId: string; email: string; treeId?: string | null; name: string;
  amount: number; currency: string; locale: string; successUrl: string; cancelUrl: string;
  /** Pentru „an”: planul plătit și, la trecerea pe un plan mai scump, de pe ce plan și până când rămâne anul. */
  tier?: Tier; upgradeFrom?: Tier | null; paidUntil?: Date | null;
}, fetcher: typeof fetch = fetch): Promise<string> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": o.currency,
    "line_items[0][price_data][unit_amount]": String(o.amount),
    "line_items[0][price_data][product_data][name]": o.name,
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
    client_reference_id: o.userId,
    customer_email: o.email,
    locale: stripeLocale(o.locale),
    "metadata[kind]": o.kind,
    "metadata[userId]": o.userId,
    "invoice_creation[enabled]": "true",
    // Câmpul „Cod promoțional” pe pagina Stripe: codurile se fac în Stripe (Products → Coupons), de pildă pentru plăți de
    // probă cu sume mici, fără să se schimbe prețurile din Admin. Suma plătită nu se verifică la confirmare.
    allow_promotion_codes: "true",
  });
  if (o.treeId) body.set("metadata[treeId]", o.treeId);
  if (o.tier) body.set("metadata[tier]", o.tier);
  if (o.upgradeFrom) body.set("metadata[upgradeFrom]", o.upgradeFrom);
  if (o.upgradeFrom && o.paidUntil) body.set("metadata[paidUntil]", o.paidUntil.toISOString());
  const r = await fetcher("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = (await r.json()) as { url?: string; error?: { message?: string } };
  if (!r.ok || !j.url) throw new Error(`Stripe: ${j.error?.message ?? r.status}`);
  return j.url;
}

/** Verifică semnătura confirmării trimise de Stripe (antetul `stripe-signature`), cu cel mult 5 minute întârziere. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2) as [string, string]).filter((p) => p.length === 2));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > 300) return false;
  const want = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return sigs.some((s) => s.length === want.length && timingSafeEqual(Buffer.from(s), Buffer.from(want)));
}

export type PaidSession = {
  id: string; kind: PayKind; userId: string; treeId: string | null; amount: number; currency: string;
  /** Planul anului plătit (plățile de dinainte de planuri: Basic) și, la o trecere pe un plan mai scump, planul de dinainte. */
  tier?: Tier; upgradeFrom?: Tier | null;
};

/**
 * Din evenimentul Stripe, plata încheiată: doar cele două evenimente, cu banii primiți („paid”) sau fără nimic de plătit
 * („no_payment_required”, când un cod promoțional acoperă tot prețul). Suma nu se compară cu prețul, ca un cod de reducere
 * să dea același acces; în `payment` se trece suma plătită de fapt.
 */
export function paidSession(event: unknown): PaidSession | null {
  const e = event as { type?: string; data?: { object?: Record<string, unknown> } };
  if (e?.type !== "checkout.session.completed" && e?.type !== "checkout.session.async_payment_succeeded") return null;
  const o = e.data?.object ?? {};
  if (o.payment_status !== "paid" && o.payment_status !== "no_payment_required") return null;
  const md = (o.metadata ?? {}) as Record<string, string>;
  if (!isPayKind(md.kind) || !md.userId || typeof o.id !== "string") return null;
  const base = { id: o.id, kind: md.kind, userId: md.userId, treeId: md.treeId || null, amount: Number(o.amount_total ?? 0), currency: String(o.currency ?? "") };
  if (md.kind !== "an") return base;
  return { ...base, tier: isTier(md.tier) ? md.tier : "basic", upgradeFrom: isTier(md.upgradeFrom) ? md.upgradeFrom : null };
}

/**
 * Trece plata în baza de date, o singură dată pentru fiecare sesiune. Anul se adaugă după anul deja plătit (sau de azi);
 * planul „gratuit mereu” rămâne cum e. Întoarce false dacă plata era deja trecută.
 */
export async function applyPayment(db: Db, paid: PaidSession, now = new Date()): Promise<boolean> {
  let p = paid;
  return db.transaction(async (tx) => {
    // Contul poate fi șters între plată și confirmare: plata se păstrează (pentru contabilitate), fără cont și fără an.
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, p.userId));
    if (!owner) p = { ...p, userId: "" };
    if (p.treeId && !(await tx.select({ id: tree.id }).from(tree).where(eq(tree.id, p.treeId))).length) p = { ...p, treeId: null };
    const inserted = await tx.insert(payment).values({ id: p.id, userId: p.userId || null, kind: p.kind, treeId: p.treeId, amount: p.amount, currency: p.currency, createdAt: now })
      .onConflictDoNothing().returning({ id: payment.id });
    if (!inserted.length) return false;
    if (p.kind === "an" && p.userId) {
      const tier = p.tier ?? "basic";
      const [cur] = await tx.select({ plan: accountPlan.plan, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, p.userId));
      const running = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : null;
      // Trecerea pe un plan mai scump în timpul anului: s-a plătit doar diferența, deci data de sfârșit nu se mută.
      // Altfel, un an întreg: după anul în curs (același plan) sau de azi.
      const until = p.upgradeFrom && running ? running : new Date((running ?? now).getTime() + YEAR_DAYS * DAY);
      await tx.insert(accountPlan).values({ userId: p.userId, plan: "familie", paidUntil: until, tier, note: null, updatedAt: now })
        .onConflictDoUpdate({ target: accountPlan.userId, set: { paidUntil: until, tier, updatedAt: now, plan: sql`case when ${accountPlan.plan} = 'mereu' then 'mereu' else 'familie' end` } });
    }
    return true;
  });
}

/** Are omul cartea PDF a arborelui plătită (sau aleasă din plan) în ultimele 12 luni? */
export async function bookPaid(db: Pick<Db, "select">, userId: string, treeId: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - YEAR_DAYS * DAY);
  const [r] = await db.select({ id: payment.id }).from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.treeId, treeId), eq(payment.kind, "carte"), gt(payment.createdAt, since))).limit(1);
  return !!r;
}

const INCLUDED = "inclus";

/**
 * Cartea PDF inclusă în plan, pentru un arbore anume: la „toți arborii titularului”, cartea oricărui arbore al lui, cât are
 * anul plătit. La „una pe an”, nu e automată: o alege din /plata (`claimIncludedBook`).
 */
export function bookIncluded(access: Access, s: PlanSettings, ownsThisTree: boolean) {
  return access.kind === "platit" && ownsThisTree && tierBook(access.tier, s) === "toti";
}

/** Câte cărți incluse mai poate alege omul în anul plătit acum (0, 1 sau `null` = toate ale lui, fără alegere). */
export async function includedBooksLeft(db: Pick<Db, "select">, userId: string, access: Access, s: PlanSettings, now = new Date()): Promise<number | null> {
  const t = tierOf(access);
  if (access.kind !== "platit" || !t) return 0;
  const mode = tierBook(t, s);
  if (mode === "separat") return 0;
  if (mode === "toti") return null;
  // Anul plătit acum a început cu 365 de zile înainte de sfârșitul lui (sau acum un an, la „Plătit” fără termen).
  const since = new Date((access.until ?? now).getTime() - YEAR_DAYS * DAY);
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.kind, "carte"), eq(payment.currency, INCLUDED), gt(payment.createdAt, since)));
  return Number(r?.n ?? 0) >= 1 ? 0 : 1;
}

/** Alege cartea inclusă în plan pentru un arbore: o trece ca plătită (suma 0), pentru 12 luni, ca o carte cumpărată. */
export async function claimIncludedBook(db: Db, userId: string, treeId: string, access: Access, s: PlanSettings, now = new Date()): Promise<boolean> {
  if ((await includedBooksLeft(db, userId, access, s, now)) !== 1) return false;
  if (await bookPaid(db, userId, treeId, now)) return true;
  await db.insert(payment).values({ id: `${INCLUDED}_${userId}_${treeId}_${now.getTime()}`, userId, kind: "carte", treeId, amount: 0, currency: INCLUDED, createdAt: now })
    .onConflictDoNothing();
  return true;
}

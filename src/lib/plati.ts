/**
 * Plata cu cardul prin Stripe Checkout, fără bibliotecă: o cerere la API pentru pagina de plată și verificarea semnăturii
 * confirmării (webhook). Banii ajung în contul firmei din Stripe și de acolo în contul bancar al firmei.
 *
 * Ce se poate plăti:
 * - „an”: un an în Cartea Neamului (după zilele gratuite poate adăuga și schimba din nou). Se adaugă la anul deja plătit.
 * - „carte”: cartea PDF a unui arbore, pentru cel care a plătit, 12 luni (o poate reface și descărca de câte ori vrea).
 *
 * Cheile se pun în Vercel: STRIPE_SECRET_KEY (sk_live_… sau sk_test_…) și STRIPE_WEBHOOK_SECRET (whsec_…).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, payment } from "@/db/schema";
import { yearPrice, type PlanSettings } from "./plans";

export type PayKind = "an" | "carte";
export const isPayKind = (v: unknown): v is PayKind => v === "an" || v === "carte";
const DAY = 86_400_000;
export const YEAR_DAYS = 365;

export const stripeReady = () => !!process.env.STRIPE_SECRET_KEY?.trim();

/** Prețul în unitatea mică (bani / cenți): lei pentru română, euro pentru celelalte limbi. */
export function priceFor(kind: PayKind, locale: string, ownsTree: boolean, s: PlanSettings) {
  const lei = locale === "ro";
  const v = kind === "carte" ? (lei ? s.bookLei : s.bookEur) : (lei ? yearPrice(ownsTree, s).lei : yearPrice(ownsTree, s).eur);
  return { amount: Math.round(v * 100), currency: lei ? "ron" : "eur", label: lei ? `${v} lei` : `${v} €` };
}

/** Limba paginii de plată din Stripe (toate limbile site-ului au una). */
const stripeLocale = (l: string) => (l.startsWith("en") ? "en" : l);

/** Deschide o pagină de plată în Stripe și dă adresa ei. */
export async function createCheckout(o: {
  kind: PayKind; userId: string; email: string; treeId?: string | null; name: string;
  amount: number; currency: string; locale: string; successUrl: string; cancelUrl: string;
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
  });
  if (o.treeId) body.set("metadata[treeId]", o.treeId);
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

export type PaidSession = { id: string; kind: PayKind; userId: string; treeId: string | null; amount: number; currency: string };

/** Din evenimentul Stripe, plata încheiată (doar „checkout.session.completed” cu banii primiți). */
export function paidSession(event: unknown): PaidSession | null {
  const e = event as { type?: string; data?: { object?: Record<string, unknown> } };
  if (e?.type !== "checkout.session.completed" && e?.type !== "checkout.session.async_payment_succeeded") return null;
  const o = e.data?.object ?? {};
  if (o.payment_status !== "paid") return null;
  const md = (o.metadata ?? {}) as Record<string, string>;
  if (!isPayKind(md.kind) || !md.userId || typeof o.id !== "string") return null;
  return { id: o.id, kind: md.kind, userId: md.userId, treeId: md.treeId || null, amount: Number(o.amount_total ?? 0), currency: String(o.currency ?? "") };
}

/**
 * Trece plata în baza de date, o singură dată pentru fiecare sesiune. Anul se adaugă după anul deja plătit (sau de azi);
 * planul „gratuit mereu” rămâne cum e. Întoarce false dacă plata era deja trecută.
 */
export async function applyPayment(db: Db, p: PaidSession, now = new Date()): Promise<boolean> {
  return db.transaction(async (tx) => {
    const inserted = await tx.insert(payment).values({ id: p.id, userId: p.userId, kind: p.kind, treeId: p.treeId, amount: p.amount, currency: p.currency, createdAt: now })
      .onConflictDoNothing().returning({ id: payment.id });
    if (!inserted.length) return false;
    if (p.kind === "an") {
      const [cur] = await tx.select({ plan: accountPlan.plan, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, p.userId));
      const from = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : now;
      const until = new Date(from.getTime() + YEAR_DAYS * DAY);
      await tx.insert(accountPlan).values({ userId: p.userId, plan: "familie", paidUntil: until, note: null, updatedAt: now })
        .onConflictDoUpdate({ target: accountPlan.userId, set: { paidUntil: until, updatedAt: now, plan: sql`case when ${accountPlan.plan} = 'mereu' then 'mereu' else 'familie' end` } });
    }
    return true;
  });
}

/** Are omul cartea PDF a arborelui plătită în ultimele 12 luni? */
export async function bookPaid(db: Pick<Db, "select">, userId: string, treeId: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - YEAR_DAYS * DAY);
  const [r] = await db.select({ id: payment.id }).from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.treeId, treeId), eq(payment.kind, "carte"), gt(payment.createdAt, since))).limit(1);
  return !!r;
}

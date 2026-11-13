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
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt, gte, isNotNull, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, gift, payment, referralBonus, tree, treeMember, user } from "@/db/schema";
import { isTier, planSettings, tierBook, tierOf, tierPrice, tierRank, type Access, type PlanSettings, type Tier } from "./plans";

/**
 * „an” (un an pe un plan), „carte” (cartea PDF a unui arbore), „cadou” (un an dăruit altcuiva, vezi src/lib/extra.ts) și
 * „pastrare” (după anul plătit: familia vede și ascultă tot online un an, fără adăugări; cu `extra: "carte"`, și cartea PDF).
 */
export type PayKind = "an" | "carte" | "cadou" | "pastrare";
export const isPayKind = (v: unknown): v is PayKind => v === "an" || v === "carte" || v === "cadou" || v === "pastrare";
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
  if (kind === "pastrare") return money(lei ? s.keepLei : s.keepEur, locale);
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
  /** Pachetul Basic + cartea PDF („carte”) sau, la „cadou”, pentru cine e și biletul. */
  extra?: "carte" | null; forName?: string | null; note?: string | null;
  /** Textul acordului pentru începerea imediată (fără retragere) și datele vânzătorului, scrise pe pagina Stripe și pe factură. */
  waiver?: string; seller?: string;
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
  // Confirmarea pe suport durabil a renunțării la retragere (OUG 34/2014, art. 12 alin. 7 și art. 16 lit. m): sub butonul de plată
  // din Stripe și în descrierea facturii care pleacă pe email; în subsolul facturii, cine vinde.
  if (o.waiver) {
    body.set("custom_text[submit][message]", o.waiver.slice(0, 1200));
    body.set("invoice_creation[invoice_data][description]", o.waiver.slice(0, 1500));
  }
  if (o.seller) body.set("invoice_creation[invoice_data][footer]", o.seller.slice(0, 5000));
  if (o.treeId) body.set("metadata[treeId]", o.treeId);
  if (o.tier) body.set("metadata[tier]", o.tier);
  if (o.upgradeFrom) body.set("metadata[upgradeFrom]", o.upgradeFrom);
  if (o.upgradeFrom && o.paidUntil) body.set("metadata[paidUntil]", o.paidUntil.toISOString());
  if (o.extra) body.set("metadata[extra]", o.extra);
  if (o.forName) body.set("metadata[forName]", o.forName.slice(0, 120));
  if (o.note) body.set("metadata[note]", o.note.slice(0, 400));
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
  extra?: "carte" | null; forName?: string | null; note?: string | null;
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
  if (md.kind === "cadou") return { ...base, tier: isTier(md.tier) ? md.tier : "familie", forName: md.forName || null, note: md.note || null };
  if (md.kind === "pastrare") return md.extra === "carte" ? { ...base, extra: "carte" as const } : base;
  if (md.kind !== "an") return base;
  const year = { ...base, tier: isTier(md.tier) ? md.tier : "basic", upgradeFrom: isTier(md.upgradeFrom) ? md.upgradeFrom : null };
  return md.extra === "carte" ? { ...year, extra: "carte" as const } : year;
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
    const inserted = await tx.insert(payment).values({
      id: p.id, userId: p.userId || null, kind: p.kind, treeId: p.treeId, amount: p.amount, currency: p.currency, extra: p.extra ?? null, createdAt: now,
    }).onConflictDoNothing().returning({ id: payment.id });
    if (!inserted.length) return false;
    if (p.kind === "an" && p.userId) {
      const tier = p.tier ?? "basic";
      const [cur] = await tx.select({ plan: accountPlan.plan, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, p.userId));
      const running = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : null;
      // Trecerea pe un plan mai scump în timpul anului: s-a plătit doar diferența, deci data de sfârșit nu se mută.
      // Altfel, un an întreg: după anul în curs (același plan) sau de azi.
      const until = p.upgradeFrom && running ? running : new Date((running ?? now).getTime() + YEAR_DAYS * DAY);
      await setYear(tx as unknown as Db, p.userId, tier, until, now);
      await referralOnPayment(tx as unknown as Db, p.userId, now);
    }
    if (p.kind === "cadou") await createGift(tx as unknown as Db, p, now);
    if (p.kind === "pastrare" && p.userId) await setKeep(tx as unknown as Db, p, now);
    return true;
  });
}

/** Pune anul plătit pe cont, cu planul lui, și adaugă zilele în plus câștigate între timp (rude aduse), care încă așteptau. */
export async function setYear(db: Db, userId: string, tier: Tier, until: Date, now: Date) {
  const pending = await db.select({ id: referralBonus.referredId, days: referralBonus.days }).from(referralBonus)
    .where(and(eq(referralBonus.referrerId, userId), isNull(referralBonus.appliedAt)));
  const extra = pending.reduce((n, b) => n + b.days, 0);
  const end = new Date(until.getTime() + extra * DAY);
  await db.insert(accountPlan).values({ userId, plan: "familie", paidUntil: end, tier, note: null, updatedAt: now })
    .onConflictDoUpdate({ target: accountPlan.userId, set: { paidUntil: end, tier, updatedAt: now, plan: sql`case when ${accountPlan.plan} = 'mereu' then 'mereu' else 'familie' end` } });
  for (const b of pending) await db.update(referralBonus).set({ appliedAt: now }).where(eq(referralBonus.referredId, b.id));
}

/**
 * Zilele în plus pentru cine aduce o rudă (Daniel, 2026-11-13): când cineva plătește primul lui an și are un arbore al lui,
 * cel care l-a invitat (prima invitație primită) câștigă `referralDays`, o singură dată pentru fiecare rudă adusă. Dacă are anul
 * plătit, i se adaugă pe loc; altfel așteaptă până își plătește anul.
 */
export async function referralOnPayment(db: Db, userId: string, now: Date) {
  const s = await planSettings(db);
  if (s.referralDays <= 0) return;
  const years = await db.select({ id: payment.id }).from(payment).where(and(eq(payment.userId, userId), eq(payment.kind, "an")));
  if (years.length !== 1) return;
  const [owns] = await db.select({ id: tree.id }).from(tree).where(eq(tree.ownerId, userId)).limit(1);
  if (!owns) return;
  const [m] = await db.select({ by: treeMember.invitedBy }).from(treeMember)
    .where(and(eq(treeMember.userId, userId), isNotNull(treeMember.invitedBy), ne(treeMember.invitedBy, userId))).orderBy(asc(treeMember.joinedAt)).limit(1);
  if (!m?.by) return;
  const made = await db.insert(referralBonus).values({ referredId: userId, referrerId: m.by, days: s.referralDays, createdAt: now })
    .onConflictDoNothing().returning({ id: referralBonus.referredId });
  if (!made.length) return;
  const [cur] = await db.select({ paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, m.by));
  if (cur?.paidUntil && cur.paidUntil > now) {
    await db.update(accountPlan).set({ paidUntil: new Date(cur.paidUntil.getTime() + s.referralDays * DAY), updatedAt: now }).where(eq(accountPlan.userId, m.by));
    await db.update(referralBonus).set({ appliedAt: now }).where(eq(referralBonus.referredId, userId));
  }
}

/**
 * „Păstrarea” plătită: un an de azi sau de la sfârșitul celei în curs. Cu pachetul „Păstrare + carte”, cartea PDF a arborelui
 * ales se trece ca plătită (suma 0, moneda „pachet”), 12 luni, ca o carte cumpărată.
 */
export async function setKeep(db: Db, p: PaidSession, now: Date) {
  const [cur] = await db.select({ keepUntil: accountPlan.keepUntil }).from(accountPlan).where(eq(accountPlan.userId, p.userId));
  const from = cur?.keepUntil && cur.keepUntil > now ? cur.keepUntil : now;
  const until = new Date(from.getTime() + YEAR_DAYS * DAY);
  await db.insert(accountPlan).values({ userId: p.userId, plan: "gratuit", keepUntil: until, updatedAt: now })
    .onConflictDoUpdate({ target: accountPlan.userId, set: { keepUntil: until, updatedAt: now } });
  if (p.extra === "carte" && p.treeId) {
    await db.insert(payment).values({ id: `${p.id}_carte`, userId: p.userId, kind: "carte", treeId: p.treeId, amount: 0, currency: "pachet", createdAt: now })
      .onConflictDoNothing();
  }
  return until;
}

/** Anul dăruit, plătit: se face codul din legătura pe care cel care a plătit o trimite celui care îl primește. */
async function createGift(db: Db, p: PaidSession, now: Date) {
  const code = randomBytes(12).toString("base64url");
  await db.insert(gift).values({ id: code, paymentId: p.id, buyerId: p.userId || null, tier: p.tier ?? "familie", note: p.note ?? null, forName: p.forName ?? null, createdAt: now });
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
  if (mode === "toti") return null;
  // Anul plătit acum a început cu 365 de zile înainte de sfârșitul lui (sau acum un an, la „Plătit” fără termen).
  const since = new Date((access.until ?? now).getTime() - YEAR_DAYS * DAY);
  if (mode === "separat") {
    // Pachetul Basic + cartea PDF: anul plătit așa aduce și o carte, aleasă la fel.
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(payment)
      .where(and(eq(payment.userId, userId), eq(payment.kind, "an"), eq(payment.extra, "carte"), gte(payment.createdAt, since)));
    if (!Number(b?.n ?? 0)) return 0;
  }
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.kind, "carte"), eq(payment.currency, INCLUDED), gte(payment.createdAt, since)));
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

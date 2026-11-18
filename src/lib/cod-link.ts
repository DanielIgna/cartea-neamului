/**
 * Codurile de reducere date prin link (oferta din 18 noiembrie 2026): NEAM90 și codurile NEAM-XXXX ale organizațiilor nu se mai
 * scriu de mână într-un câmp pe pagina de plată. Omul primește linkul carteaneamului.ro/cod/<COD>; codul se ține minte 30 de zile
 * și se pune singur pe plată, doar dacă:
 * - e plata primului an întreg (nu o trecere pe alt plan, nu pachetul cu cartea, nu o reînnoire: omul n-a mai plătit un an și n-a
 *   primit un an dăruit);
 * - nu are deja altă reducere (reducerea de după zilele gratuite sau codul clasei): două reduceri nu se cumulează;
 * - codul e activ în Stripe, neexpirat și cu folosiri rămase (limita și data de expirare se pun în Stripe, la codul promoțional).
 * Reînnoirea e la prețul întreg.
 */
import { and, eq, gt, isNotNull } from "drizzle-orm";
import type { Db } from "@/db";
import { gift, payment } from "@/db/schema";

export const LINK_CODE_COOKIE = "cn-cod";
/** NEAM90 sau NEAM-XXXX; altceva nu se ține minte. */
const SHAPE = /^NEAM(?:90|-[A-Z0-9]{3,12})$/;

export function cleanLinkCode(raw: string | null | undefined): string | null {
  const c = String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  return SHAPE.test(c) ? c : null;
}

export function linkCodeFromCookie(cookie: string | null | undefined): string | null {
  const m = String(cookie ?? "").match(new RegExp(`(?:^|;\\s*)${LINK_CODE_COOKIE}=([^;]+)`));
  return m ? cleanLinkCode(decodeURIComponent(m[1])) : null;
}

/** E primul an al omului? Niciun an plătit înainte (cu bani) și niciun an dăruit primit. */
export async function isFirstYear(db: Db, userId: string): Promise<boolean> {
  const [paid] = await db.select({ id: payment.id }).from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.kind, "an"), gt(payment.amount, 0))).limit(1);
  if (paid) return false;
  const [got] = await db.select({ id: gift.id }).from(gift).where(and(eq(gift.redeemedBy, userId), isNotNull(gift.redeemedAt))).limit(1);
  return !got;
}

type StripePromo = { id: string; code: string; active: boolean; expires_at: number | null; max_redemptions: number | null; times_redeemed: number };

/** Codul promoțional din Stripe, dacă e activ, neexpirat și cu folosiri rămase. */
export async function stripePromoFor(code: string, fetcher: typeof fetch = fetch, now = new Date()): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  const r = await fetcher(`https://api.stripe.com/v1/promotion_codes?active=true&limit=1&code=${encodeURIComponent(code)}`, {
    headers: { authorization: `Bearer ${key}` },
  });
  if (!r.ok) return null;
  const p = ((await r.json()) as { data?: StripePromo[] }).data?.[0];
  if (!p || !p.active || p.code.toUpperCase() !== code) return null;
  if (p.expires_at && p.expires_at * 1000 <= now.getTime()) return null;
  if (p.max_redemptions != null && p.times_redeemed >= p.max_redemptions) return null;
  return p.id;
}

/**
 * Reducerea din link care se pune singură pe plata primului an. `cookie` e antetul cererii; `other` spune dacă plata are deja altă
 * reducere (atunci nu se pune a doua).
 */
export async function linkCodeOffer(db: Db, o: { userId: string; cookie: string | null | undefined; fullFirstYear: boolean; other: boolean },
  fetcher: typeof fetch = fetch): Promise<{ code: string; promoId: string } | null> {
  const code = linkCodeFromCookie(o.cookie);
  if (!code || !o.fullFirstYear || o.other) return null;
  if (!(await isFirstYear(db, o.userId))) return null;
  const promoId = await stripePromoFor(code, fetcher).catch(() => null);
  return promoId ? { code, promoId } : null;
}

/** Codul scris de mână în câmpul de pe /plata (NEAM90, TEST90, NEAM-XXXX…): litere mari, cifre și cratimă. */
export function cleanTypedCode(raw: unknown): string | null {
  const c = String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 30);
  return c.length >= 3 ? c : null;
}

/**
 * Codul scris în câmpul de pe /plata. Merge doar pe plata primului an întreg; dacă e scris, el e singura reducere de pe plată
 * (omul l-a ales). `bad`: codul nu există, a expirat sau s-a terminat; `year`: nu e plata primului an întreg.
 */
export async function typedCodeOffer(db: Db, o: { userId: string; code: string; fullFirstYear: boolean },
  fetcher: typeof fetch = fetch): Promise<{ ok: true; code: string; promoId: string } | { ok: false; reason: "bad" | "year" }> {
  if (!o.fullFirstYear || !(await isFirstYear(db, o.userId))) return { ok: false, reason: "year" };
  const promoId = await stripePromoFor(o.code, fetcher).catch(() => null);
  return promoId ? { ok: true, code: o.code, promoId } : { ok: false, reason: "bad" };
}

/**
 * Plățile de test (Daniel, 24.11.2026): raportul de luni spunea „0 plăți”, deși pe 18.11 a fost o plată reală (Basic, codul
 * NEAM90, Apple Pay), pentru că ignora tot ce era înainte de 20.11. Acum o plată e „de test” doar după ce e, nu după dată:
 * - făcută în modul de test al Stripe (sesiunea începe cu `cs_test_`);
 * - plătită cu un cod de test (TEST90 sau orice cod care începe cu TEST);
 * - fără bani (cartea din pachet sau cartea inclusă în plan, sumă 0).
 * Conturile de test și cele cu „Acces gratuit” se scot separat (src/lib/conturi-test.ts, planul `mereu`).
 *
 * Codul folosit se ține în `payment.promo` de la confirmarea Stripe. Pentru plățile mai vechi decât coloana, îl aflăm o
 * singură dată din Stripe (fillPaymentCodes); `''` înseamnă „verificat, fără cod”.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";

export const TEST_CODE_PREFIX = "TEST";

/** E un cod de test? (TEST90, TEST-ORICE…) */
export function isTestCode(code: string | null | undefined): boolean {
  return !!code && code.trim().toUpperCase().startsWith(TEST_CODE_PREFIX);
}

/** Fragmentul SQL adevărat pentru o plată de test. `p` = aliasul tabelului payment. */
export function testPaymentSql(p = "p"): SQL {
  const a = sql.raw(p);
  return sql`(${a}.id like 'cs_test_%' or upper(coalesce(${a}.promo, '')) like ${`${TEST_CODE_PREFIX}%`})`;
}

/** O plată adevărată, cu bani: nu e de test și nu e o carte inclusă (sumă 0). */
export function realPaymentSql(p = "p"): SQL {
  return sql`(${sql.raw(p)}.amount > 0 and not ${testPaymentSql(p)})`;
}

type StripeSession = { metadata?: Record<string, string> | null; discounts?: { promotion_code?: { code?: string } | string | null }[] | null };

/** Codul unei sesiuni Stripe: cel pus de noi (metadata.offer), altfel cel scris pe pagina Stripe. `''` = fără cod; null = n-am aflat. */
export function codeOfSession(s: StripeSession): string {
  if (s.metadata?.offer) return s.metadata.offer;
  for (const d of s.discounts ?? []) {
    const pc = d?.promotion_code;
    if (pc && typeof pc === "object" && pc.code) return pc.code;
  }
  return "";
}

/**
 * Completează codul plăților vechi (fără `promo`) sau al celor la care știm doar id-ul codului Stripe (`promo_…`), din Stripe.
 * Doar citește din Stripe; o greșeală lasă plata cum e (se încearcă data viitoare). Întoarce câte plăți a completat.
 */
export async function fillPaymentCodes(db: Db, fetcher: typeof fetch = fetch, limit = 30): Promise<number> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return 0;
  const r = await db.execute(sql`select id from payment where id like 'cs_%' and amount > 0
    and (promo is null or promo like 'promo_%') order by created_at desc limit ${limit}`);
  let done = 0;
  for (const row of (r.rows ?? []) as { id: string }[]) {
    try {
      const res = await fetcher(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(row.id)}?expand[]=discounts.promotion_code`, {
        headers: { authorization: `Bearer ${key}` },
      });
      if (!res.ok) continue;
      const code = codeOfSession((await res.json()) as StripeSession);
      await db.execute(sql`update payment set promo = ${code} where id = ${row.id}`);
      done++;
    } catch {
      /* rămâne pentru data viitoare */
    }
  }
  return done;
}

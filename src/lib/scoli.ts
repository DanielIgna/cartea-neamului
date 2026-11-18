/**
 * Secțiunea pentru școli (Daniel, 17.11.2026): /scoala, fișele gratuite, kitul pentru învățători și Admin → Școli.
 *
 * - Formularul „Vreau coduri pentru clasa mea” scrie o cerere (`school_request`). Nimic nu se dă singur: Daniel aprobă manual,
 *   după ce conducerea școlii a confirmat, iar atunci se face școala (`school`) și un cod de reducere (`school_code`).
 * - Codul e în Stripe un cupon pe procent (`cn-scoala-<procent>`, o singură dată pe plată) plus un cod promoțional cu număr
 *   limitat de folosiri și dată de expirare. Pagina /scoala/cod/<COD> ține minte codul 30 de zile (cookie funcțional), contul
 *   făcut atunci e trecut pe cod (`school_signup`), iar pe /plata codul se pune singur cât e valabil.
 * - Plățile cu codul (ales pe Stripe sau pus singur) se trec în `school_payment`, pentru statisticile pe fiecare cod.
 * CRM-ul refolosește createSchoolCode() și tabelele de aici (nu face alt generator).
 */
import { isFirstYear } from "./cod-link";
import { randomInt } from "node:crypto";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { school, schoolCode, schoolPayment, schoolRequest, schoolSignup } from "@/db/schema";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;

export const SCHOOL_COOKIE = "cn-scoala";
export const SCHOOL_DEFAULT_PERCENT = 90;
/** Codurile țin implicit până la sfârșitul anului școlar. */
export function schoolYearEnd(now = new Date()): Date {
  const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  return new Date(Date.UTC(y, 6, 31, 20, 59, 59));
}

/* ---------- Cererea din formular ---------- */

const txt = (max: number) => z.string().trim().max(max);
export const SchoolRequestInput = z.object({
  school: txt(160).min(3, "Scrie numele școlii."),
  locality: txt(120).min(2, "Scrie localitatea."),
  county: txt(60).optional().default(""),
  classLabel: txt(40).min(1, "Scrie clasa (de pildă „a IV-a B”)."),
  students: z.coerce.number({ invalid_type_error: "Scrie numărul de elevi." }).int().min(1, "Cel puțin un elev.").max(60, "Cel mult 60 de elevi pe o clasă."),
  teacher: txt(120).optional().default(""),
  email: z.string().trim().toLowerCase().email("Adresa de email nu pare bună.").max(160),
  phone: txt(40).optional().default(""),
  message: txt(1000).optional().default(""),
});
export type SchoolRequestInput = z.infer<typeof SchoolRequestInput>;

export async function saveSchoolRequest(db: Db, v: SchoolRequestInput, now = new Date()) {
  const [r] = await db.insert(schoolRequest).values({
    school: v.school, locality: v.locality, county: v.county || null, classLabel: v.classLabel, students: v.students,
    teacher: v.teacher || null, email: v.email, phone: v.phone || null, message: v.message || null, createdAt: now,
  }).returning({ id: schoolRequest.id });
  return r.id;
}

/** Câte cereri au venit în ultima oră de la aceeași adresă (pază simplă împotriva umplerii formularului). */
export async function recentRequests(db: Db, email: string, now = new Date()) {
  const [r] = await rows(db, sql`select count(*) as c from school_request where email = ${email} and created_at > ${new Date(now.getTime() - 3_600_000).toISOString()}::timestamp`);
  return n(r?.c);
}

/* ---------- Codurile ---------- */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Un cod ușor de dictat la telefon, fără litere care se încurcă (0/O, 1/I): „SCOALA7K3QD”. */
export function newSchoolCode(): string {
  let s = "SCOALA";
  for (let i = 0; i < 5; i++) s += ALPHA[randomInt(ALPHA.length)];
  return s;
}

async function stripe(path: string, params: Record<string, string> | null, fetcher: typeof fetch, method: "GET" | "POST" = "POST") {
  const r = await fetcher(`https://api.stripe.com/v1/${path}`, {
    method,
    // Versiunea fixă (ca în conversie.ts): în versiunile noi, codul promoțional nu mai primește direct `coupon`.
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    ...(params ? { body: new URLSearchParams(params) } : {}),
  });
  return { ok: r.ok, status: r.status, json: (await r.json().catch(() => ({}))) as { id?: string; error?: { message?: string; code?: string } } };
}

/** Cuponul pe procent (făcut o singură dată) și, pe el, codul promoțional cu folosiri limitate și expirare. Întoarce promo_…. */
export async function createStripeSchoolPromo(code: string, percent: number, maxUses: number, expiresAt: Date, codeId: string, fetcher: typeof fetch = fetch): Promise<string> {
  const coupon = `cn-scoala-${percent}`;
  const got = await stripe(`coupons/${coupon}`, null, fetcher, "GET");
  if (!got.ok) {
    const made = await stripe("coupons", { id: coupon, percent_off: String(percent), duration: "once", name: `Școală -${percent}%` }, fetcher);
    if (!made.ok && made.json.error?.code !== "resource_already_exists") throw new Error(`Stripe cupon: ${made.json.error?.message ?? made.status}`);
  }
  const promo = await stripe("promotion_codes", {
    coupon, code, max_redemptions: String(maxUses), expires_at: String(Math.floor(expiresAt.getTime() / 1000)),
    "metadata[sursa]": "scoala", "metadata[schoolCodeId]": codeId,
  }, fetcher);
  if (!promo.ok || !promo.json.id) throw new Error(`Stripe cod: ${promo.json.error?.message ?? promo.status}`);
  return promo.json.id;
}

export type NewCode = { schoolId: string; requestId?: string | null; classLabel?: string | null; percentOff: number; maxUses: number; expiresAt: Date; by?: string | null };

/**
 * Codul de reducere al unei școli sau clase. Cu `stripe: true` (implicit) se face și în Stripe; dacă Stripe refuză, codul nu
 * rămâne în bază. Fără Stripe (teste, cheie lipsă) rămâne doar în bază, fără să se poată folosi la plată.
 */
export async function createSchoolCode(db: Db, c: NewCode, o: { stripe?: boolean; fetcher?: typeof fetch } = {}) {
  const percent = Math.max(5, Math.min(100, Math.round(c.percentOff)));
  const maxUses = Math.max(1, Math.min(500, Math.round(c.maxUses)));
  for (let i = 0; i < 5; i++) {
    const code = newSchoolCode();
    const [made] = await db.insert(schoolCode).values({
      schoolId: c.schoolId, requestId: c.requestId ?? null, classLabel: c.classLabel ?? null, code, percent, maxUses, expiresAt: c.expiresAt, createdBy: c.by ?? null,
    }).onConflictDoNothing().returning();
    if (!made) continue;
    if (o.stripe ?? !!process.env.STRIPE_SECRET_KEY) {
      try {
        const promo = await createStripeSchoolPromo(code, percent, maxUses, c.expiresAt, made.id, o.fetcher);
        await db.update(schoolCode).set({ stripePromoId: promo }).where(eq(schoolCode.id, made.id));
        return { ...made, stripePromoId: promo };
      } catch (e) {
        await db.delete(schoolCode).where(eq(schoolCode.id, made.id));
        throw e;
      }
    }
    return made;
  }
  throw new Error("scoli: nu am găsit un cod liber");
}

/** Școala (aceeași denumire și localitate = aceeași școală). */
export async function ensureSchool(db: Db, name: string, locality: string, county: string | null) {
  const [made] = await db.insert(school).values({ name: name.trim(), locality: locality.trim(), county }).onConflictDoNothing().returning({ id: school.id });
  if (made) return made.id;
  const [have] = await db.select({ id: school.id }).from(school).where(and(eq(school.name, name.trim()), eq(school.locality, locality.trim())));
  return have.id;
}

/** Aprobarea manuală a unei cereri: școala, codul clasei (implicit 90%, câte folosiri cât elevi, până la sfârșitul anului școlar). */
export async function approveRequest(db: Db, id: string, by: string, opt: { percent?: number; maxUses?: number; expiresAt?: Date } = {}, o: { stripe?: boolean; fetcher?: typeof fetch } = {}, now = new Date()) {
  const [r] = await db.select().from(schoolRequest).where(eq(schoolRequest.id, id));
  if (!r || r.status === "aprobat") return null;
  const schoolId = await ensureSchool(db, r.school, r.locality, r.county);
  const code = await createSchoolCode(db, {
    schoolId, requestId: r.id, classLabel: r.classLabel, percentOff: opt.percent ?? SCHOOL_DEFAULT_PERCENT,
    maxUses: opt.maxUses ?? r.students, expiresAt: opt.expiresAt ?? schoolYearEnd(now), by,
  }, o);
  await db.update(schoolRequest).set({ status: "aprobat", schoolId, decidedBy: by, decidedAt: now }).where(eq(schoolRequest.id, id));
  return code;
}

export async function rejectRequest(db: Db, id: string, by: string, now = new Date()) {
  await db.update(schoolRequest).set({ status: "respins", decidedBy: by, decidedAt: now }).where(eq(schoolRequest.id, id));
}

export async function setCodeActive(db: Db, id: string, active: boolean) {
  await db.update(schoolCode).set({ active }).where(eq(schoolCode.id, id));
}

/* ---------- Conturile și plățile cu codul ---------- */

export function schoolCodeFromCookie(header: string | null | undefined): string | null {
  const m = new RegExp(`(?:^|;\\s*)${SCHOOL_COOKIE}=([A-Z0-9]{6,20})(?:;|$)`).exec(header ?? "");
  return m ? m[1] : null;
}

export async function codeByText(db: Pick<Db, "select">, code: string) {
  const [c] = await db.select().from(schoolCode).where(eq(schoolCode.code, code.trim().toUpperCase()));
  return c ?? null;
}

/** Contul nou făcut după linkul unui cod: trecut pe cod (nu aruncă niciodată). */
export async function recordSchoolSignup(db: Db, userId: string, cookie: string | null | undefined) {
  try {
    const code = schoolCodeFromCookie(cookie);
    if (!code) return;
    const c = await codeByText(db, code);
    if (c) await db.insert(schoolSignup).values({ userId, codeId: c.id }).onConflictDoNothing();
  } catch (e) {
    console.error("scoli: contul nou", e);
  }
}

/**
 * Codul școlii care se pune singur pe /plata: al contului, activ, neexpirat, cu folosiri rămase și făcut în Stripe. Doar la primul
 * an (oferta din 18.11.2026): cine a mai plătit un an sau a primit unul dăruit plătește reînnoirea la prețul întreg.
 */
export async function activeSchoolOffer(db: Db, userId: string, now = new Date()): Promise<{ code: string; promoId: string } | null> {
  if (!(await isFirstYear(db, userId))) return null;
  const [r] = await rows<{ code: string; promo: string | null; max_uses: number; used: number }>(db, sql`
    select c.code, c.stripe_promo_id as promo, c.max_uses, (select count(*) from school_payment p where p.code_id = c.id) as used
    from school_signup s join school_code c on c.id = s.code_id
    where s.user_id = ${userId} and c.active and c.expires_at > ${now.toISOString()}::timestamp
      and not exists (select 1 from school_payment p where p.code_id = c.id and p.user_id = ${userId})`);
  if (!r?.promo || n(r.used) >= n(r.max_uses)) return null;
  return { code: r.code, promoId: r.promo };
}

/** După o plată (webhook): dacă s-a folosit un cod de școală, se trece la codul lui. */
export async function afterSchoolPayment(db: Db, p: { id: string; userId: string; amount: number; currency: string; offer?: string | null; promo?: string | null }, now = new Date()) {
  const code = p.offer ? await codeByText(db, p.offer) : null;
  const byPromo = !code && p.promo ? (await db.select().from(schoolCode).where(eq(schoolCode.stripePromoId, p.promo)))[0] : null;
  const c = code ?? byPromo;
  if (!c) return false;
  await db.insert(schoolPayment).values({ paymentId: p.id, codeId: c.id, userId: p.userId || null, amount: p.amount, currency: p.currency, createdAt: now }).onConflictDoNothing();
  return true;
}

/* ---------- Admin → Școli ---------- */

export async function schoolDashboard(db: Db) {
  const [requests, codes, schools] = await Promise.all([
    db.select().from(schoolRequest).orderBy(sql`case when ${schoolRequest.status} = 'nou' then 0 else 1 end`, desc(schoolRequest.createdAt)).limit(200),
    rows<{ id: string; code: string; percent: number; max_uses: number; expires_at: string; active: boolean; class_label: string | null; stripe_promo_id: string | null;
      school: string; locality: string; signups: number; payments: number; paid: number; created_at: string }>(db, sql`
      select c.id, c.code, c.percent, c.max_uses, c.expires_at, c.active, c.class_label, c.stripe_promo_id, c.created_at, s.name as school, s.locality,
        (select count(*) from school_signup x where x.code_id = c.id) as signups,
        (select count(*) from school_payment p where p.code_id = c.id) as payments,
        (select coalesce(sum(amount), 0) from school_payment p where p.code_id = c.id) as paid
      from school_code c join school s on s.id = c.school_id order by c.created_at desc`),
    rows<{ id: string; name: string; locality: string; county: string | null; codes: number; classes: number }>(db, sql`
      select s.id, s.name, s.locality, s.county, (select count(*) from school_code c where c.school_id = s.id) as codes,
        (select count(distinct coalesce(c.class_label, '')) from school_code c where c.school_id = s.id) as classes
      from school s order by s.name`),
  ]);
  return {
    requests,
    codes: codes.map((c) => ({ ...c, percent: n(c.percent), max_uses: n(c.max_uses), signups: n(c.signups), payments: n(c.payments), paid: n(c.paid) })),
    schools: schools.map((s) => ({ ...s, codes: n(s.codes), classes: n(s.classes) })),
    pending: requests.filter((r) => r.status === "nou").length,
  };
}

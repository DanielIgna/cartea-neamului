import { createHmac } from "node:crypto";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, auditLog, giftCards, propmanageInvite, user } from "@/db/schema";
import { isDemo } from "./demo";
import { CONSENT_TEXT_RO, OFFER_TEXT_RO } from "./propmanage-texte";

/**
 * Contul gratuit PropManage oferit după activarea unui card cadou (Daniel, 2026-11-14).
 *
 * Reguli:
 * - oferta apare doar cu comutatorul din Admin → Carduri cadou pornit (oprit de la sine) și cu PROPMANAGE_INVITE_URL și
 *   PARTNER_SHARED_SECRET puse în Vercel; altfel nu apare deloc, iar activarea cardului merge ca înainte;
 * - numele și emailul pleacă la PropManage DOAR după bifa de acord (nebifată implicit) și butonul „Vreau contul gratuit”;
 *   fără bifă nu se trimite nimic. Rândul din `propmanage_invite` e dovada acordului: data, ora, textul exact, limba;
 * - cererea e POST JSON {nume, email, sursa: "cartea-neamului", partner_id, timestamp}, semnată HMAC-SHA256 cu
 *   PARTNER_SHARED_SECRET peste corpul exact trimis, în antetul `X-Signature: sha256=<hex>`. PropManage întoarce linkul
 *   `/cont-cadou?token=…`, pe care omul îl deschide într-un tab nou;
 * - dacă PropManage nu răspunde sau răspunde greșit, omul nu e marcat invitat, iar oferta se ascunde (nu e o eroare a cardului);
 * - cine a fost invitat o dată (`user.propmanage_invited_at`) nu mai vede oferta nicăieri.
 */

export const OFFER_KEY = "propmanage_offer_enabled";
export const SURSA = "cartea-neamului";
/** Textul bifei, exact cum îl citește omul (cerut de Daniel). Se salvează la fiecare acord. */
export const CONSENT_TEXT = CONSENT_TEXT_RO;
export const OFFER_TEXT = OFFER_TEXT_RO;
export const TIMEOUT_MS = 8000;

export type Place = "activare" | "datele-mele";

type Reader = Pick<Db, "select">;

/** Adresa și cheia lui PropManage, din Vercel. Fără ele oferta nu apare. */
export function propmanageConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.PROPMANAGE_INVITE_URL?.trim(), secret = env.PARTNER_SHARED_SECRET?.trim();
  if (!url || !secret || !/^https?:\/\//.test(url)) return null;
  return { url, secret };
}

export async function offerEnabled(db: Reader): Promise<boolean> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, OFFER_KEY));
  return r?.value === true;
}

export async function setOfferEnabled(db: Pick<Db, "insert">, on: boolean, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: OFFER_KEY, value: on, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: on, updatedBy: by, updatedAt: now } });
  await db.insert(auditLog).values({ actorId: by, entity: "propmanage_oferta", entityId: "comutator", action: on ? "pornit" : "oprit", diff: null, createdAt: now });
}

/** Oferta se arată acestui om? Comutatorul pornit, PropManage configurat, omul neinvitat încă și nu e contul de probă. */
export async function offerVisible(db: Reader, userId: string, env: Record<string, string | undefined> = process.env): Promise<boolean> {
  if (!propmanageConfig(env) || !(await offerEnabled(db))) return false;
  const [u] = await db.select({ email: user.email, invited: user.propmanageInvitedAt }).from(user).where(eq(user.id, userId));
  return !!u && !u.invited && !isDemo(u.email);
}

/** Semnătura cererii: HMAC-SHA256 cu cheia comună peste corpul exact trimis, în hex. */
export const signBody = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("hex");

/** Linkul din răspunsul lui PropManage: {url} / {link} / {invite_url} / {token}; o cale relativă se pune pe adresa lui PropManage. */
export function linkFromResponse(data: unknown, inviteUrl: string): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const raw = [d.url, d.link, d.invite_url, d.inviteUrl, d.signup_url].find((x) => typeof x === "string" && x.length > 0) as string | undefined;
  const base = new URL(inviteUrl);
  let link: URL;
  try {
    if (raw) link = new URL(raw, base.origin);
    else if (typeof d.token === "string" && d.token) link = new URL(`/cont-cadou?token=${encodeURIComponent(d.token)}`, base.origin);
    else return null;
  } catch { return null; }
  if (link.protocol !== "https:" && !(link.protocol === "http:" && /^(localhost|127\.)/.test(link.hostname))) return null;
  return link.toString();
}

/** Cardul folosit cel mai de curând de acest om: de aici vin magazinul (partner_id) și lotul. */
export async function lastCard(db: Reader, userId: string) {
  const [c] = await db.select({ id: giftCards.id, partnerId: giftCards.partnerId, batchId: giftCards.batchId }).from(giftCards)
    .where(and(eq(giftCards.redeemedByUserId, userId), isNotNull(giftCards.redeemedAt))).orderBy(desc(giftCards.redeemedAt)).limit(1);
  return c ?? null;
}

export type InviteResult = { ok: true; link: string } | { ok: false; reason: "no_consent" | "off" | "already" | "unavailable" };

/**
 * Cererea „Vreau contul gratuit”. Fără bifă nu face nimic. Cu bifă: păstrează acordul, trimite la PropManage numele, emailul,
 * sursa și magazinul, și întoarce linkul de înregistrare. Orice greșeală la PropManage → „unavailable”, omul nu e marcat invitat.
 */
export async function requestInvite(db: Db, userId: string, opts: { consent: boolean; place: Place; locale?: string | null; env?: Record<string, string | undefined>; fetchImpl?: typeof fetch; now?: Date }): Promise<InviteResult> {
  const env = opts.env ?? process.env, now = opts.now ?? new Date();
  if (!opts.consent) return { ok: false, reason: "no_consent" };
  const cfg = propmanageConfig(env);
  if (!cfg || !(await offerEnabled(db))) return { ok: false, reason: "off" };
  const [u] = await db.select({ name: user.name, email: user.email, invited: user.propmanageInvitedAt }).from(user).where(eq(user.id, userId));
  if (!u || isDemo(u.email)) return { ok: false, reason: "off" };
  if (u.invited) return { ok: false, reason: "already" };
  const card = await lastCard(db, userId);
  const body = JSON.stringify({ nume: u.name, email: u.email, sursa: SURSA, partner_id: card?.partnerId ?? null, timestamp: now.toISOString() });
  const base = { userId, consentText: CONSENT_TEXT, consentAt: now, locale: opts.locale ?? null, place: opts.place, sursa: SURSA,
    partnerId: card?.partnerId ?? null, cardId: card?.id ?? null, batchId: card?.batchId ?? null, createdAt: now };
  let link: string | null = null, error: string | null = null;
  try {
    const res = await (opts.fetchImpl ?? fetch)(cfg.url, {
      method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/json", accept: "application/json", "x-signature": `sha256=${signBody(body, cfg.secret)}`, "x-partner-source": SURSA },
    });
    if (!res.ok) error = `HTTP ${res.status}`;
    else {
      link = linkFromResponse(await res.json().catch(() => null), cfg.url);
      if (!link) error = "răspuns fără link";
    }
  } catch (e) {
    error = e instanceof Error ? e.name === "TimeoutError" ? "fără răspuns" : e.message.slice(0, 200) : "eroare";
  }
  if (!link) {
    // Acordul a fost dat și cererea a plecat (sau a încercat): o ținem minte, ca dovadă și ca să vedem în Admin că n-a mers.
    await db.insert(propmanageInvite).values({ ...base, status: "eroare", error });
    return { ok: false, reason: "unavailable" };
  }
  await db.insert(propmanageInvite).values({ ...base, status: "trimis" });
  await db.update(user).set({ propmanageInvitedAt: now }).where(eq(user.id, userId));
  return { ok: true, link };
}

/** Istoricul cererilor unui om, pentru „Descarcă datele mele”. */
export const inviteHistory = (db: Reader, userId: string) =>
  db.select().from(propmanageInvite).where(eq(propmanageInvite.userId, userId)).orderBy(propmanageInvite.createdAt);

/** „Conturi PropManage”: câte cereri trimise cu succes pe fiecare magazin și pe fiecare lot (pentru Admin → Carduri cadou). */
export async function inviteCounts(db: Reader) {
  const sent = eq(propmanageInvite.status, "trimis");
  const [byPartner, byBatch, totals] = await Promise.all([
    db.select({ id: propmanageInvite.partnerId, n: sql<number>`count(*)::int` }).from(propmanageInvite).where(and(sent, isNotNull(propmanageInvite.partnerId))).groupBy(propmanageInvite.partnerId),
    db.select({ id: propmanageInvite.batchId, n: sql<number>`count(*)::int` }).from(propmanageInvite).where(and(sent, isNotNull(propmanageInvite.batchId))).groupBy(propmanageInvite.batchId),
    db.select({
      trimise: sql<number>`count(*) filter (where ${propmanageInvite.status} = 'trimis')::int`,
      erori: sql<number>`count(*) filter (where ${propmanageInvite.status} = 'eroare')::int`,
      faraCard: sql<number>`count(*) filter (where ${propmanageInvite.status} = 'trimis' and ${propmanageInvite.partnerId} is null)::int`,
    }).from(propmanageInvite),
  ]);
  return {
    partner: new Map(byPartner.map((r) => [r.id!, Number(r.n)])),
    batch: new Map(byBatch.map((r) => [r.id!, Number(r.n)])),
    trimise: Number(totals[0]?.trimise ?? 0), erori: Number(totals[0]?.erori ?? 0), faraCard: Number(totals[0]?.faraCard ?? 0),
  };
}

/** Ultimele cereri, pentru Admin: când, de unde, magazinul, starea (fără email). */
export const recentInvites = (db: Reader, limit = 20) =>
  db.select({ at: propmanageInvite.createdAt, place: propmanageInvite.place, partnerId: propmanageInvite.partnerId, status: propmanageInvite.status, error: propmanageInvite.error, name: user.name })
    .from(propmanageInvite).leftJoin(user, eq(user.id, propmanageInvite.userId)).orderBy(desc(propmanageInvite.createdAt)).limit(limit);

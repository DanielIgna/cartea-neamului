/**
 * Carduri cadou vândute prin magazine fizice (Daniel, 2026-11-14): librării, magazine de cadouri, studiouri foto vând un card
 * cu cod QR și un cod unic sub o zonă de răzuit. Cine îl primește îl activează pe /activeaza și primește planul din lot
 * (implicit Basic, 12 luni), fără plată Stripe; dacă are deja un an plătit, i se prelungește.
 *
 * Reguli:
 * - Totul merge doar cu comutatorul general pornit (app_setting `gift_cards_enabled`, din Admin → Carduri cadou).
 * - Un cod e folosibil doar după ce e marcat „vândut” (de admin sau de magazin, pe /magazin/<token> cu PIN): un card furat de pe
 *   raft nu merge. Drumul: generat → livrat_magazin → vandut_activat_de_magazin → folosit, sau anulat.
 * - Codurile: 12 caractere din 32 (fără 0/O/1/I), scrise XXXX-XXXX-XXXX, din randomBytes (60 de biți).
 * - Pe /activeaza: cel mult 10 încercări pe oră de pe un IP (și tot atâtea pe cont); IP-ul se ține doar ca amprentă.
 * - Fiecare generare, livrare, vânzare, activare și anulare se scrie în audit_log (entity „card_cadou”).
 * Fluxul de plată Stripe și codurile promoționale nu sunt atinse.
 */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNotNull, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, appSetting, auditLog, giftCardAttempt, giftCardBatches, giftCards, partners } from "@/db/schema";
import { isTier, tierRank, type Tier } from "./plans";
import { setYear } from "./plati";

export const ENABLED_KEY = "gift_cards_enabled";
export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 de semne, fără 0, O, 1, I
export const STATUSES = ["generat", "livrat_magazin", "vandut_activat_de_magazin", "folosit", "anulat"] as const;
export type CardStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<CardStatus, string> = {
  generat: "Generat", livrat_magazin: "Livrat magazinului", vandut_activat_de_magazin: "Vândut", folosit: "Folosit", anulat: "Anulat",
};
export const SOLDABLE: CardStatus[] = ["generat", "livrat_magazin"];
export const ATTEMPTS_PER_HOUR = 10;
export const MAX_BATCH = 1000;
const HOUR = 3_600_000;

/* ---------- Codurile ---------- */

/** Un cod nou, sigur criptografic: 12 semne din 32 (fiecare octet aleator & 31, deci fără părtinire), scris XXXX-XXXX-XXXX. */
export function newCode(): string {
  const b = randomBytes(12);
  let s = "";
  for (let i = 0; i < 12; i++) s += ALPHABET[b[i] & 31];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Codul scris de om, adus la forma lui: majuscule, fără spații și liniuțe. `null` dacă nu poate fi un cod. */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.toUpperCase().replace(/[\s\-–—_.]/g, "");
  if (s.length !== 12) return null;
  for (const c of s) if (!ALPHABET.includes(c)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Adresa tipărită pe carduri (cerută de Daniel): mereu site-ul de producție, cu www, oricare ar fi mediul în care se generează. */
export const CARD_ORIGIN = "https://www.carteaneamului.ro";
export function activationUrl(origin: string, cod: string) {
  return `${origin.replace(/\/$/, "")}/activeaza?cod=${encodeURIComponent(cod)}`;
}

/* ---------- Comutatorul general ---------- */

export async function giftCardsEnabled(db: Pick<Db, "select">): Promise<boolean> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, ENABLED_KEY));
  return r?.value === true;
}

export async function setGiftCardsEnabled(db: Db, on: boolean, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: ENABLED_KEY, value: on, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: on, updatedBy: by, updatedAt: now } });
  await audit(db, by, "functie", on ? "pornit" : "oprit", null, now);
}

/* ---------- Jurnal ---------- */

export async function audit(db: Pick<Db, "insert">, actorId: string | null, entityId: string, action: string, diff: unknown, now = new Date()) {
  await db.insert(auditLog).values({ treeId: null, actorId, entity: "card_cadou", entityId, action, diff: diff ?? null, createdAt: now });
}

export async function cardLog(db: Pick<Db, "select">, limit = 50) {
  return db.select({ at: auditLog.createdAt, entityId: auditLog.entityId, action: auditLog.action, diff: auditLog.diff, actorId: auditLog.actorId })
    .from(auditLog).where(eq(auditLog.entity, "card_cadou")).orderBy(desc(auditLog.createdAt)).limit(limit);
}

/* ---------- Partenerii (magazinele) ---------- */

export type PartnerInput = {
  numeMagazin: string; oras: string | null; adresa: string | null; persoanaContact: string | null; telefon: string | null;
  email: string | null; comisionProcent: number; activ: boolean; note: string | null;
};

const txt = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
};

/** Datele unui magazin din formular, verificate. */
export function checkPartner(f: Record<string, unknown>): { ok: PartnerInput } | { error: string } {
  const numeMagazin = txt(f.numeMagazin, 160);
  if (!numeMagazin) return { error: "Scrie numele magazinului." };
  const email = txt(f.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresa de email nu pare bună." };
  const raw = typeof f.comisionProcent === "string" && f.comisionProcent.trim() ? Number(f.comisionProcent.replace(",", ".")) : 25;
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) return { error: "Comisionul trebuie să fie între 0 și 100%." };
  return {
    ok: {
      numeMagazin, oras: txt(f.oras, 120), adresa: txt(f.adresa, 300), persoanaContact: txt(f.persoanaContact, 160),
      telefon: txt(f.telefon, 40), email, comisionProcent: Math.round(raw * 100) / 100, activ: f.activ === "on" || f.activ === true,
      note: txt(f.note, 2000),
    },
  };
}

export async function savePartner(db: Db, id: string | null, v: PartnerInput, by: string | null, now = new Date()) {
  if (id) {
    await db.update(partners).set(v).where(eq(partners.id, id));
    await audit(db, by, id, "partener_schimbat", { nume: v.numeMagazin, activ: v.activ, comision: v.comisionProcent }, now);
    return id;
  }
  const [r] = await db.insert(partners).values({ ...v, createdAt: now }).returning({ id: partners.id });
  await audit(db, by, r.id, "partener_nou", { nume: v.numeMagazin }, now);
  return r.id;
}

export async function setPartnerActive(db: Db, id: string, activ: boolean, by: string | null, now = new Date()) {
  await db.update(partners).set({ activ }).where(eq(partners.id, id));
  await audit(db, by, id, activ ? "partener_activat" : "partener_dezactivat", null, now);
}

export const partnerList = (db: Pick<Db, "select">) => db.select().from(partners).orderBy(asc(partners.numeMagazin));
export async function partnerById(db: Pick<Db, "select">, id: string) {
  const [p] = await db.select().from(partners).where(eq(partners.id, id));
  return p ?? null;
}
export async function partnerByToken(db: Pick<Db, "select">, token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [p] = await db.select().from(partners).where(eq(partners.portalToken, token));
  return p ?? null;
}

/* ---------- PIN-ul magazinului și sesiunea paginii lui ---------- */

export const PIN_RE = /^\d{6,10}$/;
export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("base64url");
  return `${salt}.${scryptSync(pin, salt, 32).toString("base64url")}`;
}
export function pinMatches(pin: string, stored: string | null) {
  if (!stored || !PIN_RE.test(pin)) return false;
  const [salt, h] = stored.split(".");
  if (!salt || !h) return false;
  const a = scryptSync(pin, salt, 32), b = Buffer.from(h, "base64url");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** PIN nou pentru pagina magazinului; face și legătura secretă /magazin/<token> dacă nu există. Vechile sesiuni nu mai merg. */
export async function setPartnerPin(db: Db, id: string, pin: string, by: string | null, now = new Date()) {
  if (!PIN_RE.test(pin)) return null;
  const p = await partnerById(db, id);
  if (!p) return null;
  const portalToken = p.portalToken ?? randomBytes(18).toString("base64url");
  await db.update(partners).set({ pinHash: hashPin(pin), portalToken }).where(eq(partners.id, id));
  await audit(db, by, id, "pin_magazin", null, now);
  return portalToken;
}

const secret = () => process.env.BETTER_AUTH_SECRET?.trim() || "cartea-neamului-local";
const SESSION_HOURS = 12;
/** Biletul de sesiune al paginii magazinului: expirarea + semnătura (legată de PIN, deci PIN nou = sesiuni vechi închise). */
export function portalSession(token: string, pinHash: string, now = Date.now()) {
  const exp = now + SESSION_HOURS * HOUR;
  return `${exp}.${createHmac("sha256", secret()).update(`${token}|${pinHash}|${exp}`).digest("base64url")}`;
}
export function portalSessionOk(value: string | undefined, token: string, pinHash: string | null, now = Date.now()) {
  if (!value || !pinHash) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < now) return false;
  const want = createHmac("sha256", secret()).update(`${token}|${pinHash}|${exp}`).digest("base64url");
  return want.length === sig.length && timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

/* ---------- Loturile ---------- */

export type BatchInput = { partnerId: string; plan: Tier; durataLuni: number; pretRaftLei: number; cantitate: number };

export function checkBatch(f: Record<string, unknown>): { ok: BatchInput } | { error: string } {
  const partnerId = typeof f.partnerId === "string" ? f.partnerId : "";
  if (!/^[0-9a-f-]{36}$/i.test(partnerId)) return { error: "Alege magazinul." };
  const plan = typeof f.plan === "string" && f.plan ? f.plan : "basic";
  if (!isTier(plan)) return { error: "Planul nu există." };
  const n = (v: unknown, d: number) => (typeof v === "string" && v.trim() ? Number(v.replace(",", ".")) : d);
  const cantitate = n(f.cantitate, 0), durataLuni = n(f.durataLuni, 12), pretRaftLei = n(f.pretRaftLei, 49);
  if (!Number.isInteger(cantitate) || cantitate < 1 || cantitate > MAX_BATCH) return { error: `Cantitatea trebuie să fie între 1 și ${MAX_BATCH}.` };
  if (!Number.isInteger(durataLuni) || durataLuni < 1 || durataLuni > 60) return { error: "Durata trebuie să fie între 1 și 60 de luni." };
  if (!Number.isFinite(pretRaftLei) || pretRaftLei < 0 || pretRaftLei > 10000) return { error: "Prețul de raft nu pare bun." };
  return { ok: { partnerId, plan, durataLuni, cantitate, pretRaftLei: Math.round(pretRaftLei * 100) / 100 } };
}

/** Un lot nou: rândul lotului și `cantitate` coduri unice, numerotate 1..n. Codurile care se lovesc de altele se refac. */
export async function createBatch(db: Db, v: BatchInput, by: string | null, now = new Date()) {
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    const [b] = await t.insert(giftCardBatches).values({ ...v, createdAt: now, createdBy: by }).returning({ id: giftCardBatches.id });
    let seq = 1;
    for (let guard = 0; seq <= v.cantitate && guard < 50; guard++) {
      const rows = [];
      for (let s = seq; s <= v.cantitate && rows.length < 500; s++) rows.push({ batchId: b.id, seq: s, cod: newCode(), partnerId: v.partnerId, createdAt: now });
      const made = await t.insert(giftCards).values(rows).onConflictDoNothing().returning({ seq: giftCards.seq });
      // Dacă un cod a lovit unul existent (foarte rar), lipsește din `made`: îl refacem pe același număr.
      const got = new Set(made.map((m) => m.seq));
      const missing = rows.filter((r) => !got.has(r.seq));
      for (const r of missing) {
        for (let k = 0; k < 10; k++) {
          const ok = await t.insert(giftCards).values({ ...r, cod: newCode() }).onConflictDoNothing().returning({ id: giftCards.id });
          if (ok.length) break;
        }
      }
      seq += rows.length;
    }
    await audit(t, by, b.id, "lot_generat", { partnerId: v.partnerId, plan: v.plan, durataLuni: v.durataLuni, pretRaftLei: v.pretRaftLei, cantitate: v.cantitate }, now);
    return b.id;
  });
}

export async function batchList(db: Pick<Db, "select">) {
  return db.select({
    id: giftCardBatches.id, partnerId: giftCardBatches.partnerId, partner: partners.numeMagazin, plan: giftCardBatches.plan,
    durataLuni: giftCardBatches.durataLuni, pretRaftLei: giftCardBatches.pretRaftLei, cantitate: giftCardBatches.cantitate,
    createdAt: giftCardBatches.createdAt,
    generat: sql<number>`count(*) filter (where ${giftCards.status} = 'generat')::int`,
    livrat: sql<number>`count(*) filter (where ${giftCards.status} = 'livrat_magazin')::int`,
    vandut: sql<number>`count(*) filter (where ${giftCards.status} = 'vandut_activat_de_magazin')::int`,
    folosit: sql<number>`count(*) filter (where ${giftCards.status} = 'folosit')::int`,
    anulat: sql<number>`count(*) filter (where ${giftCards.status} = 'anulat')::int`,
  }).from(giftCardBatches).innerJoin(partners, eq(partners.id, giftCardBatches.partnerId))
    .leftJoin(giftCards, eq(giftCards.batchId, giftCardBatches.id))
    .groupBy(giftCardBatches.id, partners.numeMagazin).orderBy(desc(giftCardBatches.createdAt));
}

export async function batchById(db: Pick<Db, "select">, id: string) {
  const [b] = await db.select({
    id: giftCardBatches.id, partnerId: giftCardBatches.partnerId, partner: partners.numeMagazin, oras: partners.oras, plan: giftCardBatches.plan,
    durataLuni: giftCardBatches.durataLuni, pretRaftLei: giftCardBatches.pretRaftLei, cantitate: giftCardBatches.cantitate, createdAt: giftCardBatches.createdAt,
  }).from(giftCardBatches).innerJoin(partners, eq(partners.id, giftCardBatches.partnerId)).where(eq(giftCardBatches.id, id));
  return b ?? null;
}

export const batchCards = (db: Pick<Db, "select">, batchId: string) =>
  db.select().from(giftCards).where(eq(giftCards.batchId, batchId)).orderBy(asc(giftCards.seq));

export async function cardByCode(db: Pick<Db, "select">, cod: string) {
  const [c] = await db.select({
    id: giftCards.id, cod: giftCards.cod, status: giftCards.status, seq: giftCards.seq, batchId: giftCards.batchId, partnerId: giftCards.partnerId,
    soldAt: giftCards.soldAt, redeemedAt: giftCards.redeemedAt, redeemedByUserId: giftCards.redeemedByUserId,
    plan: giftCardBatches.plan, durataLuni: giftCardBatches.durataLuni,
  }).from(giftCards).innerJoin(giftCardBatches, eq(giftCardBatches.id, giftCards.batchId)).where(eq(giftCards.cod, cod));
  return c ?? null;
}

/* ---------- Schimbările de stare ---------- */

/** Ce carduri atinge o schimbare: un cod, un interval din lot (numerele de pe card) sau tot lotul. */
export type Target = { cod: string } | { batchId: string; from?: number; to?: number };

function targetWhere(t: Target) {
  if ("cod" in t) return eq(giftCards.cod, t.cod);
  const parts = [eq(giftCards.batchId, t.batchId)];
  if (t.from) parts.push(gte(giftCards.seq, t.from));
  if (t.to) parts.push(sql`${giftCards.seq} <= ${t.to}`);
  return and(...parts)!;
}

/** Lotul (sau o parte) a ajuns la magazin: generat → livrat_magazin. */
export async function markDelivered(db: Db, t: Target, by: string | null, now = new Date()) {
  const r = await db.update(giftCards).set({ status: "livrat_magazin" }).where(and(targetWhere(t), eq(giftCards.status, "generat")))
    .returning({ id: giftCards.id });
  if (r.length) await audit(db, by, "cod" in t ? t.cod : t.batchId, "livrat", { ...t, carduri: r.length }, now);
  return r.length;
}

/**
 * Card vândut la casa magazinului: abia de acum codul se poate activa. Merge din „generat” sau „livrat_magazin”.
 * `partnerId` (pagina magazinului) îngrădește la cardurile acelui magazin.
 */
export async function markSold(db: Db, t: Target, by: string | null, via: "admin" | "magazin", now = new Date(), partnerId?: string) {
  const conds = [targetWhere(t), inArray(giftCards.status, SOLDABLE)];
  if (partnerId) conds.push(eq(giftCards.partnerId, partnerId));
  const r = await db.update(giftCards).set({ status: "vandut_activat_de_magazin", soldAt: now }).where(and(...conds))
    .returning({ id: giftCards.id });
  if (r.length) await audit(db, by, "cod" in t ? t.cod : t.batchId, "vandut", { ...t, carduri: r.length, via, partnerId: partnerId ?? null }, now);
  return r.length;
}

/** Anulare: orice card încă nefolosit. Un card folosit nu se mai poate anula (anul e deja pe contul omului). */
export async function cancelCards(db: Db, t: Target, by: string | null, now = new Date()) {
  const r = await db.update(giftCards).set({ status: "anulat" })
    .where(and(targetWhere(t), inArray(giftCards.status, ["generat", "livrat_magazin", "vandut_activat_de_magazin"])))
    .returning({ id: giftCards.id });
  if (r.length) await audit(db, by, "cod" in t ? t.cod : t.batchId, "anulat", { ...t, carduri: r.length }, now);
  return r.length;
}

/* ---------- Limita de încercări ---------- */

export const fingerprint = (kind: string, v: string) => `${kind}:${createHash("sha256").update(`${secret()}|${kind}|${v}`).digest("base64url").slice(0, 32)}`;

/** Câte încercări a mai avut `who` în ultima oră. */
export async function attemptsLastHour(db: Pick<Db, "select">, whos: string[], now = new Date()) {
  if (!whos.length) return 0;
  const since = new Date(now.getTime() - HOUR);
  const rows = await db.select({ who: giftCardAttempt.who, n: sql<number>`count(*)::int` }).from(giftCardAttempt)
    .where(and(inArray(giftCardAttempt.who, whos), gte(giftCardAttempt.at, since))).groupBy(giftCardAttempt.who);
  return rows.reduce((m, r) => Math.max(m, Number(r.n)), 0);
}

export async function recordAttempt(db: Pick<Db, "insert" | "delete">, whos: string[], ok: boolean, now = new Date()) {
  if (!whos.length) return;
  await db.insert(giftCardAttempt).values(whos.map((who) => ({ who, ok, at: now })));
  // Curățenie: încercările mai vechi de o zi nu mai folosesc la nimic.
  if (Math.random() < 0.05) await db.delete(giftCardAttempt).where(sql`${giftCardAttempt.at} < ${new Date(now.getTime() - 24 * HOUR)}`);
}

/* ---------- Activarea ---------- */

export type CheckResult = "ok" | "inactive" | "invalid" | "not_sold" | "used" | "cancelled";

/** Ce s-ar întâmpla cu codul, fără să-l folosească (pentru cine încă n-a intrat în cont). */
export async function checkCode(db: Pick<Db, "select">, cod: string): Promise<CheckResult> {
  if (!(await giftCardsEnabled(db))) return "inactive";
  const n = normalizeCode(cod);
  if (!n) return "invalid";
  const c = await cardByCode(db, n);
  if (!c) return "invalid";
  if (c.status === "folosit") return "used";
  if (c.status === "anulat") return "cancelled";
  if (c.status !== "vandut_activat_de_magazin") return "not_sold";
  return "ok";
}

export const addMonths = (d: Date, months: number) => {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
};

export type RedeemResult = { result: CheckResult | "used_by_you"; until?: Date; plan?: Tier };

/**
 * Activarea cardului pe contul omului: planul din lot pe `durata_luni` luni, de azi sau, dacă are deja anul plătit, de la
 * sfârșitul lui. Dacă planul lui de acum e mai mare decât al cardului, îl păstrează pe al lui (ca la anul dăruit).
 * Codul se ia o singură dată (UPDATE … WHERE status = vândut), deci două activări deodată nu-l pot folosi de două ori.
 */
export async function redeemCard(db: Db, codInput: string, userId: string, now = new Date()): Promise<RedeemResult> {
  if (!(await giftCardsEnabled(db))) return { result: "inactive" };
  const cod = normalizeCode(codInput);
  if (!cod) return { result: "invalid" };
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    const c = await cardByCode(t, cod);
    if (!c || !isTier(c.plan)) return { result: "invalid" as const };
    if (c.status === "folosit") return { result: c.redeemedByUserId === userId ? "used_by_you" as const : "used" as const };
    if (c.status === "anulat") return { result: "cancelled" as const };
    if (c.status !== "vandut_activat_de_magazin") return { result: "not_sold" as const };
    const taken = await t.update(giftCards).set({ status: "folosit", redeemedAt: now, redeemedByUserId: userId })
      .where(and(eq(giftCards.id, c.id), eq(giftCards.status, "vandut_activat_de_magazin"))).returning({ id: giftCards.id });
    if (!taken.length) return { result: "used" as const };
    const [cur] = await t.select({ paidUntil: accountPlan.paidUntil, tier: accountPlan.tier }).from(accountPlan).where(eq(accountPlan.userId, userId));
    const running = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : null;
    const curTier: Tier | null = running && isTier(cur?.tier) ? (cur!.tier as Tier) : running ? "basic" : null;
    const plan: Tier = curTier && tierRank(curTier) >= tierRank(c.plan) ? curTier : c.plan;
    const until = addMonths(running ?? now, c.durataLuni);
    await setYear(t, userId, plan, until, now);
    const [after] = await t.select({ paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, userId));
    await audit(t, userId, cod, "activat", { batchId: c.batchId, plan, durataLuni: c.durataLuni, prelungit: !!running, until: after?.paidUntil ?? until }, now);
    return { result: "ok" as const, until: after?.paidUntil ?? until, plan };
  });
}

/* ---------- Raportul pe parteneri ---------- */

export type PartnerReport = {
  partnerId: string; nume: string; oras: string | null; activ: boolean; comisionProcent: number;
  generate: number; livrate: number; vandute: number; activate: number; anulate: number; incasariLei: number; comisionLei: number;
};

/**
 * Pe fiecare magazin: câte carduri s-au generat, vândut (vândute + folosite, fără anulate), activat (folosite) și comisionul
 * datorat = suma prețurilor de raft ale cardurilor vândute × comision%.
 */
export async function partnerReport(db: Pick<Db, "select">): Promise<PartnerReport[]> {
  const sold = sql`${giftCards.soldAt} is not null and ${giftCards.status} <> 'anulat'`;
  const rows = await db.select({
    partnerId: partners.id, nume: partners.numeMagazin, oras: partners.oras, activ: partners.activ, comisionProcent: partners.comisionProcent,
    generate: sql<number>`count(${giftCards.id})::int`,
    livrate: sql<number>`count(*) filter (where ${giftCards.status} = 'livrat_magazin')::int`,
    vandute: sql<number>`count(*) filter (where ${sold})::int`,
    activate: sql<number>`count(*) filter (where ${giftCards.status} = 'folosit')::int`,
    anulate: sql<number>`count(*) filter (where ${giftCards.status} = 'anulat')::int`,
    incasari: sql<string>`coalesce(sum(${giftCardBatches.pretRaftLei}) filter (where ${sold}), 0)`,
  }).from(partners)
    .leftJoin(giftCards, eq(giftCards.partnerId, partners.id))
    .leftJoin(giftCardBatches, eq(giftCardBatches.id, giftCards.batchId))
    .groupBy(partners.id).orderBy(asc(partners.numeMagazin));
  return rows.map((r) => {
    const incasariLei = Number(r.incasari) || 0, pct = Number(r.comisionProcent) || 0;
    return {
      partnerId: r.partnerId, nume: r.nume, oras: r.oras, activ: r.activ, comisionProcent: pct,
      generate: Number(r.generate), livrate: Number(r.livrate), vandute: Number(r.vandute), activate: Number(r.activate), anulate: Number(r.anulate),
      incasariLei, comisionLei: Math.round(incasariLei * pct) / 100,
    };
  });
}

/** Eticheta scurtă a lotului, tipărită pe card lângă număr („Lot 3FA2 · Nr. 7”), ca magazinul să marcheze fără să vadă codul. */
export const lotLabel = (batchId: string) => batchId.replace(/-/g, "").slice(0, 4).toUpperCase();

/** Loturile unui magazin, pentru pagina lui. */
export const partnerBatches = (db: Pick<Db, "select">, partnerId: string) =>
  db.select({ id: giftCardBatches.id, cantitate: giftCardBatches.cantitate, createdAt: giftCardBatches.createdAt }).from(giftCardBatches)
    .where(eq(giftCardBatches.partnerId, partnerId)).orderBy(desc(giftCardBatches.createdAt));

/** Cardurile vândute recent de un magazin (pentru pagina lui). */
export const recentSoldBy = (db: Pick<Db, "select">, partnerId: string, limit = 20) =>
  db.select({ cod: giftCards.cod, batchId: giftCards.batchId, seq: giftCards.seq, soldAt: giftCards.soldAt, status: giftCards.status }).from(giftCards)
    .where(and(eq(giftCards.partnerId, partnerId), isNotNull(giftCards.soldAt), ne(giftCards.status, "anulat")))
    .orderBy(desc(giftCards.soldAt)).limit(limit);

/* ---------- CSV ---------- */

const cell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  // Fără formule în Excel: o celulă care începe cu = + - @ primește un apostrof în față.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export const toCsv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

/* ---------- Lotul de test cerut la pornire (Daniel, 2026-11-14) ---------- */

const TEST_MARK = "carduri_cadou_lot_test_2026_11_14";
/** O singură dată: magazinul „Test Magazin” și un lot de 5 carduri Basic, 12 luni, 49 lei. Comutatorul rămâne cum e. */
export async function testBatchOnce(db: Db, now = new Date()): Promise<string> {
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, TEST_MARK));
  if (seen) return "deja";
  let [p] = await db.select({ id: partners.id }).from(partners).where(eq(partners.numeMagazin, "Test Magazin")).limit(1);
  if (!p) p = { id: await savePartner(db, null, { numeMagazin: "Test Magazin", oras: "Cluj-Napoca", adresa: null, persoanaContact: null, telefon: null, email: null, comisionProcent: 25, activ: true, note: "Magazin de test pentru verificarea cardurilor cadou. Se poate dezactiva oricând." }, null, now) };
  const batchId = await createBatch(db, { partnerId: p.id, plan: "basic", durataLuni: 12, pretRaftLei: 49, cantitate: 5 }, null, now);
  await db.insert(appSetting).values({ key: TEST_MARK, value: { at: now.toISOString(), batchId }, updatedAt: now }).onConflictDoNothing();
  return `lot ${batchId}`;
}

/**
 * Coduri de activare pentru cardurile cadou vândute pe alte platforme, de pildă Trendyol (Daniel, 25.11.2026).
 *
 * Cine cumpără cardul primește un cod (și un QR spre /activare?cod=…). Pe /activare intră în cont sau își face unul și primește
 * planul codului pe 12 luni, fără plată și fără card. Separat de cardurile din magazine (src/lib/carduri-cadou.ts, /activeaza):
 * aici nu există magazin, marcare „vândut” sau comutator; un cod merge de cum e generat, până e folosit sau anulat.
 *
 * Reguli:
 * - Codul: CN-<PLAN>-XXXX-XXXX, unde PLAN e BAS, FAM sau PRE, iar cele 8 semne vin din 31 (fără 0/O, 1/I/L), din randomBytes,
 *   fără părtinire (aproape 40 de biți). Se folosește o singură dată: UPDATE … WHERE status = 'nefolosit'.
 * - Cel mult 10 încercări pe oră de pe un IP (și tot atâtea pe cont), în tabelul de încercări al cardurilor, cu altă amprentă.
 * - Dacă omul are deja un plan plătit care NU se reînnoiește automat, cele 12 luni se adaugă la capătul lui. Dacă are un abonament
 *   Stripe care se reînnoiește singur, codul NU se folosește: i se spune să oprească reînnoirea (un clic în „Planul meu”) și să
 *   revină. Altfel Stripe l-ar taxa la data veche și reînnoirea ar muta sfârșitul planului înapoi, peste lunile din cod.
 * - Plățile Stripe, /plata, codurile NEAM90/TEST90 și prețurile nu sunt atinse.
 * - Orice generare, activare și anulare se scrie în audit_log (entity „cod_activare”).
 */
import { randomBytes } from "node:crypto";
import { and, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, activationCode, auditLog, user } from "@/db/schema";
import { isTier, tierRank, type Tier } from "./plans";
import { setYear } from "./plati";
import { addMonths, attemptsLastHour, fingerprint, recordAttempt, toCsv } from "./carduri-cadou";

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 de semne: fără 0, O, 1, I, L
export const PREFIX: Record<Tier, string> = { basic: "BAS", familie: "FAM", premium: "PRE" };
const PLAN_OF: Record<string, Tier> = { BAS: "basic", FAM: "familie", PRE: "premium" };
export const CODE_STATUSES = ["nefolosit", "folosit", "anulat"] as const;
export type CodeStatus = (typeof CODE_STATUSES)[number];
export const isCodeStatus = (v: unknown): v is CodeStatus => typeof v === "string" && (CODE_STATUSES as readonly string[]).includes(v);
export const STATUS_LABEL: Record<CodeStatus, string> = { nefolosit: "Nefolosit", folosit: "Folosit", anulat: "Anulat" };
export const DURATA_LUNI = 12;
export const MAX_LOT = 2000;
export const ATTEMPTS_PER_HOUR = 10;
/** Adresa pusă în QR și în CSV: mereu site-ul de producție, oricare ar fi mediul în care se generează. */
export const ACTIVARE_ORIGIN = "https://carteaneamului.ro";
export const activareUrl = (cod: string, origin = ACTIVARE_ORIGIN) => `${origin.replace(/\/$/, "")}/activare?cod=${encodeURIComponent(cod)}`;

/* ---------- Codurile ---------- */

/** `n` semne aleatoare din alfabetul de 31, fără părtinire (octeții ≥ 248 se aruncă). */
function randomChars(n: number): string {
  let s = "";
  while (s.length < n) {
    for (const b of randomBytes(n * 2)) {
      if (b >= 248) continue; // 248 = 31 × 8
      s += CODE_ALPHABET[b % 31];
      if (s.length === n) break;
    }
  }
  return s;
}

/** Un cod nou pentru planul dat: CN-FAM-7K4M-Q9XT. */
export function newActivationCode(plan: Tier): string {
  const r = randomChars(8);
  return `CN-${PREFIX[plan]}-${r.slice(0, 4)}-${r.slice(4)}`;
}

/**
 * Codul scris de om, adus la forma lui: majuscule, fără spații, liniuțe sau puncte; „CN” în față poate lipsi. `null` dacă nu
 * poate fi un cod (lungime greșită, plan necunoscut, semne care nu există în coduri).
 */
export function normalizeActivationCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input.toUpperCase().replace(/[\s\-–—_.·]/g, "");
  if (s.length === 11) s = `CN${s}`;
  if (s.length !== 13 || !s.startsWith("CN")) return null;
  const plan = s.slice(2, 5), rest = s.slice(5);
  if (!PLAN_OF[plan]) return null;
  for (const c of rest) if (!CODE_ALPHABET.includes(c)) return null;
  return `CN-${plan}-${rest.slice(0, 4)}-${rest.slice(4)}`;
}

/** Sursa (platforma): litere mici, cifre și liniuță, cel mult 40 de semne („trendyol”, „emag”, „test”). */
export function normalizeSource(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s || null;
}

/* ---------- Jurnal ---------- */

async function audit(db: Pick<Db, "insert">, actorId: string | null, entityId: string, action: string, diff: unknown, now: Date) {
  await db.insert(auditLog).values({ treeId: null, actorId, entity: "cod_activare", entityId, action, diff: diff ?? null, createdAt: now });
}

/* ---------- Generarea unui lot ---------- */

export type LotInput = { plan: Tier; cantitate: number; sursa: string; durataLuni?: number };

export function checkLot(f: Record<string, unknown>): { ok: LotInput } | { error: string } {
  const plan = typeof f.plan === "string" ? f.plan : "";
  if (!isTier(plan)) return { error: "Alege planul (Basic, Familie sau Premium)." };
  const cantitate = typeof f.cantitate === "string" && f.cantitate.trim() ? Number(f.cantitate) : NaN;
  if (!Number.isInteger(cantitate) || cantitate < 1 || cantitate > MAX_LOT) return { error: `Numărul de coduri trebuie să fie între 1 și ${MAX_LOT}.` };
  const sursa = normalizeSource(f.sursa);
  if (!sursa) return { error: "Scrie sursa (de exemplu trendyol)." };
  return { ok: { plan, cantitate, sursa } };
}

/** Eticheta lotului: sursa, ziua și 4 semne („trendyol-20261125-7K4M”), ca un lot să se poată filtra și exporta separat. */
const lotLabel = (sursa: string, now: Date) => `${sursa}-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomChars(4)}`;

/** Un lot de coduri noi. Codurile care se lovesc de unele existente (foarte rar) se refac. Întoarce eticheta lotului și codurile. */
export async function generateLot(db: Db, v: LotInput, by: string | null, now = new Date()): Promise<{ lot: string; coduri: string[] }> {
  const lot = lotLabel(v.sursa, now);
  const durataLuni = v.durataLuni ?? DURATA_LUNI;
  const coduri: string[] = [];
  for (let guard = 0; coduri.length < v.cantitate && guard < 50; guard++) {
    const want = Math.min(500, v.cantitate - coduri.length);
    const rows = Array.from({ length: want }, () => ({ cod: newActivationCode(v.plan), plan: v.plan, durataLuni, sursa: v.sursa, lot, createdAt: now, createdBy: by }));
    const made = await db.insert(activationCode).values(rows).onConflictDoNothing().returning({ cod: activationCode.cod });
    coduri.push(...made.map((m) => m.cod));
  }
  await audit(db, by, lot, "lot_generat", { plan: v.plan, cantitate: coduri.length, sursa: v.sursa, durataLuni }, now);
  return { lot, coduri };
}

/* ---------- Lista din Admin ---------- */

export type CodeFilter = { status?: CodeStatus | null; sursa?: string | null; lot?: string | null; cod?: string | null };

function where(f: CodeFilter): SQL | undefined {
  const parts: SQL[] = [];
  if (f.status) parts.push(eq(activationCode.status, f.status));
  if (f.sursa) parts.push(eq(activationCode.sursa, f.sursa));
  if (f.lot) parts.push(eq(activationCode.lot, f.lot));
  if (f.cod) parts.push(eq(activationCode.cod, f.cod));
  return parts.length ? and(...parts) : undefined;
}

export async function listCodes(db: Pick<Db, "select">, f: CodeFilter, limit = 200, offset = 0) {
  return db.select({
    id: activationCode.id, cod: activationCode.cod, plan: activationCode.plan, durataLuni: activationCode.durataLuni, sursa: activationCode.sursa,
    status: activationCode.status, lot: activationCode.lot, createdAt: activationCode.createdAt, usedAt: activationCode.usedAt,
    cancelledAt: activationCode.cancelledAt, usedBy: user.email,
  }).from(activationCode).leftJoin(user, eq(user.id, activationCode.usedByUserId)).where(where(f))
    .orderBy(desc(activationCode.createdAt), activationCode.cod).limit(limit).offset(offset);
}

export async function countCodes(db: Pick<Db, "select">, f: CodeFilter) {
  const [r] = await db.select({ n: count() }).from(activationCode).where(where(f));
  return Number(r?.n ?? 0);
}

/** Câte coduri are fiecare sursă, pe stări (pentru tabelul de sus și filtrul de surse). */
export async function sourceSummary(db: Pick<Db, "select">) {
  const rows = await db.select({
    sursa: activationCode.sursa,
    nefolosit: sql<number>`count(*) filter (where ${activationCode.status} = 'nefolosit')::int`,
    folosit: sql<number>`count(*) filter (where ${activationCode.status} = 'folosit')::int`,
    anulat: sql<number>`count(*) filter (where ${activationCode.status} = 'anulat')::int`,
  }).from(activationCode).groupBy(activationCode.sursa).orderBy(activationCode.sursa);
  return rows.map((r) => ({ sursa: r.sursa, nefolosit: Number(r.nefolosit), folosit: Number(r.folosit), anulat: Number(r.anulat) }));
}

/** CSV-ul pentru platformă: codul și legătura completă de activare (pentru QR), plus planul, sursa, lotul și starea. */
export async function codesCsv(db: Pick<Db, "select">, f: CodeFilter) {
  const rows = await listCodes(db, f, 100_000);
  return toCsv(["cod", "link_activare", "plan", "durata_luni", "sursa", "lot", "status", "creat", "folosit_la"],
    rows.map((r) => [r.cod, activareUrl(r.cod), r.plan, r.durataLuni, r.sursa, r.lot, r.status, r.createdAt, r.usedAt]));
}

/* ---------- Anularea ---------- */

/** Anulează codurile încă nefolosite (după id). Un cod folosit nu se mai anulează aici: planul e deja pe contul omului. */
export async function cancelCodes(db: Db, ids: string[], by: string | null, now = new Date()) {
  const ok = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!ok.length) return 0;
  const r = await db.update(activationCode).set({ status: "anulat", cancelledAt: now })
    .where(and(inArray(activationCode.id, ok), eq(activationCode.status, "nefolosit"))).returning({ cod: activationCode.cod });
  for (const c of r) await audit(db, by, c.cod, "anulat", null, now);
  return r.length;
}

/* ---------- Activarea ---------- */

export type ActivationResult = "ok" | "used" | "used_by_you" | "invalid" | "cancelled" | "has_subscription";

export async function codeByValue(db: Pick<Db, "select">, cod: string) {
  const [c] = await db.select().from(activationCode).where(eq(activationCode.cod, cod));
  return c ?? null;
}

/** Ce s-ar întâmpla cu codul, fără să-l folosească (pentru cine încă n-a intrat în cont). */
export async function checkActivationCode(db: Pick<Db, "select">, input: string): Promise<"ok" | "invalid" | "used" | "cancelled"> {
  const cod = normalizeActivationCode(input);
  if (!cod) return "invalid";
  const c = await codeByValue(db, cod);
  if (!c) return "invalid";
  if (c.status === "folosit") return "used";
  if (c.status === "anulat") return "cancelled";
  return "ok";
}

/** Abonamentul Stripe care se reînnoiește singur și e încă în perioada plătită. */
async function renewingSubscription(db: Pick<Db, "select">, userId: string, now: Date) {
  const [p] = await db.select({ sub: accountPlan.stripeSub, renews: accountPlan.subRenews, paidUntil: accountPlan.paidUntil })
    .from(accountPlan).where(eq(accountPlan.userId, userId));
  return !!(p?.sub && p.renews && p.paidUntil && p.paidUntil > now);
}

export type Activation = { result: ActivationResult; plan?: Tier; until?: Date; extended?: boolean; cod?: string };

/**
 * Activarea codului pe contul omului: planul codului pe `durata_luni` luni, de azi sau, dacă are deja un plan plătit (an plătit
 * o dată, card cadou, an dăruit), de la capătul lui. Dacă planul lui de acum e mai mare decât al codului, îl păstrează pe al lui
 * (ca la cardurile din magazine). Codul se ia o singură dată, chiar și la două activări deodată.
 */
export async function activateCode(db: Db, input: string, userId: string, now = new Date()): Promise<Activation> {
  const cod = normalizeActivationCode(input);
  if (!cod) return { result: "invalid" };
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    const c = await codeByValue(t, cod);
    if (!c || !isTier(c.plan)) return { result: "invalid" as const };
    if (c.status === "folosit") {
      if (c.usedByUserId !== userId) return { result: "used" as const, cod };
      const [p] = await t.select({ paidUntil: accountPlan.paidUntil, tier: accountPlan.tier }).from(accountPlan).where(eq(accountPlan.userId, userId));
      return { result: "used_by_you" as const, cod, plan: isTier(p?.tier) ? p!.tier as Tier : c.plan, until: p?.paidUntil ?? undefined };
    }
    if (c.status === "anulat") return { result: "cancelled" as const, cod };
    if (await renewingSubscription(t, userId, now)) return { result: "has_subscription" as const, cod };
    const taken = await t.update(activationCode).set({ status: "folosit", usedAt: now, usedByUserId: userId })
      .where(and(eq(activationCode.id, c.id), eq(activationCode.status, "nefolosit"))).returning({ id: activationCode.id });
    if (!taken.length) return { result: "used" as const, cod };
    const [cur] = await t.select({ paidUntil: accountPlan.paidUntil, tier: accountPlan.tier }).from(accountPlan).where(eq(accountPlan.userId, userId));
    const running = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : null;
    const curTier: Tier | null = running ? (isTier(cur?.tier) ? (cur!.tier as Tier) : "basic") : null;
    const plan: Tier = curTier && tierRank(curTier) > tierRank(c.plan) ? curTier : c.plan;
    await setYear(t, userId, plan, addMonths(running ?? now, c.durataLuni), now);
    const [after] = await t.select({ paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, userId));
    const until = after?.paidUntil ?? addMonths(running ?? now, c.durataLuni);
    await audit(t, userId, cod, "activat", { sursa: c.sursa, plan, planCod: c.plan, durataLuni: c.durataLuni, prelungit: !!running, until }, now);
    return { result: "ok" as const, cod, plan, until, extended: !!running };
  });
}

/* ---------- Limita de încercări (10 pe oră pe IP și pe cont) ---------- */

export const activationWhos = (ip: string, userId?: string | null) => [fingerprint("act-ip", ip), ...(userId ? [fingerprint("act-u", userId)] : [])];
export const tooManyAttempts = async (db: Pick<Db, "select">, whos: string[], now = new Date()) => (await attemptsLastHour(db, whos, now)) >= ATTEMPTS_PER_HOUR;
export { recordAttempt };

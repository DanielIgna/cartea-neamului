/**
 * Partenerii ca CRM (Daniel, 2026-11-14, după „Strategic City Partnership” din PropManage): de la prospect la magazin activ,
 * cu categoria, orașul și județul, următorul pas cu data lui (aducerea aminte din panou), istoricul de contact și, pentru cei
 * activi, vânzările și comisionul din cardurile cadou. Tabelele: `partners` (cu coloanele CRM din migrația 0029) și
 * `partner_contact_log`. Magazinele și cardurile sunt aceleași din src/lib/carduri-cadou.ts.
 */
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, isNull, lt, lte, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { giftCardBatches, giftCards, partnerContactLog, partnerReferral, partners, payment } from "@/db/schema";
import { COUNTIES } from "./place-key";
import { audit, partnerReport, STAGES, type PartnerReport, type Stage } from "./carduri-cadou";

export const CHANNELS: Record<string, string> = { telefon: "Telefon", vizita: "Vizită", email: "Email", whatsapp: "WhatsApp", intalnire: "Întâlnire", altul: "Altceva" };

export type CrmFilter = { etapa?: string; categorie?: string; oras?: string; judet?: string; q?: string };

export type CrmRow = Awaited<ReturnType<typeof crmPartners>>[number];

/** Toți partenerii, cu vânzările lor și pasul de onboarding (date de contact, acord, PIN, lot, prima vânzare). */
export async function crmPartners(db: Pick<Db, "select">) {
  const [rows, report, batches] = await Promise.all([
    db.select().from(partners).orderBy(asc(partners.numeMagazin)),
    partnerReport(db),
    db.select({ partnerId: giftCardBatches.partnerId, n: sql<number>`count(*)::int` }).from(giftCardBatches).groupBy(giftCardBatches.partnerId),
  ]);
  const rep = new Map(report.map((r) => [r.partnerId, r]));
  const lots = new Map(batches.map((b) => [b.partnerId, Number(b.n)]));
  return rows.map((p) => {
    const r: PartnerReport | undefined = rep.get(p.id);
    const steps = [
      { label: "Date de contact", done: !!(p.telefon || p.email) },
      { label: "Acord (etapa Agreat sau Activ)", done: p.etapa === "agreat" || p.etapa === "activ" },
      { label: "PIN pentru pagina magazinului", done: !!p.pinHash },
      { label: "Primul lot de carduri", done: (lots.get(p.id) ?? 0) > 0 },
      { label: "Primul card vândut", done: (r?.vandute ?? 0) > 0 },
    ];
    return { ...p, etapa: p.etapa as Stage, vandute: r?.vandute ?? 0, activate: r?.activate ?? 0, generate: r?.generate ?? 0, comisionLei: r?.comisionLei ?? 0, incasariLei: r?.incasariLei ?? 0, steps, onboarding: steps.filter((s) => s.done).length };
  });
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function filterCrm(rows: CrmRow[], f: CrmFilter) {
  const q = f.q ? fold(f.q) : "", oras = f.oras ? fold(f.oras) : "";
  return rows.filter((p) =>
    (!f.etapa || f.etapa === "toti" || (f.etapa === "prospecte" ? p.etapa === "prospect" || p.etapa === "necontactat" : p.etapa === f.etapa))
    && (!f.categorie || p.categorie === f.categorie)
    && (!f.judet || p.judet === f.judet)
    && (!oras || fold(p.oras ?? "").includes(oras))
    && (!q || fold(`${p.numeMagazin} ${p.persoanaContact ?? ""} ${p.email ?? ""} ${p.telefon ?? ""} ${p.note ?? ""}`).includes(q)));
}

/** Cifrele de sus: câți sunt, câți prospecte, câți în discuții, câți activi, vânzări și comision. */
export function crmStats(rows: CrmRow[]) {
  const by = (...s: Stage[]) => rows.filter((p) => s.includes(p.etapa)).length;
  return {
    total: rows.length,
    prospecte: by("prospect", "necontactat"),
    inLucru: by("contactat", "discutie", "negociere"),
    activi: by("agreat", "activ"),
    vandute: rows.reduce((n, p) => n + p.vandute, 0),
    activate: rows.reduce((n, p) => n + p.activate, 0),
    comision: Math.round(rows.reduce((n, p) => n + p.comisionLei, 0) * 100) / 100,
    perEtapa: Object.fromEntries(STAGES.map((s) => [s, by(s)])) as Record<Stage, number>,
  };
}

/** Acoperirea pe județe: pentru fiecare județ, câți parteneri activi și câți în lucru (prospecte și discuții). */
export function coverage(rows: CrmRow[]) {
  return Object.entries(COUNTIES).map(([code, name]) => {
    const here = rows.filter((p) => p.judet === code);
    return {
      code, name,
      activi: here.filter((p) => p.etapa === "activ" || p.etapa === "agreat").length,
      inLucru: here.filter((p) => !["activ", "agreat", "pauzat", "respins"].includes(p.etapa)).length,
      vandute: here.reduce((n, p) => n + p.vandute, 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "ro"));
}

/** Pașii care au ajuns la termen (azi sau trecuți), fără cei respinși. */
export function dueSteps(rows: CrmRow[], now = new Date()) {
  const end = new Date(now); end.setUTCHours(23, 59, 59, 999);
  return rows.filter((p) => p.urmatorulPasLa && p.urmatorulPasLa <= end && p.etapa !== "respins")
    .sort((a, b) => a.urmatorulPasLa!.getTime() - b.urmatorulPasLa!.getTime());
}

/** Câți pași sunt la termen, pentru insigna din meniu și pentru rezumatul panoului. */
export async function dueCount(db: Pick<Db, "select">, now = new Date()) {
  const end = new Date(now); end.setUTCHours(23, 59, 59, 999);
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(partners).where(and(lte(partners.urmatorulPasLa, end), ne(partners.etapa, "respins")));
  return Number(r?.n ?? 0);
}

/* ---------- Istoricul de contact ---------- */

export function checkContact(f: Record<string, unknown>): { ok: { canal: string; nota: string } } | { error: string } {
  const canal = typeof f.canal === "string" && f.canal in CHANNELS ? f.canal : null;
  const nota = typeof f.nota === "string" ? f.nota.trim().slice(0, 2000) : "";
  if (!canal) return { error: "Alege felul contactului." };
  if (!nota) return { error: "Scrie ce s-a vorbit." };
  return { ok: { canal, nota } };
}

/** Un contact nou; dacă partenerul era „Necontactat” sau „Prospect”, trece la „Contactat”. */
export async function addContact(db: Db, partnerId: string, v: { canal: string; nota: string }, by: string | null, now = new Date()) {
  await db.insert(partnerContactLog).values({ partnerId, canal: v.canal, nota: v.nota, at: now, createdBy: by });
  await db.update(partners).set({ etapa: "contactat", updatedAt: now })
    .where(and(eq(partners.id, partnerId), sql`${partners.etapa} in ('prospect','necontactat')`));
  await audit(db, by, partnerId, "contact_partener", { canal: v.canal }, now);
}

export const contactsOf = (db: Pick<Db, "select">, partnerId: string) =>
  db.select().from(partnerContactLog).where(eq(partnerContactLog.partnerId, partnerId)).orderBy(desc(partnerContactLog.at));

export async function deleteContact(db: Db, partnerId: string, id: string) {
  await db.delete(partnerContactLog).where(and(eq(partnerContactLog.id, id), eq(partnerContactLog.partnerId, partnerId)));
}

/** Schimbă doar etapa (butoanele rapide din fișă). */
export async function setStage(db: Db, partnerId: string, etapa: Stage, by: string | null, now = new Date()) {
  await db.update(partners).set({ etapa, activ: etapa === "agreat" || etapa === "activ", updatedAt: now }).where(eq(partners.id, partnerId));
  await audit(db, by, partnerId, "etapa_partener", { etapa }, now);
}

/** Pasul următor făcut: îl șterge (sau îl mută la o dată nouă). */
export async function setNextStep(db: Db, partnerId: string, pas: string | null, la: Date | null, now = new Date()) {
  await db.update(partners).set({ urmatorulPas: pas, urmatorulPasLa: la, updatedAt: now }).where(eq(partners.id, partnerId));
}

/* ---------- Recomandări: legătura și QR-ul de pe afișul magazinului ---------- */

const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const REF_COOKIE = "cn-recomandat";
export const refUrl = (origin: string, code: string) => `${origin.replace(/\/$/, "")}/r/${code}`;

/** Codul de recomandare al partenerului (6 semne); îl face prima dată când e cerut. */
export async function ensureRefCode(db: Db, partnerId: string) {
  const [p] = await db.select({ refCode: partners.refCode }).from(partners).where(eq(partners.id, partnerId));
  if (!p) return null;
  if (p.refCode) return p.refCode;
  for (let i = 0; i < 10; i++) {
    const b = randomBytes(6);
    const code = Array.from(b, (x) => REF_ALPHABET[x & 31]).join("");
    const r = await db.update(partners).set({ refCode: code }).where(and(eq(partners.id, partnerId), isNull(partners.refCode))).returning({ c: partners.refCode })
      .catch(() => []);
    if (r.length) return code;
    const [again] = await db.select({ refCode: partners.refCode }).from(partners).where(eq(partners.id, partnerId));
    if (again?.refCode) return again.refCode;
  }
  return null;
}

export async function partnerByRef(db: Pick<Db, "select">, code: string) {
  const c = code.toUpperCase();
  if (!/^[2-9A-HJ-NP-Z]{6}$/.test(c)) return null;
  const [p] = await db.select({ id: partners.id, nume: partners.numeMagazin, etapa: partners.etapa }).from(partners).where(eq(partners.refCode, c));
  return p ?? null;
}

/** La contul nou: dacă omul a venit prin legătura unui partener (cookie-ul pus de /r/<cod>), contul e trecut pe acel partener. */
export async function recordReferral(db: Db, userId: string, cookieHeader: string | null | undefined, now = new Date()) {
  const m = (cookieHeader ?? "").match(new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([A-Za-z0-9]{6})`));
  if (!m) return false;
  const p = await partnerByRef(db, m[1]);
  if (!p) return false;
  const r = await db.insert(partnerReferral).values({ userId, partnerId: p.id, at: now }).onConflictDoNothing().returning({ u: partnerReferral.userId });
  return r.length > 0;
}

/* ---------- Raportul lunar „de plată” ---------- */

export const monthOf = (d = new Date()) => d.toISOString().slice(0, 7);
export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
  return { from, to };
}

export type MonthRow = {
  partnerId: string; nume: string; tip: string; oras: string | null; comisionProcent: number;
  vandute: number; activate: number; incasariLei: number; comisionCarduri: number;
  conturiAduse: number; platiAduse: number; platiAduseLei: number; comisionRecomandari: number; total: number;
};

/**
 * Ce i se datorează fiecărui partener pentru o lună: cardurile vândute în luna aceea (fără anulate) × preț de raft × comision%,
 * plus, pentru conturile aduse prin legătura lui, anii plătiți cu cardul în luna aceea (în lei) × același comision%.
 */
export async function monthReport(db: Pick<Db, "select">, month: string): Promise<MonthRow[]> {
  const r = monthRange(month);
  if (!r) return [];
  const [ps, cards, refs, pays] = await Promise.all([
    db.select({ id: partners.id, nume: partners.numeMagazin, tip: partners.tip, oras: partners.oras, pct: partners.comisionProcent }).from(partners).orderBy(asc(partners.numeMagazin)),
    db.select({
      partnerId: giftCards.partnerId,
      vandute: sql<number>`count(*) filter (where ${giftCards.soldAt} >= ${r.from} and ${giftCards.soldAt} < ${r.to} and ${giftCards.status} <> 'anulat')::int`,
      activate: sql<number>`count(*) filter (where ${giftCards.redeemedAt} >= ${r.from} and ${giftCards.redeemedAt} < ${r.to})::int`,
      lei: sql<string>`coalesce(sum(${giftCardBatches.pretRaftLei}) filter (where ${giftCards.soldAt} >= ${r.from} and ${giftCards.soldAt} < ${r.to} and ${giftCards.status} <> 'anulat'), 0)`,
    }).from(giftCards).innerJoin(giftCardBatches, eq(giftCardBatches.id, giftCards.batchId)).groupBy(giftCards.partnerId),
    db.select({ partnerId: partnerReferral.partnerId, n: sql<number>`count(*)::int` }).from(partnerReferral)
      .where(and(gte(partnerReferral.at, r.from), lt(partnerReferral.at, r.to))).groupBy(partnerReferral.partnerId),
    db.select({ partnerId: partnerReferral.partnerId, n: sql<number>`count(*)::int`, bani: sql<string>`coalesce(sum(${payment.amount}), 0)` })
      .from(payment).innerJoin(partnerReferral, eq(partnerReferral.userId, payment.userId))
      .where(and(eq(payment.kind, "an"), eq(payment.currency, "ron"), gte(payment.createdAt, r.from), lt(payment.createdAt, r.to)))
      .groupBy(partnerReferral.partnerId),
  ]);
  const c = new Map(cards.map((x) => [x.partnerId, x])), rf = new Map(refs.map((x) => [x.partnerId, Number(x.n)])), py = new Map(pays.map((x) => [x.partnerId, x]));
  const round = (v: number) => Math.round(v * 100) / 100;
  return ps.map((p) => {
    const pct = Number(p.pct) || 0, k = c.get(p.id), pay = py.get(p.id);
    const incasariLei = Number(k?.lei ?? 0), platiAduseLei = Number(pay?.bani ?? 0) / 100;
    const comisionCarduri = round(incasariLei * pct / 100), comisionRecomandari = round(platiAduseLei * pct / 100);
    return {
      partnerId: p.id, nume: p.nume, tip: p.tip, oras: p.oras, comisionProcent: pct,
      vandute: Number(k?.vandute ?? 0), activate: Number(k?.activate ?? 0), incasariLei, comisionCarduri,
      conturiAduse: rf.get(p.id) ?? 0, platiAduse: Number(pay?.n ?? 0), platiAduseLei, comisionRecomandari, total: round(comisionCarduri + comisionRecomandari),
    };
  });
}

/** Conturile aduse de fiecare partener prin recomandare, de la început. */
export async function referralTotals(db: Pick<Db, "select">) {
  const rows = await db.select({ partnerId: partnerReferral.partnerId, n: sql<number>`count(*)::int` }).from(partnerReferral).groupBy(partnerReferral.partnerId);
  return new Map(rows.map((r) => [r.partnerId, Number(r.n)]));
}

/* ---------- Partenerii care s-au oprit ---------- */

/**
 * Partenerii activi care n-au vândut niciun card de `days` zile (sau deloc, dacă sunt activi de cel puțin atât): pe ei îi suni.
 */
export async function quietPartners(db: Pick<Db, "select">, days = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 86_400_000);
  const rows = await db.select({
    id: partners.id, nume: partners.numeMagazin, oras: partners.oras, telefon: partners.telefon, createdAt: partners.createdAt,
    last: sql<Date | null>`max(${giftCards.soldAt})`,
  }).from(partners).leftJoin(giftCards, eq(giftCards.partnerId, partners.id))
    .where(eq(partners.etapa, "activ")).groupBy(partners.id);
  return rows.map((r) => ({ ...r, last: r.last ? new Date(r.last) : null }))
    .filter((r) => (r.last ? r.last < since : r.createdAt < since))
    .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0));
}

/** Cifrele din pagina magazinului: luna asta (vândute, activate, comision) și de la început, plus conturile aduse. */
export async function portalStats(db: Pick<Db, "select">, partnerId: string, now = new Date()) {
  const month = monthOf(now);
  const [rows, all, refs] = await Promise.all([monthReport(db, month), partnerReport(db), referralTotals(db)]);
  const m = rows.find((r) => r.partnerId === partnerId), a = all.find((r) => r.partnerId === partnerId);
  return {
    luna: { vandute: m?.vandute ?? 0, activate: m?.activate ?? 0, comision: m?.total ?? 0 },
    total: { vandute: a?.vandute ?? 0, activate: a?.activate ?? 0, comision: a?.comisionLei ?? 0 },
    conturiAduse: refs.get(partnerId) ?? 0,
  };
}

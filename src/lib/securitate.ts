/**
 * Securitate (Daniel, 2026-11-13), totul gratuit, fără servicii plătite:
 * - verificarea în 2 pași, la alegerea fiecăruia (aplicație de coduri + coduri de rezervă), prin better-auth (src/lib/auth.ts);
 * - blocarea intrării după prea multe parole greșite (pe email și pe adresa IP), și la codurile greșite din pasul 2;
 * - email când cineva intră în cont de pe un dispozitiv nou (doar dacă Resend e pus);
 * - jurnalul de securitate pentru panoul de admin (/admin/securitate), păstrat 90 de zile.
 * Regulile de numărat sunt funcții simple, verificate în tests/securitate.test.ts; restul scrie și citește din bază.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq, gt, inArray, lt, max, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { knownDevice, securityEvent, user } from "@/db/schema";

export type SecurityKind =
  | "intrare" // intrare reușită (cu parola sau cu Google)
  | "parola_gresita"
  | "intrare_blocata" // cerere oprită fiindcă au fost prea multe greșeli
  | "cod_gresit" // cod greșit la pasul 2
  | "cod_rezerva" // a intrat cu un cod de rezervă
  | "dispozitiv_nou"
  | "2pasi_pornit"
  | "2pasi_oprit"
  | "plata_semnatura" // cineva a trimis la adresa plăților un mesaj fără semnătura Stripe
  | "plata_disputa" // Stripe: clientul a contestat plata la bancă
  | "plata_frauda" // Stripe Radar: avertisment de fraudă de la bancă
  | "recuperare_proprietar"; // un proprietar a resetat verificarea în 2 pași a celuilalt

/** Ce scrie în panou pentru fiecare fel (panoul rămâne în română). */
export const KIND_LABEL: Record<SecurityKind, string> = {
  intrare: "A intrat în cont",
  parola_gresita: "Parolă greșită",
  intrare_blocata: "Intrare oprită (prea multe greșeli)",
  cod_gresit: "Cod greșit la pasul 2",
  cod_rezerva: "A intrat cu un cod de rezervă",
  dispozitiv_nou: "Intrare de pe un dispozitiv nou",
  "2pasi_pornit": "A pornit verificarea în 2 pași",
  "2pasi_oprit": "A oprit verificarea în 2 pași",
  plata_semnatura: "Mesaj fals la adresa plăților",
  plata_disputa: "Plată contestată la bancă",
  plata_frauda: "Avertisment de fraudă (Stripe)",
  recuperare_proprietar: "Recuperare între proprietari (2 pași resetați)",
};

/** Câte greșeli și în cât timp. Pe email: 5 parole greșite în 15 minute. Pe adresa IP: 20. Codurile din pasul 2: 6. */
export const LIMITS = {
  windowMin: 15,
  perEmail: 5,
  perIp: 20,
  codesPerIp: 6,
};
/** Jurnalul se șterge singur după 90 de zile. */
export const KEEP_DAYS = 90;

/**
 * Câte minute mai e blocat, din momentele greșelilor (cele mai noi întâi sau în orice ordine), după ultima intrare reușită.
 * 0 = poate încerca. Blocarea ține `windowMin` minute de la greșeala care a umplut limita.
 */
export function lockMinutes(failures: Date[], limit: number, now = new Date(), windowMin = LIMITS.windowMin): number {
  const since = now.getTime() - windowMin * 60_000;
  const recent = failures.map((d) => d.getTime()).filter((t) => t > since).sort((a, b) => b - a);
  if (recent.length < limit) return 0;
  // Se deblochează când a `limit`-a greșeală (numărând de la cea mai nouă) iese din fereastră.
  const unlockAt = recent[limit - 1] + windowMin * 60_000;
  return Math.max(1, Math.ceil((unlockAt - now.getTime()) / 60_000));
}

export const normEmail = (e: unknown) => (typeof e === "string" ? e.trim().toLowerCase().slice(0, 254) : "");

/** Adresa IP a celui care cere (pe Vercel, x-forwarded-for e pusă de Vercel, nu de browser). */
export function clientIp(h: Headers): string | null {
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0];
  return ip?.trim().slice(0, 64) || null;
}

/** Orașul și țara, aproximative, din antetele puse de Vercel (gratuit). Local nu există. */
export function placeOf(h: Headers): string | null {
  const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : ""; } catch { return v ?? ""; } };
  const city = dec(h.get("x-vercel-ip-city")), country = h.get("x-vercel-ip-country") ?? "";
  return [city, country].filter(Boolean).join(", ") || null;
}

/** „Chrome pe Android”, „Safari pe iPhone”: cât să-l recunoască omul, fără alte amănunte. */
export function deviceLabel(ua: string | null | undefined): string {
  const s = ua ?? "";
  const os = /iPhone/.test(s) ? "iPhone" : /iPad/.test(s) ? "iPad" : /Android/.test(s) ? "Android" : /Windows/.test(s) ? "Windows"
    : /Mac OS X|Macintosh/.test(s) ? "Mac" : /CrOS/.test(s) ? "Chromebook" : /Linux/.test(s) ? "Linux" : "";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\/|Opera/.test(s) ? "Opera" : /SamsungBrowser/.test(s) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(s) ? "Firefox" : /Chrome\/|CriOS/.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "";
  if (browser && os) return `${browser} · ${os}`;
  return browser || os || "?";
}

/** Cookie-ul care recunoaște un telefon sau calculator (doar un număr la întâmplare; în bază stă amprenta lui). */
export const DEVICE_COOKIE = "cn_dispozitiv";
export const newDeviceId = () => randomBytes(18).toString("base64url");
export const deviceHash = (id: string) => createHash("sha256").update(`cn-dispozitiv:${id}`).digest("hex");

export function cookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  for (const part of (cookieHeader ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

type Exec = Pick<Db, "select" | "insert" | "update" | "delete">;

export async function logSecurity(db: Exec, e: { kind: SecurityKind; userId?: string | null; email?: string | null; ip?: string | null;
  device?: string | null; place?: string | null; detail?: string | null }) {
  await db.insert(securityEvent).values({ kind: e.kind, userId: e.userId ?? null, email: e.email ? normEmail(e.email) : null, ip: e.ip ?? null,
    device: e.device?.slice(0, 80) ?? null, place: e.place?.slice(0, 120) ?? null, detail: e.detail?.slice(0, 300) ?? null });
  // Din când în când, ce e mai vechi de 90 de zile se șterge.
  if (Math.random() < 0.02) await db.delete(securityEvent).where(lt(securityEvent.createdAt, new Date(Date.now() - KEEP_DAYS * 86_400_000)));
}

/** Momentele greșelilor de un fel, după ultima intrare reușită (pentru email), din ultimele `windowMin` minute. */
async function failuresSince(db: Exec, kind: SecurityKind, by: "email" | "ip", value: string, now: Date) {
  const since = new Date(now.getTime() - LIMITS.windowMin * 60_000);
  const col = by === "email" ? securityEvent.email : securityEvent.ip;
  let from = since;
  if (by === "email") {
    const [ok] = await db.select({ at: max(securityEvent.createdAt) }).from(securityEvent)
      .where(and(eq(securityEvent.kind, "intrare"), eq(securityEvent.email, value), gt(securityEvent.createdAt, since)));
    if (ok?.at && ok.at > from) from = ok.at;
  }
  const rows = await db.select({ at: securityEvent.createdAt }).from(securityEvent)
    .where(and(eq(securityEvent.kind, kind), eq(col, value), gt(securityEvent.createdAt, from))).orderBy(desc(securityEvent.createdAt)).limit(50);
  return rows.map((r) => r.at);
}

/** Câte minute e oprită intrarea cu parolă pentru acest email sau de la această adresă IP (0 = nu e oprită). */
export async function passwordLock(db: Exec, email: string, ip: string | null, now = new Date()) {
  const byEmail = email ? lockMinutes(await failuresSince(db, "parola_gresita", "email", email, now), LIMITS.perEmail, now) : 0;
  const byIp = ip ? lockMinutes(await failuresSince(db, "parola_gresita", "ip", ip, now), LIMITS.perIp, now) : 0;
  return Math.max(byEmail, byIp);
}

/** Câte minute sunt oprite codurile din pasul 2 de la această adresă IP. */
export async function codeLock(db: Exec, ip: string | null, now = new Date()) {
  return ip ? lockMinutes(await failuresSince(db, "cod_gresit", "ip", ip, now), LIMITS.codesPerIp, now) : 0;
}

/**
 * Ține minte dispozitivul după o intrare reușită. Întoarce true dacă e nou pentru un cont care mai avea dispozitive cunoscute
 * (atunci trimitem emailul). Primul dispozitiv al unui cont (sau primul după această schimbare) nu e „nou”.
 */
export async function rememberDevice(db: Exec, userId: string, deviceId: string, label: string, now = new Date()): Promise<boolean> {
  const hash = deviceHash(deviceId);
  const [known] = await db.select({ h: knownDevice.deviceHash }).from(knownDevice).where(and(eq(knownDevice.userId, userId), eq(knownDevice.deviceHash, hash)));
  if (known) {
    await db.update(knownDevice).set({ lastSeen: now, label }).where(and(eq(knownDevice.userId, userId), eq(knownDevice.deviceHash, hash)));
    return false;
  }
  const [{ n }] = await db.select({ n: count() }).from(knownDevice).where(eq(knownDevice.userId, userId));
  await db.insert(knownDevice).values({ userId, deviceHash: hash, label, firstSeen: now, lastSeen: now }).onConflictDoNothing();
  // Cel mult 30 de dispozitive ținute minte: cele nefolosite de mult pleacă.
  if (n >= 30) {
    const old = await db.select({ h: knownDevice.deviceHash }).from(knownDevice).where(eq(knownDevice.userId, userId)).orderBy(desc(knownDevice.lastSeen)).offset(30);
    if (old.length) await db.delete(knownDevice).where(and(eq(knownDevice.userId, userId), inArray(knownDevice.deviceHash, old.map((o) => o.h))));
  }
  return n > 0;
}

export async function userBasics(db: Pick<Db, "select">, userId: string) {
  const [u] = await db.select({ id: user.id, email: user.email, name: user.name, locale: user.locale, twoFactorEnabled: user.twoFactorEnabled })
    .from(user).where(eq(user.id, userId));
  return u ?? null;
}

export async function userIdByEmail(db: Pick<Db, "select">, email: string) {
  const [u] = await db.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${normEmail(email)}`);
  return u?.id ?? null;
}

/**
 * Evenimentele Stripe care spun că ceva e în neregulă: o plată contestată la bancă (charge.dispute.created) sau un avertisment
 * de fraudă de la bancă prin Stripe Radar (radar.early_fraud_warning.created). Altfel null.
 */
export function stripeAlert(event: unknown): { kind: SecurityKind; detail: string } | null {
  const e = event as { type?: string; data?: { object?: { amount?: number; currency?: string; reason?: string; fraud_type?: string; charge?: string | { id?: string } } } };
  const o = e?.data?.object ?? {};
  const money = typeof o.amount === "number" ? `${(o.amount / 100).toFixed(2)} ${(o.currency ?? "").toUpperCase()}` : "";
  const charge = typeof o.charge === "string" ? o.charge : o.charge?.id ?? "";
  if (e?.type === "charge.dispute.created") return { kind: "plata_disputa", detail: [money, o.reason, charge].filter(Boolean).join(" · ") };
  if (e?.type === "radar.early_fraud_warning.created") return { kind: "plata_frauda", detail: [o.fraud_type, charge].filter(Boolean).join(" · ") };
  return null;
}

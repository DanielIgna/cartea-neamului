import { createHmac, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { partnerConsent, user } from "@/db/schema";
import { isDemo } from "./demo";

/**
 * Partenerii Cartea Neamului și acordul pentru beneficiile lor. Acum e unul singur, PropManage, o platformă pentru proprietari
 * de locuințe. Reguli (cerute de Daniel, 10 noiembrie 2026):
 * - acordul e separat, nebifat de la sine, și nimic din site nu depinde de el;
 * - partenerului îi pleacă DOAR adresa de email a titularului de cont care și-a dat acordul. Niciodată ceva din arbori
 *   (persoane, rude invitate, sate, amintiri, poze, glas): exportul citește doar tabelele `user` și `partner_consent`;
 * - fiecare „da” și „nu” e un rând nou, cu versiunea textului, limba și locul de unde a venit;
 * - acordul se retrage dintr-un clic din „Datele mele” sau din legătura de dezabonare (semnată, fără intrare în cont), iar
 *   adresa dispare din export pe loc.
 */
export const PARTNERS = ["propmanage"] as const;
export type Partner = (typeof PARTNERS)[number];
export const isPartner = (x: unknown): x is Partner => typeof x === "string" && (PARTNERS as readonly string[]).includes(x);

/** Versiunea textului bifat („Vreau să primesc din când în când beneficii pentru casa mea…”); se schimbă odată cu textul. */
export const PARTNER_TEXT_VERSION = "2026-11-10";
/** Textul acordului, în română, exact cum îl citește omul (traducerile sunt în src/i18n/messages/parteneri/). */
export const PROPMANAGE_CONSENT_TEXT = "Vreau să primesc din când în când beneficii pentru casa mea de la PropManage, partenerul Cartea Neamului.";

export type ConsentSource = "cont-nou" | "datele-mele" | "dezabonare";

export { SIGNUP_PARTNER_COOKIE, partnerUrl } from "./partners-shared";
import { SIGNUP_PARTNER_COOKIE } from "./partners-shared";

type Reader = Pick<Db, "select">;
type Writer = Pick<Db, "select" | "insert" | "update">;

export type PartnerState = { granted: boolean; since: Date | null; source: string | null };

/** Starea de acum a acordului: ultimul rând scris. Fără niciun rând, acordul nu e dat. */
export async function partnerState(db: Reader, userId: string, partner: Partner = "propmanage"): Promise<PartnerState> {
  const [last] = await db.select().from(partnerConsent).where(and(eq(partnerConsent.userId, userId), eq(partnerConsent.partner, partner)))
    .orderBy(desc(partnerConsent.createdAt), desc(partnerConsent.id)).limit(1);
  if (!last) return { granted: false, since: null, source: null };
  return { granted: last.granted, since: last.granted ? last.grantedAt : last.revokedAt, source: last.source };
}

/**
 * Dă sau retrage acordul. Scrie mereu un rând nou; la retragere închide și rândul cu acordul dat (`revoked_at`), ca istoricul
 * să arate perioada. Dacă starea e deja cea cerută, nu scrie nimic. Contul de probă (folosit de mulți) nu-și poate da acordul.
 */
export async function setPartnerConsent(db: Writer, userId: string, granted: boolean, opts: { source: ConsentSource; locale?: string | null; partner?: Partner; now?: Date }) {
  const partner = opts.partner ?? "propmanage", now = opts.now ?? new Date();
  const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId));
  if (!u || (granted && isDemo(u.email))) return { changed: false };
  const cur = await partnerState(db, userId, partner);
  if (cur.granted === granted) return { changed: false };
  if (!granted) {
    await db.update(partnerConsent).set({ revokedAt: now })
      .where(and(eq(partnerConsent.userId, userId), eq(partnerConsent.partner, partner), eq(partnerConsent.granted, true), isNull(partnerConsent.revokedAt)));
  }
  await db.insert(partnerConsent).values({
    userId, partner, granted, grantedAt: granted ? now : null, revokedAt: granted ? null : now,
    textVersion: PARTNER_TEXT_VERSION, locale: opts.locale ?? null, source: opts.source, createdAt: now,
  });
  return { changed: true };
}

/** Istoricul acordului unui om, pentru „Descarcă datele mele”. */
export async function partnerHistory(db: Reader, userId: string) {
  return db.select().from(partnerConsent).where(eq(partnerConsent.userId, userId)).orderBy(asc(partnerConsent.createdAt), asc(partnerConsent.id));
}

export type PartnerRow = { email: string; since: string; unsubscribe: string };

/**
 * Lista pentru partener: DOAR conturile al căror ultim cuvânt e „da”, cu adresa de email, data acordului și legătura lor de
 * dezabonare (de pus în fiecare email trimis). Nimic altceva: nici numele, nici arborii, nici rudele. Contul de probă nu intră.
 * Rudele invitate (tabelul `invitation`) și oamenii din arbori (`person`) nu sunt citiți deloc, deci nu pot ajunge aici.
 */
export async function partnerExport(db: Reader, origin: string, partner: Partner = "propmanage", secret = tokenSecret()): Promise<PartnerRow[]> {
  const rows = await db.select({ userId: partnerConsent.userId, granted: partnerConsent.granted, grantedAt: partnerConsent.grantedAt, email: user.email })
    .from(partnerConsent).innerJoin(user, eq(user.id, partnerConsent.userId)).where(eq(partnerConsent.partner, partner))
    .orderBy(asc(partnerConsent.userId), desc(partnerConsent.createdAt), desc(partnerConsent.id));
  const out: PartnerRow[] = [];
  let seen: string | null = null;
  for (const r of rows) {
    if (r.userId === seen) continue; // doar ultimul rând al fiecărui om
    seen = r.userId;
    if (!r.granted || isDemo(r.email)) continue;
    out.push({ email: r.email, since: (r.grantedAt ?? new Date(0)).toISOString(), unsubscribe: `${origin}/parteneri/dezabonare?t=${unsubscribeToken(r.userId, partner, secret)}` });
  }
  return out.sort((a, b) => a.since.localeCompare(b.since) || a.email.localeCompare(b.email));
}

/** Lista ca fișier CSV (deschis în Excel sau Google Sheets): email, acord din, dezabonare. */
export function partnerCsv(rows: PartnerRow[]) {
  const cell = (s: string) => (/[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return ["email,acord_din,dezabonare", ...rows.map((r) => [r.email, r.since, r.unsubscribe].map(cell).join(","))].join("\n") + "\n";
}

/* ---------- Legătura de dezabonare, semnată, fără intrare în cont ---------- */

const DEV_SECRET = "dev-secret-cartea-neamului-schimba-in-productie";
/** Cheia cu care se semnează legăturile: PARTNER_TOKEN_SECRET, dacă e pusă, altfel cheia sesiunilor. */
export const tokenSecret = () => process.env.PARTNER_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET || DEV_SECRET;

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(`dezabonare:${payload}`).digest("base64url");

/** `<partener>.<id cont>.<semnătură>`, totul în base64url. Nu expiră: o legătură veche dintr-un email trebuie să meargă oricând. */
export function unsubscribeToken(userId: string, partner: Partner = "propmanage", secret = tokenSecret()) {
  const payload = `${partner}.${Buffer.from(userId, "utf8").toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Contul și partenerul dintr-o legătură de dezabonare, doar dacă semnătura e bună. */
export function readUnsubscribeToken(token: string | null | undefined, secret = tokenSecret()): { userId: string; partner: Partner } | null {
  const m = /^([a-z]+)\.([A-Za-z0-9_-]{1,200})\.([A-Za-z0-9_-]{43})$/.exec(token ?? "");
  if (!m || !isPartner(m[1])) return null;
  const want = Buffer.from(sign(`${m[1]}.${m[2]}`, secret)), got = Buffer.from(m[3]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { userId: Buffer.from(m[2], "base64url").toString("utf8"), partner: m[1] };
}

/** Cookie-ul de la crearea contului, citit din antetul `cookie` al cererii. */
export function signupPartnerFromCookie(header: string | null | undefined): Partner | null {
  const m = new RegExp(`(?:^|;\\s*)${SIGNUP_PARTNER_COOKIE}=([^;]+)`).exec(header ?? "");
  return m && isPartner(decodeURIComponent(m[1])) ? (decodeURIComponent(m[1]) as Partner) : null;
}

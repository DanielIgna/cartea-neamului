/**
 * CRM Etapa 6 (Daniel, 18.11.2026): răspunsurile citite automat din inbox-ul contact.carteaneamului@gmail.com.
 *
 * - Gmail API, OAuth, DOAR CITIRE (scope gmail.readonly). Cheia de reîmprospătare se ține criptată în app_setting `crm_gmail`.
 * - Se iau doar mesajele care vin de la o organizație din CRM (adresa exactă sau domeniul ei propriu). Restul inbox-ului nu se
 *   citește mai departe și nu se scrie nicăieri (nicio dată personală în plus).
 * - Fiecare răspuns trece prin aceeași ingestie ca până acum: clasificare (pozitiv, neutru, negativ, dezabonare, auto-reply),
 *   negativ și dezabonare → „nu contacta”, pozitiv → „interesat” + sarcină în „Azi”; ciornele de răspuns intră în Aprobări doar
 *   dacă „CRM: ciorne de răspuns” e pornită. Nu se trimite nimic.
 * - Notificările „nelivrat” (mailer-daemon) pentru emailurile trimise din Gmail trec organizația la „nelivrat”.
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { classifyReply, cleanEmail, orgByEmail, type ReplyKind } from "./crm";
import { ingestOne } from "./crm-ingest";
import { SITE_URL } from "./site-url";

export const GMAIL_KEY = "crm_gmail";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_INBOX = "contact.carteaneamului@gmail.com";
export const GMAIL_CALLBACK = "/api/admin/crm/gmail/callback";
const MAX_PER_RUN = 100;

export type GmailState = { sealed?: string; email?: string; linkedAt?: string; lastSync?: string; lastOk?: string; lastError?: string | null; afterMs?: number; read?: number; matched?: number };

export const gmailClient = () => {
  const id = process.env.GMAIL_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GMAIL_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
};

/* ---------- Cheia, criptată ---------- */

const boxKey = () => createHash("sha256").update(`${process.env.BETTER_AUTH_SECRET ?? "local-dev"}:crm-gmail`).digest();
export function seal(text: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", boxKey(), iv);
  const body = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}
export function unseal(sealed: string | undefined) {
  if (!sealed) return null;
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", boxKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export async function gmailState(db: Pick<Db, "select">): Promise<GmailState> {
  const [r] = await db.select({ v: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${GMAIL_KEY}`);
  return ((r?.v ?? {}) as GmailState);
}
export async function saveGmailState(db: Pick<Db, "insert">, v: GmailState, by: string | null = null, now = new Date()) {
  await db.insert(appSetting).values({ key: GMAIL_KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/* ---------- Legarea (OAuth) ---------- */

const stateSig = (userId: string, t: string) => createHmac("sha256", boxKey()).update(`gmail:${userId}:${t}`).digest("base64url").slice(0, 32);
export function authState(userId: string, now = new Date()) {
  const t = String(now.getTime());
  return `${t}.${stateSig(userId, t)}`;
}
export function checkAuthState(userId: string, state: string | null, now = new Date()) {
  const [t, s] = (state ?? "").split(".");
  if (!t || !s || now.getTime() - Number(t) > 15 * 60_000) return false;
  const a = Buffer.from(stateSig(userId, t)), b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function authUrl(clientId: string, state: string) {
  const p = new URLSearchParams({ client_id: clientId, redirect_uri: `${SITE_URL}${GMAIL_CALLBACK}`, response_type: "code", scope: GMAIL_SCOPE,
    access_type: "offline", prompt: "consent", include_granted_scopes: "false", login_hint: GMAIL_INBOX, state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

type Fetch = typeof fetch;
export async function exchangeCode(code: string, f: Fetch = fetch) {
  const c = gmailClient();
  if (!c) throw new Error("lipsesc GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET");
  const r = await f("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: c.id, client_secret: c.secret, redirect_uri: `${SITE_URL}${GMAIL_CALLBACK}`, grant_type: "authorization_code" }) });
  const j = (await r.json()) as { refresh_token?: string; access_token?: string; scope?: string; error?: string };
  if (!r.ok || !j.refresh_token) throw new Error(j.error ?? "Google n-a dat cheia de reîmprospătare");
  if (j.scope && j.scope.split(" ").some((s) => s.includes("mail") && s !== GMAIL_SCOPE)) throw new Error("permisiunea cerută nu e doar de citire");
  return { refreshToken: j.refresh_token, accessToken: j.access_token ?? null };
}

async function accessToken(refreshToken: string, f: Fetch) {
  const c = gmailClient();
  if (!c) throw new Error("lipsesc GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET");
  const r = await f("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: c.id, client_secret: c.secret, grant_type: "refresh_token" }) });
  const j = (await r.json()) as { access_token?: string; error?: string };
  if (!r.ok || !j.access_token) throw new Error(j.error === "invalid_grant" ? "legătura cu Gmail a expirat: leag-o din nou" : `Google: ${j.error ?? r.status}`);
  return j.access_token;
}

/* ---------- Mesajele ---------- */

type Header = { name: string; value: string };
type Part = { mimeType?: string; body?: { data?: string }; parts?: Part[]; headers?: Header[] };
export type GmailMessage = { id: string; threadId?: string; internalDate?: string; snippet?: string; labelIds?: string[]; payload?: Part };

const header = (m: GmailMessage, name: string) => m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
export function fromAddress(v: string | null) {
  if (!v) return null;
  const m = v.match(/<([^>]+)>/);
  return cleanEmail(m ? m[1] : v);
}
function textOf(p: Part | undefined): string {
  if (!p) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return Buffer.from(p.body.data, "base64url").toString("utf8");
  for (const c of p.parts ?? []) {
    const t = textOf(c);
    if (t) return t;
  }
  return "";
}
/** Doar textul nou al răspunsului, fără citatul emailului nostru de dedesubt. */
export function replyText(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  for (const l of lines) {
    if (/^>/.test(l) || /^(On|În|In|Pe|La) .{4,120}(wrote|a scris|scria):?\s*$/i.test(l) || /^-{2,}\s*(Original Message|Mesaj original)/i.test(l) || /^From: /i.test(l)) break;
    out.push(l);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 2000);
}

/** Auto-reply după antete (Auto-Submitted, X-Autoreply, Precedence) sau după subiect; altfel după cuvinte. */
export function classifyMessage(m: GmailMessage, text: string): ReplyKind {
  const auto = header(m, "Auto-Submitted");
  if ((auto && auto.toLowerCase() !== "no") || header(m, "X-Autoreply") || header(m, "X-Autorespond") || /^(auto_reply|bulk|junk)$/i.test(header(m, "Precedence") ?? "")) return "automat";
  if (/^(auto|automatic reply|out of office|răspuns automat|raspuns automat|absent)/i.test(header(m, "Subject") ?? "")) return "automat";
  return classifyReply(`${header(m, "Subject") ?? ""}\n${text}`);
}

/** Adresa care n-a primit emailul, dintr-o notificare „nelivrat” (mailer-daemon). */
export function bouncedRecipient(m: GmailMessage, text: string) {
  const from = fromAddress(header(m, "From")) ?? "";
  if (!/^(mailer-daemon|postmaster)@/i.test(from)) return null;
  const failed = header(m, "X-Failed-Recipients");
  if (failed) return cleanEmail(failed.split(",")[0]);
  const hit = text.match(/(?:wasn't delivered to|nu a fost livrat(?:ă)? (?:către|la)|delivery to the following recipient failed[^:]*:)\s*<?([^\s<>]+@[^\s<>]+)>?/i);
  return hit ? cleanEmail(hit[1]) : null;
}

async function api<T>(token: string, path: string, f: Fetch): Promise<T> {
  const r = await f(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Gmail: ${r.status}`);
  return (await r.json()) as T;
}

export type SyncReport = { skipped?: string; read: number; matched: number; replies: number; bounces: number; byKind: Partial<Record<ReplyKind, number>>; error?: string };

/**
 * O sincronizare: mesajele din inbox venite după ultima rulare (prima dată: ultimele 14 zile), cel mult 100. Cele de la
 * organizații din CRM devin răspunsuri (cu clasificare); notificările „nelivrat” trec adresa pe „nu contacta”. Restul se ignoră.
 */
export async function syncGmail(db: Db, o: { now?: Date; f?: Fetch } = {}): Promise<SyncReport> {
  const now = o.now ?? new Date();
  const f = o.f ?? fetch;
  const st = await gmailState(db);
  const rep: SyncReport = { read: 0, matched: 0, replies: 0, bounces: 0, byKind: {} };
  const refresh = unseal(st.sealed);
  if (!refresh) return { ...rep, skipped: "Gmail nu e legat (Admin → CRM → Sănătate → Leagă Gmail)" };
  if (!gmailClient()) return { ...rep, skipped: "lipsesc GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET (sau cheile Google de la intrarea în cont)" };
  let after = st.afterMs ?? now.getTime() - 14 * 86_400_000;
  try {
    const token = await accessToken(refresh, f);
    const q = encodeURIComponent(`in:inbox -from:me after:${Math.floor(after / 1000)}`);
    const list = await api<{ messages?: { id: string }[] }>(token, `messages?q=${q}&maxResults=${MAX_PER_RUN}`, f);
    const ids = (list.messages ?? []).map((m) => m.id);
    let newest = after;
    for (const id of ids.reverse()) {
      const m = await api<GmailMessage>(token, `messages/${id}?format=full`, f);
      rep.read++;
      const at = new Date(Number(m.internalDate ?? now.getTime()));
      if (at.getTime() > newest) newest = at.getTime();
      const body = textOf(m.payload);
      const bounced = bouncedRecipient(m, body);
      if (bounced) {
        if (!(await orgByEmail(db, bounced))) continue;
        rep.matched++;
        const r = await ingestOne(db, { id: `gmail:${m.id}`, type: "email_nelivrat", email: bounced, rezumat: "Emailul nu a ajuns (notificare Gmail)", at: at.toISOString() }, now);
        if (r.nou) rep.bounces++;
        continue;
      }
      const from = fromAddress(header(m, "From"));
      if (!from || !(await orgByEmail(db, from))) continue; // nu e de la o organizație din CRM: nu citim mai departe
      rep.matched++;
      const text = replyText(body) || (m.snippet ?? "");
      const kind = classifyMessage(m, text);
      const r = await ingestOne(db, { id: `gmail:${m.id}`, type: "raspuns", email: from, subiect: (header(m, "Subject") ?? "").slice(0, 300), rezumat: text.slice(0, 2000), clasificare: kind, at: at.toISOString() }, now);
      if (r.nou) {
        rep.replies++;
        rep.byKind[kind] = (rep.byKind[kind] ?? 0) + 1;
      }
    }
    after = Math.max(after, newest + 1000);
    await saveGmailState(db, { ...st, lastSync: now.toISOString(), lastOk: now.toISOString(), lastError: null, afterMs: after, read: (st.read ?? 0) + rep.read, matched: (st.matched ?? 0) + rep.matched }, null, now);
    if (rep.replies) await queueDraftsIfOn(db, now);
    return rep;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await saveGmailState(db, { ...st, lastSync: now.toISOString(), lastError: msg.slice(0, 300) }, null, now);
    return { ...rep, error: msg };
  }
}

async function queueDraftsIfOn(db: Db, now: Date) {
  const { automationSwitches } = await import("./autonomie");
  const sw = await automationSwitches(db);
  if (sw["crm-ciorne"] && !sw.paused?.["crm-ciorne"]) await (await import("./crm-auto")).queueReplyDrafts(db, { now });
}

/**
 * Admin → SEO: cum stă site-ul în Google. Setările stau în app_setting („seo”): codul de verificare din Google Search Console
 * (meta tag pe prima pagină), proprietatea din Search Console, cuvintele pe care vrem să le urmărim și cheia contului de
 * serviciu Google (criptată cu BETTER_AUTH_SECRET; sau în Vercel, ca GSC_SERVICE_ACCOUNT_JSON).
 *
 * Cu cheia, panoul citește direct din Search Console: după ce cuvinte apare site-ul, pe ce loc, câte afișări și clicuri,
 * ce pagini sunt indexate și starea sitemap-ului. Doar citiri, plus „Trimite sitemap-ul”.
 */
import { revalidateTag } from "next/cache";
import { createCipheriv, createDecipheriv, createHash, createSign, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";

const KEY = "seo";
/** Eticheta cache-ului cu setările SEO citite de prima pagină. */
export const SEO_TAG = "seo-settings";
export const MAX_WATCH = 40;

export type SeoSettings = { verification: string | null; siteUrl: string | null; credentials: string | null; watch: string[] };
const EMPTY: SeoSettings = { verification: null, siteUrl: null, credentials: null, watch: [] };

export async function seoSettings(db: Pick<Db, "select">): Promise<SeoSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const v = (row?.value ?? {}) as Partial<SeoSettings>;
  return {
    verification: typeof v.verification === "string" ? v.verification : null,
    siteUrl: typeof v.siteUrl === "string" ? v.siteUrl : null,
    credentials: typeof v.credentials === "string" ? v.credentials : null,
    watch: Array.isArray(v.watch) ? v.watch.filter((w): w is string => typeof w === "string").slice(0, MAX_WATCH) : [],
  };
}

export async function saveSeoSettings(db: Pick<Db, "select" | "insert">, patch: Partial<SeoSettings>, by: string, now = new Date()) {
  const value = { ...(await seoSettings(db)), ...patch };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  // Codul de verificare de pe prima pagină stă în cache (SEO_TAG); după o schimbare, se citește din nou.
  try { revalidateTag(SEO_TAG); } catch { /* în afara unei cereri Next nu e cache de golit */ }
}

/** Codul din meta tag-ul Google: din `<meta name="google-site-verification" content="ABC…">` sau doar „ABC…”. */
export function parseVerification(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/content\s*=\s*["']([^"']+)["']/i);
  const code = (m ? m[1] : s).trim();
  return /^[A-Za-z0-9_-]{10,100}$/.test(code) ? code : null;
}

/** Cuvintele urmărite, unul pe rând sau despărțite prin virgulă; fără dubluri, cu litere mici. */
export function parseWatch(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(/[\n,;]+/)) {
    const w = raw.trim().replace(/\s+/g, " ").toLocaleLowerCase("ro-RO").slice(0, 80);
    if (w) seen.add(w);
  }
  return [...seen].slice(0, MAX_WATCH);
}

/* ---------- Cheia contului de serviciu ---------- */

export const ServiceAccount = z.object({
  client_email: z.string().email(),
  private_key: z.string().includes("PRIVATE KEY"),
  project_id: z.string().optional(),
});
export type ServiceAccount = z.infer<typeof ServiceAccount>;

function boxKey() {
  return createHash("sha256").update(`${process.env.BETTER_AUTH_SECRET ?? "local-dev"}:seo-search-console`).digest();
}
export function sealCredentials(json: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", boxKey(), iv);
  const body = Buffer.concat([c.update(json, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}
function openCredentials(sealed: string): string | null {
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", boxKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** JSON-ul cheii: textul lipit sau în base64 (cum se pune mai ușor în Vercel). */
export function parseServiceAccount(text: string | null | undefined): ServiceAccount | null {
  if (!text?.trim()) return null;
  const t = text.trim();
  for (const candidate of [t, t.startsWith("{") ? "" : Buffer.from(t, "base64").toString("utf8")]) {
    if (!candidate) continue;
    try {
      const parsed = ServiceAccount.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
    } catch { /* încercăm forma următoare */ }
  }
  return null;
}

/** Cheia folosită: cea din Vercel are întâietate; altfel cea lipită în panou. */
export function activeServiceAccount(s: SeoSettings): { account: ServiceAccount; source: "vercel" | "panou" } | null {
  const fromEnv = parseServiceAccount(process.env.GSC_SERVICE_ACCOUNT_JSON);
  if (fromEnv) return { account: fromEnv, source: "vercel" };
  const fromDb = s.credentials ? parseServiceAccount(openCredentials(s.credentials)) : null;
  return fromDb ? { account: fromDb, source: "panou" } : null;
}

/* ---------- Google: token și cereri ---------- */

const SCOPE = "https://www.googleapis.com/auth/webmasters";
const tokens = new Map<string, { token: string; exp: number }>();
const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

async function accessToken(sa: ServiceAccount): Promise<string> {
  const cached = tokens.get(sa.client_email);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.private_key.replace(/\\n/g, "\n"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claims}.${b64url(signature)}` }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(`Google nu a primit cheia: ${data.error_description ?? data.error ?? `HTTP ${res.status}`}`);
  tokens.set(sa.client_email, { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 });
  return data.access_token;
}

async function google<T>(sa: ServiceAccount, url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { authorization: `Bearer ${await accessToken(sa)}`, ...(init.body ? { "content-type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? msg; } catch { /* rămâne codul */ }
    throw new Error(msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

const WM = "https://www.googleapis.com/webmasters/v3";
const site = (siteUrl: string) => encodeURIComponent(siteUrl);

export type GscSite = { siteUrl: string; permissionLevel: string };
export async function listSites(sa: ServiceAccount): Promise<GscSite[]> {
  const r = await google<{ siteEntry?: GscSite[] }>(sa, `${WM}/sites`);
  return r.siteEntry ?? [];
}

/**
 * Proprietatea potrivită pentru domeniu: cea aleasă în panou, altfel „sc-domain:carteaneamului.ro” (toată adresa, cu www),
 * altfel cea cu https. Doar proprietăți la care contul de serviciu a primit acces.
 */
export function pickSite(sites: GscSite[], wanted: string | null, siteUrl: string): string | null {
  const ok = sites.filter((s) => s.permissionLevel !== "siteUnverifiedUser");
  if (wanted && ok.some((s) => s.siteUrl === wanted)) return wanted;
  const host = new URL(siteUrl).hostname.replace(/^www\./, "");
  return ok.find((s) => s.siteUrl === `sc-domain:${host}`)?.siteUrl
    ?? ok.find((s) => s.siteUrl.replace(/\/$/, "") === `https://${host}` || s.siteUrl.replace(/\/$/, "") === `https://www.${host}`)?.siteUrl
    ?? ok[0]?.siteUrl ?? null;
}

export type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function periods(days: number, today = new Date()) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - (days - 1));
  const prevEnd = new Date(start); prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd); prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));
  return { cur: { start: iso(start), end: iso(end) }, prev: { start: iso(prevStart), end: iso(prevEnd) } };
}

export async function searchAnalytics(sa: ServiceAccount, siteUrl: string, p: { start: string; end: string }, dimensions: ("query" | "page" | "date" | "country" | "device")[], rowLimit = 250): Promise<Row[]> {
  const r = await google<{ rows?: Row[] }>(sa, `${WM}/sites/${site(siteUrl)}/searchAnalytics/query`, {
    body: { startDate: p.start, endDate: p.end, dimensions, rowLimit, dataState: "all" },
  });
  return r.rows ?? [];
}

export type Sitemap = { path: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { type: string; submitted?: string; indexed?: string }[] };
export async function listSitemaps(sa: ServiceAccount, siteUrl: string): Promise<Sitemap[]> {
  const r = await google<{ sitemap?: Sitemap[] }>(sa, `${WM}/sites/${site(siteUrl)}/sitemaps`);
  return r.sitemap ?? [];
}
export async function submitSitemap(sa: ServiceAccount, siteUrl: string, feed: string) {
  await google(sa, `${WM}/sites/${site(siteUrl)}/sitemaps/${encodeURIComponent(feed)}`, { method: "PUT" });
}

export type Inspection = { url: string; verdict: string; coverage: string; lastCrawl: string | null; error?: string };
/** Dacă Google are pagina în index: „PASS” = indexată. Câteva pagini, deci încape lejer în limita de 2.000 pe zi. */
export async function inspectUrl(sa: ServiceAccount, siteUrl: string, url: string): Promise<Inspection> {
  try {
    const r = await google<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }>(
      sa, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { body: { inspectionUrl: url, siteUrl, languageCode: "ro" } });
    const s = r.inspectionResult?.indexStatusResult;
    return { url, verdict: s?.verdict ?? "VERDICT_UNSPECIFIED", coverage: s?.coverageState ?? "", lastCrawl: s?.lastCrawlTime ?? null };
  } catch (e) {
    return { url, verdict: "EROARE", coverage: "", lastCrawl: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Cuvintele de acum, cu locul și afișările de dinainte, ca să se vadă dacă urcă sau coboară. */
export type KeywordRow = { query: string; clicks: number; impressions: number; ctr: number; position: number; prevPosition: number | null; prevImpressions: number; isNew: boolean };
export function mergeKeywords(cur: Row[], prev: Row[]): KeywordRow[] {
  const before = new Map(prev.map((r) => [r.keys[0], r]));
  return cur.map((r) => {
    const p = before.get(r.keys[0]);
    return { query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position, prevPosition: p?.position ?? null, prevImpressions: p?.impressions ?? 0, isNew: !p };
  }).sort((a, b) => b.impressions - a.impressions || a.position - b.position);
}

/** Cuvintele urmărite găsite în căutări: potrivire exactă sau căutări care le conțin („arbore genealogic online”). */
export function matchWatched(watch: string[], rows: KeywordRow[]) {
  return watch.map((w) => {
    const exact = rows.find((r) => r.query.toLocaleLowerCase("ro-RO") === w) ?? null;
    const related = rows.filter((r) => r !== exact && r.query.toLocaleLowerCase("ro-RO").includes(w));
    return { word: w, exact, related: related.slice(0, 5), relatedCount: related.length };
  });
}

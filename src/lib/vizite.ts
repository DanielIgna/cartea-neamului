import { createHash, randomBytes } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { pageView, visitSalt } from "@/db/schema";

/**
 * Vizitele, numărate anonim, pentru Admin → Analiză (cerut de Daniel pe 13.11.2026).
 *
 * Fără cookie-uri, fără nimic ținut în browser și fără scripturi de la alte firme: browserul spune doar ce pagină s-a deschis și
 * de unde a venit omul (src/components/VisitBeacon.tsx). Vizitatorul devine o amprentă scurtă din IP + browser + o „sare” a zilei;
 * sarea de ieri se șterge, așa că amprentele nu mai pot fi refăcute și nu se pot lega de un om sau de o zi cu alta (ca la Plausible).
 * Adresele private (arbori, persoane, coduri de cadou) se păstrează doar până la primul cuvânt. Totul se șterge după 13 luni.
 */

const TZ = "Europe/Bucharest";
/** Partea din față a adresei care e privată: din „/arbore/<id>/persoana/<id>” rămâne doar „/arbore/…”. */
const PRIVATE_FIRST = new Set(["arbore", "a", "invitatie", "mesaje", "datele-mele", "cadou", "plata", "intrare", "problema", "securitate", "arhiva", "admin", "api", "parteneri"]);
const PRIVATE_KEEP = new Set(["/parteneri"]);

export function normalizePath(raw: string): string | null {
  let p = raw.split(/[?#]/)[0] || "/";
  if (!p.startsWith("/")) return null;
  try { p = decodeURIComponent(p); } catch { /* rămâne cum e */ }
  p = p.toLowerCase().replace(/\/+$/, "") || "/";
  if (p === "/") return "/";
  const parts = p.split("/").filter(Boolean);
  const first = parts[0];
  if (PRIVATE_KEEP.has(p)) return p;
  if (PRIVATE_FIRST.has(first)) return parts.length > 1 ? `/${first}/…` : `/${first}`;
  // Restul (paginile publice): cel mult 3 bucăți, doar litere, cifre și liniuțe.
  const clean = parts.slice(0, 3).map((s) => s.replace(/[^a-z0-9ăâîșțşţ-]/g, "").slice(0, 60)).filter(Boolean);
  return clean.length ? `/${clean.join("/")}${parts.length > 3 ? "/…" : ""}` : "/";
}

const SEARCH = [["google.", "google"], ["bing.", "bing"], ["duckduckgo.", "duckduckgo"], ["yahoo.", "yahoo"], ["yandex.", "yandex"], ["ecosia.", "ecosia"], ["search.brave", "brave"]] as const;
const SOCIAL = [["facebook.", "facebook"], ["fb.", "facebook"], ["fb.me", "facebook"], ["instagram.", "instagram"], ["whatsapp.", "whatsapp"], ["wa.me", "whatsapp"],
  ["t.co", "x"], ["twitter.", "x"], ["x.com", "x"], ["youtube.", "youtube"], ["tiktok.", "tiktok"], ["linkedin.", "linkedin"], ["lnkd.in", "linkedin"],
  ["t.me", "telegram"], ["telegram.", "telegram"], ["pinterest.", "pinterest"], ["reddit.", "reddit"], ["chatgpt.", "chatgpt"], ["perplexity.", "perplexity"],
  ["mail.", "email"], ["outlook.", "email"]] as const;
/** Motoarele de căutare (pentru SEO: trafic „organic”). */
export const SEARCH_SOURCES = new Set(SEARCH.map(([, n]) => n as string));

/** De unde a venit omul: utm_source dacă linkul îl are, altfel după site-ul din care a apăsat; nimic = „direct”. */
export function sourceOf(refHost: string | null, utmSource: string | null): string {
  const u = utmSource?.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  if (u) {
    if (u === "fb" || u.startsWith("facebook")) return "facebook";
    if (u === "wa" || u.startsWith("whatsapp")) return "whatsapp";
    if (u === "ig" || u.startsWith("instagram")) return "instagram";
    return u;
  }
  if (!refHost) return "direct";
  const h = refHost.replace(/^www\./, "");
  for (const [k, n] of SEARCH) if (h.startsWith(k) || h.includes(`.${k}`)) return n;
  for (const [k, n] of SOCIAL) if (h === k || h.startsWith(k) || h.includes(`.${k}`) || h.endsWith(`.${k}`)) return n;
  if (h.includes("android-app") || h.includes("com.whatsapp")) return "whatsapp";
  return h.slice(0, 60);
}

export function refHostOf(ref: string | null | undefined, ownHost: string | null): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    const h = u.hostname.toLowerCase();
    const own = (ownHost ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
    if (!h || h.replace(/^www\./, "") === own || h.endsWith("carteaneamului.ro") || h.endsWith(".vercel.app")) return null;
    return u.protocol === "android-app:" ? h : h;
  } catch { return null; }
}

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp\/|embedly|vercel|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i;
export const isBot = (ua: string | null) => !ua || BOT.test(ua);

export function deviceOf(ua: string, width: number | null): "telefon" | "tabletă" | "calculator" {
  if (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tabletă";
  if (/mobi|iphone|ipod|android.+mobile|windows phone/i.test(ua)) return "telefon";
  if (width && width < 700) return "telefon";
  return "calculator";
}

/** Ziua și ora din România pentru un moment. */
export function localDayHour(d = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

let saltCache: { day: string; salt: string } | null = null;
/** Sarea zilei: făcută o singură dată pe zi, la întâmplare; cele mai vechi de azi se șterg. */
async function saltOf(db: Db, day: string) {
  if (saltCache?.day === day) return saltCache.salt;
  await db.insert(visitSalt).values({ day, salt: randomBytes(24).toString("hex") }).onConflictDoNothing();
  const r = await db.execute(sql`select salt from visit_salt where day = ${day}`);
  const salt = String((r.rows?.[0] as { salt?: string } | undefined)?.salt ?? "");
  await db.delete(visitSalt).where(lt(visitSalt.day, day)).catch(() => {});
  saltCache = { day, salt };
  return salt;
}

export type Visit = {
  path: string; ref?: string | null; utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null;
  width?: number | null; lang?: string | null;
};

const clip = (v: string | null | undefined, n: number) => {
  const s = v?.toLowerCase().replace(/[^a-z0-9ăâîșț._ -]/g, "").trim().slice(0, n);
  return s || null;
};

/** Orașul din antetul Vercel („Cluj-Napoca”, scris codat în adresă): doar litere, spații, liniuțe și puncte, cel mult 60. */
export function cityOf(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let c = raw;
  try { c = decodeURIComponent(raw); } catch { /* rămâne cum e */ }
  c = c.normalize("NFC").replace(/[^\p{L}\p{M} .'’-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return c || null;
}

/** Ține minte o pagină deschisă. Întoarce false când n-a numărat (robot, adresă ciudată). */
export async function recordVisit(db: Db, v: Visit, ctx: {
  ip: string | null; ua: string | null; host: string | null; country: string | null; region?: string | null; city?: string | null; logged: boolean;
}) {
  if (isBot(ctx.ua)) return false;
  const path = normalizePath(v.path);
  if (!path || path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/pub")) return false;
  const now = new Date();
  const { day, hour } = localDayHour(now);
  const salt = await saltOf(db, day);
  const visitor = createHash("sha256").update(`${salt}|${ctx.ip ?? ""}|${ctx.ua}|${(ctx.host ?? "").replace(/^www\./, "")}`).digest("hex").slice(0, 16);
  const refHost = refHostOf(v.ref, ctx.host);
  await db.insert(pageView).values({
    day, hour, visitor, path,
    source: sourceOf(refHost, v.utmSource ?? null),
    referrer: refHost,
    medium: clip(v.utmMedium, 40),
    campaign: clip(v.utmCampaign, 60),
    device: deviceOf(ctx.ua ?? "", v.width ?? null),
    country: ctx.country && /^[A-Z]{2}$/.test(ctx.country) ? ctx.country : null,
    region: ctx.country && ctx.region && /^[A-Z0-9]{1,3}$/.test(ctx.region) ? ctx.region : null,
    city: ctx.country ? cityOf(ctx.city) : null,
    lang: v.lang && /^[a-z]{2}(-[A-Z]{2})?$/.test(v.lang) ? v.lang : null,
    logged: ctx.logged,
  });
  return true;
}

/** Curățenie: vizitele mai vechi de 13 luni pleacă. */
export async function cleanupVisits(db: Db) {
  await db.execute(sql`delete from page_view where day < (current_date - interval '13 months')`);
}

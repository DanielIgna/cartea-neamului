import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { SITE_URL } from "@/lib/site-url";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { versionEntries } from "@/lib/seo/versiuni";

/**
 * IndexNow (planul SEO, 18.11.2026): anunță Bing, Yandex, Seznam și Naver, dintr-o singură cerere, că s-au schimbat pagini.
 * Google nu folosește IndexNow; la Google rămâne sitemap-ul și „De cerut indexare”.
 *
 * - Cheia stă în variabila INDEXNOW_KEY (Vercel). Fără ea nu se trimite nimic. Fișierul cheii e servit la /<cheie>.txt
 *   (next.config.ts → rewrite spre /api/indexnow/cheie).
 * - Ce se trimite: paginile din sitemap a căror versiune (amprenta din src/data/seo-versiuni.json sau data publicării din motor)
 *   diferă de ultima trimisă, cel mult o dată pe zi pentru aceeași adresă.
 * - Jurnalul (ultimele 30 de trimiteri) și versiunile trimise stau în app_setting („indexnow”).
 * - Rulează zilnic din /api/cron/autonomie și la cerere din Admin → SEO → Sitemap.
 */
const KEY = "indexnow";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** Limita IndexNow pe o cerere. */
export const MAX_URLS = 10_000;

export function indexNowKey(env: Record<string, string | undefined> = process.env): string | null {
  const k = env.INDEXNOW_KEY?.trim();
  return k && /^[a-zA-Z0-9-]{8,128}$/.test(k) ? k : null;
}

export type IndexNowLog = { at: string; count: number; status: number | null; error?: string; by: string };
export type IndexNowState = { sent: Record<string, string>; log: IndexNowLog[] };

export async function indexNowState(db: Pick<Db, "select">): Promise<IndexNowState> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const v = (row?.value ?? {}) as Partial<IndexNowState>;
  return { sent: v.sent && typeof v.sent === "object" ? v.sent : {}, log: Array.isArray(v.log) ? v.log.slice(0, 30) : [] };
}

/** Versiunea fiecărei pagini din sitemap: amprenta din seo-versiuni.json sau, pentru paginile din motor, data lor. */
export function currentVersions(published: Map<string, Date> = new Map()): Map<string, string> {
  const v = versionEntries();
  const out = new Map<string, string>();
  for (const g of sitemapGroups(published)) for (const u of g.urls) out.set(u.path, v[u.path]?.split(" ")[0] ?? u.lastModified.toISOString().slice(0, 10));
  return out;
}

/** Ce trebuie anunțat azi: versiune nouă și netrimisă azi. `sent[path]` = „versiune zi”. */
export function pendingPaths(versions: Map<string, string>, sent: Record<string, string>, today: string): string[] {
  const out: string[] = [];
  for (const [path, ver] of versions) {
    const [prevVer, prevDay] = (sent[path] ?? "").split(" ");
    if (prevVer === ver || prevDay === today) continue;
    out.push(path);
  }
  return out.sort().slice(0, MAX_URLS);
}

export const indexNowBody = (key: string, paths: string[], site = SITE_URL) => {
  const host = new URL(site).host;
  return { host, key, keyLocation: `${site}/${key}.txt`, urlList: paths.map((p) => `${site}${p === "/" ? "/" : p}`) };
};

const todayRo = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(now);

/** Trimite paginile schimbate la IndexNow și scrie jurnalul. Întoarce ce s-a întâmplat, pentru Admin și cron. */
export async function runIndexNow(db: Pick<Db, "select" | "insert">, o: { by: string; published?: Map<string, Date>; now?: Date; fetcher?: typeof fetch } = { by: "ceas" }) {
  const key = indexNowKey();
  if (!key) return { state: "fara-cheie" as const, count: 0 };
  const now = o.now ?? new Date();
  const today = todayRo(now);
  const st = await indexNowState(db);
  const versions = currentVersions(o.published);
  const paths = pendingPaths(versions, st.sent, today);
  if (!paths.length) return { state: "nimic-nou" as const, count: 0 };
  let status: number | null = null, error: string | undefined;
  try {
    const r = await (o.fetcher ?? fetch)(INDEXNOW_ENDPOINT, { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(indexNowBody(key, paths)) });
    status = r.status;
    if (!r.ok) error = `IndexNow a răspuns ${r.status}`;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const sent = { ...st.sent };
  if (!error) for (const p of paths) sent[p] = `${versions.get(p)} ${today}`;
  const value: IndexNowState = { sent, log: [{ at: now.toISOString(), count: paths.length, status, ...(error ? { error } : {}), by: o.by }, ...st.log].slice(0, 30) };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: null, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  return error ? { state: "eroare" as const, count: paths.length, error } : { state: "trimis" as const, count: paths.length };
}

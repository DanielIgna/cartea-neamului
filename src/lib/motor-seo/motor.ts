import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, seoQueue } from "@/db/schema";
import { getCounty, type County } from "@/lib/continut/localitati";
import { areaPublicStat } from "@/lib/continut/localitati-statistici";
import { uatThin } from "@/lib/continut/prag";
import { getUat, loadUats, neighbours, uatPath, type Uat } from "@/lib/continut/uat";
import { uatPageText } from "@/lib/continut/uat-text";
import { SITE_URL } from "@/lib/site-url";
import { activeServiceAccount, inspectUrl, listSites, pickSite, seoSettings, submitSitemap } from "@/lib/seo";
import { judge, lineFrequency, shingles, type Quality } from "./calitate";
import { fetchWiki, hasFacts, wikiLines, type WikiFacts } from "./wikipedia";

/**
 * Motorul de publicare SEO (Daniel, 14.11.2026). Paginile publice sunt făcute din date; motorul hotărăște CÂND intră fiecare în
 * Google: ia zilnic următoarele pagini din coadă (50 la început), adună datele publice în plus (Wikipedia, rezumat de noi, cu
 * atribuire; familiile din arbori, doar totaluri peste prag), trece pagina prin controlul de calitate (src/lib/motor-seo/calitate.ts)
 * și o publică (intră în sitemap, fără „noindex”) sau o lasă „noindex” cu motivul. Ritmul crește până la 200 pe zi doar cât timp
 * Google indexează cel puțin 70% din paginile verificate și scade la jumătate sub 50%.
 * Acum în coadă: comunele, orașele și municipiile. Numele și diaspora vin în etapele următoare, pe aceeași coadă.
 */

export type EngineSettings = { perDay: number; min: number; max: number; autoRamp: boolean; lastRamp: string | null; lastRate: number | null };
export const ENGINE_KEY = "motor-seo";
export const DEFAULTS: EngineSettings = { perDay: 50, min: 20, max: 200, autoRamp: true, lastRamp: null, lastRate: null };
export const STATUS_LABEL: Record<string, string> = { asteptare: "în așteptare", generat: "generată", publicat: "publicată", noindex: "noindex" };

export async function engineSettings(db: Pick<Db, "select">): Promise<EngineSettings> {
  const [r] = await db.select().from(appSetting).where(eq(appSetting.key, ENGINE_KEY)).limit(1);
  const v = (r?.value ?? {}) as Partial<EngineSettings>;
  const n = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? Math.round(x) : d);
  const max = Math.min(500, Math.max(1, n(v.max, DEFAULTS.max)));
  const min = Math.min(max, Math.max(1, n(v.min, DEFAULTS.min)));
  return { perDay: Math.min(max, Math.max(min, n(v.perDay, DEFAULTS.perDay))), min, max, autoRamp: v.autoRamp !== false,
    lastRamp: typeof v.lastRamp === "string" ? v.lastRamp : null, lastRate: typeof v.lastRate === "number" ? v.lastRate : null };
}
export async function saveEngineSettings(db: Pick<Db, "insert">, s: EngineSettings, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: ENGINE_KEY, value: s, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: s, updatedBy: by, updatedAt: now } });
}

/* ------------------------------ Coada ------------------------------ */

/** Pune în coadă localitățile care lipsesc: orașele publicate de la început, comunele în așteptare, cele subțiri noindex. */
export async function syncQueue(db: Db, now = new Date()) {
  const have = new Set((await db.select({ path: seoQueue.path }).from(seoQueue).where(eq(seoQueue.kind, "localitate"))).map((r) => r.path));
  const add = loadUats().filter((u) => !have.has(uatPath(u))).map((u) => {
    const thin = uatThin(u);
    const town = u.kind !== "c";
    return { kind: "localitate", path: uatPath(u), priority: (town ? 10_000_000 : 0) + u.pop, status: town ? "publicat" : thin ? "noindex" : "asteptare",
      reasons: thin, publishedAt: town ? now : null, lastmod: town ? now : null };
  });
  for (let i = 0; i < add.length; i += 500) await db.insert(seoQueue).values(add.slice(i, i + 500)).onConflictDoNothing();
  return add.length;
}

const uatOfPath = (path: string) => { const [, , c, s] = path.split("/"); return getUat(c, s); };

/* ------------------------------ Textul și calitatea ------------------------------ */

let corpus: { freq: Map<string, number>; sh: Map<Uat, Set<string>> } | null = null;
/** Textul de bază al tuturor comunelor (fără Wikipedia), ca să știm ce propoziții sunt comune și cât seamănă vecinii. */
function baseCorpus() {
  if (corpus) return corpus;
  const all = loadUats();
  const texts = all.map((u) => uatPageText(u, getCounty(u.countySlug)!).lines);
  corpus = { freq: lineFrequency(texts), sh: new Map(all.map((u, i) => [u, shingles(texts[i])])) };
  return corpus;
}

export type PageData = { wiki?: WikiFacts | null; wikiError?: string };

/** Textul complet al paginii (ca pe site) și rezultatul controlului. */
export function evaluate(u: Uat, c: County, data: PageData, stat: Awaited<ReturnType<typeof areaPublicStat>> = null): { quality: Quality; lines: string[]; facts: string[] } {
  const base = uatPageText(u, c, stat);
  const extra = data.wiki && hasFacts(data.wiki) ? wikiLines(u, data.wiki) : { lines: [], facts: [] };
  const lines = [...base.lines, ...extra.lines];
  const facts = [...base.facts, ...extra.facts];
  const { freq, sh } = baseCorpus();
  const others = neighbours(u, 12).map((x) => ({ path: uatPath(x.u), sh: sh.get(x.u)! })).filter((o) => o.sh);
  return { quality: judge({ lines, facts }, freq, others), lines, facts };
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

export type BatchItem = { path: string; name: string; county: string; kind: string; status: string; quality: Quality; facts: string[]; wiki: string | null; wikiError?: string };

/**
 * Un lot: următoarele `limit` comune din coadă (cele mai mari întâi) plus până la `limit` orașe încă negenerate (doar
 * îmbogățire: orașele sunt deja în Google). Cu `dryRun`, nu scrie nimic: doar arată ce s-ar publica (proba din Admin).
 */
export async function runBatch(db: Db, o: { limit: number; dryRun?: boolean; now?: Date; fetcher?: typeof fetch; paths?: string[] }): Promise<BatchItem[]> {
  const now = o.now ?? new Date();
  const pick = o.paths?.length
    ? await db.select().from(seoQueue).where(inArray(seoQueue.path, o.paths))
    : [
        ...await db.select().from(seoQueue).where(and(eq(seoQueue.kind, "localitate"), eq(seoQueue.status, "asteptare"))).orderBy(desc(seoQueue.priority)).limit(o.limit),
        ...await db.select().from(seoQueue).where(and(eq(seoQueue.kind, "localitate"), eq(seoQueue.status, "publicat"), isNull(seoQueue.generatedAt))).orderBy(desc(seoQueue.priority)).limit(o.limit),
      ];
  return (await pool(pick, 6, async (row): Promise<BatchItem | null> => {
    const u = uatOfPath(row.path);
    const c = u ? getCounty(u.countySlug) : null;
    if (!u || !c) return null;
    const data: PageData = {};
    try { data.wiki = await fetchWiki(u, c, o.fetcher); } catch (e) { data.wikiError = e instanceof Error ? e.message : String(e); }
    const stat = await areaPublicStat(db, u.area);
    const { quality, facts } = evaluate(u, c, data, stat);
    const town = u.kind !== "c";
    // O eroare de rețea la Wikipedia nu e un verdict: pagina rămâne în coadă pentru lotul următor.
    const status = data.wikiError && !town ? "asteptare" : town || quality.ok ? "publicat" : "noindex";
    if (!o.dryRun) {
      await db.update(seoQueue).set({
        data, status, words: quality.words, uniqueWords: quality.unique, facts: quality.facts, similarity: quality.similarity,
        reasons: data.wikiError ? `Wikipedia: ${data.wikiError}` : quality.reasons.join("; ") || null,
        generatedAt: data.wikiError ? null : now, lastmod: status === "publicat" ? now : row.lastmod,
        publishedAt: status === "publicat" ? (row.publishedAt ?? now) : null,
      }).where(eq(seoQueue.id, row.id));
    }
    return { path: row.path, name: u.name, county: c.name, kind: u.kind, status, quality, facts, wiki: data.wiki?.title ?? null, wikiError: data.wikiError };
  })).filter((x): x is BatchItem => !!x);
}

/* ------------------------------ Ce citesc paginile și sitemap-ul ------------------------------ */

let pubMemo: { at: number; map: Map<string, Date> } | null = null;
/** Comunele publicate (adresa → data ultimei schimbări), ținute 10 minute; fără bază, nimic (deci noindex, ca înainte). */
export async function publishedMap(db: Pick<Db, "select">, now = Date.now()): Promise<Map<string, Date>> {
  if (pubMemo && now - pubMemo.at < 600_000) return pubMemo.map;
  const map = new Map<string, Date>();
  try {
    const r = await db.select({ path: seoQueue.path, lastmod: seoQueue.lastmod }).from(seoQueue).where(and(eq(seoQueue.lang, "ro"), eq(seoQueue.status, "publicat")));
    for (const x of r) map.set(x.path, x.lastmod ?? new Date(0));
  } catch { /* fără bază (la publicare, în teste): nimic */ }
  pubMemo = { at: now, map };
  return map;
}

const dataMemo = new Map<string, { at: number; data: PageData | null }>();
/** Datele adunate de motor pentru o pagină (Wikipedia), ținute 10 minute. */
export async function pageData(db: Pick<Db, "select">, path: string, now = Date.now()): Promise<PageData | null> {
  const m = dataMemo.get(path);
  if (m && now - m.at < 600_000) return m.data;
  let data: PageData | null = null;
  try {
    const [r] = await db.select({ data: seoQueue.data }).from(seoQueue).where(and(eq(seoQueue.path, path), eq(seoQueue.lang, "ro"))).limit(1);
    data = (r?.data as PageData | null) ?? null;
  } catch { data = null; }
  if (dataMemo.size > 5000) dataMemo.clear();
  dataMemo.set(path, { at: now, data });
  return data;
}

/* ------------------------------ Indexarea și ritmul ------------------------------ */

/**
 * Verifică la Google câteva pagini publicate de cel puțin 7 zile (cel mult `n` pe zi, din limita de 2.000) și ajustează ritmul:
 * sub 50% indexate → jumătate (și alertă în Admin); peste 70%, din cel puțin 20 verificate → +25 pe zi, până la maxim.
 */
export async function checkIndexing(db: Db, now = new Date(), n = 25) {
  const s = await seoSettings(db);
  const sa = activeServiceAccount(s);
  if (!sa) return { checked: 0, rate: null as number | null, note: "Search Console nu e legat" };
  const site = pickSite(await listSites(sa.account), s.siteUrl, SITE_URL);
  if (!site) return { checked: 0, rate: null, note: "contul de serviciu nu are acces la proprietate" };
  const week = new Date(now.getTime() - 7 * 86_400_000), twoWeeks = new Date(now.getTime() - 14 * 86_400_000);
  const due = await db.select({ id: seoQueue.id, path: seoQueue.path }).from(seoQueue)
    .where(and(eq(seoQueue.status, "publicat"), lt(seoQueue.publishedAt, week), or(isNull(seoQueue.inspectedAt), lt(seoQueue.inspectedAt, twoWeeks))))
    .orderBy(asc(seoQueue.inspectedAt)).limit(n);
  for (const d of due) {
    const r = await inspectUrl(sa.account, site, `${SITE_URL}${d.path}`);
    if (r.verdict === "EROARE") continue;
    await db.update(seoQueue).set({ indexed: r.verdict === "PASS" ? "da" : "nu", inspectedAt: now }).where(eq(seoQueue.id, d.id));
  }
  const month = new Date(now.getTime() - 30 * 86_400_000);
  const [agg] = await db.select({ yes: sql<number>`count(*) filter (where ${seoQueue.indexed} = 'da')::int`, total: sql<number>`count(*) filter (where ${seoQueue.indexed} is not null)::int` })
    .from(seoQueue).where(lt(sql`${month}`, seoQueue.inspectedAt));
  const total = Number(agg?.total ?? 0), yes = Number(agg?.yes ?? 0);
  return { checked: due.length, rate: total ? Math.round((yes / total) * 100) : null, sample: total, note: `${due.length} pagini verificate la Google` };
}

/** Noul ritm după rata de indexare (funcție pură, testată). */
export function nextPace(s: EngineSettings, rate: number | null, sample: number): { perDay: number; why: string | null } {
  if (!s.autoRamp || rate == null || sample < 20) return { perDay: s.perDay, why: null };
  if (rate < 50) return { perDay: Math.max(s.min, Math.floor(s.perDay / 2)), why: `doar ${rate}% din paginile verificate sunt în Google: ritmul scade la jumătate` };
  if (rate >= 70 && s.perDay < s.max) return { perDay: Math.min(s.max, s.perDay + 25), why: `${rate}% din paginile verificate sunt în Google: ritmul crește cu 25 pe zi` };
  return { perDay: s.perDay, why: null };
}

/** Rularea zilnică (Admin → Autonomie → „Motorul SEO”): coada, lotul, sitemap-ul trimis la Google, verificarea și ritmul. */
export async function runDaily(db: Db, now = new Date()) {
  const s = await engineSettings(db);
  const added = await syncQueue(db, now);
  const items = await runBatch(db, { limit: s.perDay, now });
  const published = items.filter((i) => i.status === "publicat" && i.kind === "c").length;
  const held = items.filter((i) => i.status === "noindex").length;
  const waiting = items.filter((i) => i.status === "asteptare").length;
  pubMemo = null;
  let sitemapNote = "";
  if (published) {
    try {
      const ss = await seoSettings(db);
      const sa = activeServiceAccount(ss);
      const site = sa ? pickSite(await listSites(sa.account), ss.siteUrl, SITE_URL) : null;
      if (sa && site) { await submitSitemap(sa.account, site, `${SITE_URL}/sitemap.xml`); sitemapNote = " · sitemap trimis la Google"; }
    } catch (e) { sitemapNote = ` · sitemap netrimis: ${e instanceof Error ? e.message.slice(0, 80) : e}`; }
  }
  const idx = await checkIndexing(db, now).catch((e) => ({ checked: 0, rate: null as number | null, sample: 0, note: e instanceof Error ? e.message : String(e) }));
  const pace = nextPace(s, idx.rate, (idx as { sample?: number }).sample ?? 0);
  if (pace.perDay !== s.perDay || idx.rate != null) await saveEngineSettings(db, { ...s, perDay: pace.perDay, lastRate: idx.rate, lastRamp: pace.why ?? s.lastRamp }, null, now);
  return { added, published, held, waiting, enriched: items.filter((i) => i.kind !== "c").length, rate: idx.rate, pace, note: `${published} comune publicate, ${held} ținute noindex${waiting ? `, ${waiting} amânate (Wikipedia)` : ""}${sitemapNote} · ${idx.note}` };
}

/* ------------------------------ Pentru Admin ------------------------------ */

export async function engineStats(db: Db) {
  const byStatus = await db.select({ kind: seoQueue.kind, status: seoQueue.status, n: sql<number>`count(*)::int` }).from(seoQueue).groupBy(seoQueue.kind, seoQueue.status);
  const perDay = await db.select({ day: sql<string>`to_char(${seoQueue.publishedAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` }).from(seoQueue)
    .where(and(eq(seoQueue.status, "publicat"), sql`${seoQueue.publishedAt} > now() - interval '30 days'`)).groupBy(sql`1`).orderBy(sql`1`);
  const indexed = await db.select({ kind: seoQueue.kind, yes: sql<number>`count(*) filter (where ${seoQueue.indexed} = 'da')::int`, no: sql<number>`count(*) filter (where ${seoQueue.indexed} = 'nu')::int` })
    .from(seoQueue).groupBy(seoQueue.kind);
  const recent = await db.select().from(seoQueue).where(sql`${seoQueue.generatedAt} is not null`).orderBy(desc(seoQueue.generatedAt)).limit(30);
  const next = await db.select({ path: seoQueue.path, priority: seoQueue.priority }).from(seoQueue).where(eq(seoQueue.status, "asteptare")).orderBy(desc(seoQueue.priority)).limit(10);
  return { byStatus, perDay, indexed, recent, next };
}

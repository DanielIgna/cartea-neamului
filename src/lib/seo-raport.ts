import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { clusterOf } from "./seo-clustere";
import { pathOfUrl, type GscSnapshot, type KeywordRow } from "./seo";
import { matchTarget, TARGET_KEYWORDS } from "./seo-cuvinte";

/**
 * Raportul SEO săptămânal (Etapa 5, Daniel, 17.11.2026): ultimele 7 zile din Search Console față de cele 7 dinainte, pe scurt,
 * cu ce s-a mișcat și ce e de făcut. Admin → SEO → Raport săptămânal îl arată; ceasul zilnic (lunea) și prima deschidere din
 * săptămână păstrează cifrele principale în app_setting („seo_raport_istoric”, ultimele 26 de săptămâni), ca să se vadă drumul.
 */
export type WeekTotals = { clicks: number; impressions: number; ctr: number; position: number | null };
export type Mover = { query: string; position: number; before: number; impressions: number; clicks: number };
export type SectionRow = { key: string; label: string; clicks: number; impressions: number; pages: number };
export type WeeklyReport = {
  cur: WeekTotals; prev: WeekTotals;
  topQueries: KeywordRow[];
  up: Mover[]; down: Mover[]; fresh: KeywordRow[];
  sections: SectionRow[];
  targets: { total: number; top3: number; top10: number; seen: number; missingPages: string[] };
  todo: string[];
};
export type HistoryRow = { week: string; clicks: number; impressions: number; position: number | null; top10: number; published: number };

const totals = (r: { clicks: number; impressions: number; ctr: number; position: number } | null): WeekTotals =>
  r ? { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position } : { clicks: 0, impressions: 0, ctr: 0, position: null };

/** Raportul din „poza” Search Console pe 7 zile. `known` = căile paginilor pe care le are site-ul (din auditul SEO). */
export function buildWeeklyReport(gsc: GscSnapshot, known: Set<string>): WeeklyReport {
  const q = gsc.queries;
  const moved = q.filter((k) => k.prevPosition != null && k.impressions >= 5)
    .map((k): Mover => ({ query: k.query, position: k.position, before: k.prevPosition!, impressions: k.impressions, clicks: k.clicks }));
  const up = moved.filter((m) => m.before - m.position >= 1).sort((a, b) => (b.before - b.position) - (a.before - a.position)).slice(0, 10);
  const down = moved.filter((m) => m.position - m.before >= 1).sort((a, b) => (b.position - b.before) - (a.position - a.before)).slice(0, 10);
  const fresh = q.filter((k) => k.isNew).sort((a, b) => b.impressions - a.impressions).slice(0, 10);

  const bySec = new Map<string, SectionRow>();
  for (const r of gsc.pages) {
    const c = clusterOf(pathOfUrl(r.keys[0]));
    const row = bySec.get(c.key) ?? { key: c.key, label: c.label, clicks: 0, impressions: 0, pages: 0 };
    row.clicks += r.clicks; row.impressions += r.impressions; row.pages += 1;
    bySec.set(c.key, row);
  }
  const sections = [...bySec.values()].sort((a, b) => b.impressions - a.impressions);

  let top3 = 0, top10 = 0, seen = 0;
  for (const k of TARGET_KEYWORDS) {
    const m = matchTarget(k, q).best;
    if (!m) continue;
    seen += 1;
    if (m.position <= 10) top10 += 1;
    if (m.position <= 3) top3 += 1;
  }
  const missingPages = [...new Set(TARGET_KEYWORDS.filter((k) => !known.has(k.path)).map((k) => k.path))];

  // Ce e de făcut săptămâna asta: căutările aproape de prima pagină, paginile văzute dar neapăsate, paginile lipsă.
  const todo: string[] = [];
  const near = q.filter((k) => k.position > 3 && k.position <= 15 && k.impressions >= 20).slice(0, 5);
  for (const k of near) todo.push(`„${k.query}” e pe locul ${k.position.toFixed(1)} cu ${k.impressions} afișări: îmbogățește pagina care răspunde și pune legături spre ea din ghiduri.`);
  const lowCtr = gsc.pages.filter((r) => r.impressions >= 100 && r.ctr < 0.01).sort((a, b) => b.impressions - a.impressions).slice(0, 3);
  for (const r of lowCtr) todo.push(`${pathOfUrl(r.keys[0])} apare des (${r.impressions} afișări) dar e apăsată rar: scrie un titlu și o descriere mai clare.`);
  for (const p of missingPages.slice(0, 3)) todo.push(`Cuvântul țintă pentru ${p} nu are încă pagină: scrie-o sau leagă cuvântul de o pagină existentă.`);

  return {
    cur: totals(gsc.totals.cur), prev: totals(gsc.totals.prev),
    topQueries: [...q].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 15),
    up, down, fresh, sections, targets: { total: TARGET_KEYWORDS.length, top3, top10, seen, missingPages }, todo,
  };
}

/** Lunea săptămânii unei zile, ca „2026-11-16”: cheia rândului din istoric. */
export function weekKey(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

const KEY = "seo_raport_istoric";
const KEEP = 26;

export async function reportHistory(db: Db): Promise<HistoryRow[]> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const v = row?.value as { rows?: HistoryRow[] } | undefined;
  return Array.isArray(v?.rows) ? v!.rows : [];
}

/** Păstrează cifrele săptămânii (o dată pe săptămână; a doua oară în aceeași săptămână doar le actualizează). */
export async function saveWeek(db: Db, r: WeeklyReport, published: number, now = new Date()) {
  const week = weekKey(now);
  const rows = (await reportHistory(db)).filter((x) => x.week !== week);
  rows.push({ week, clicks: r.cur.clicks, impressions: r.cur.impressions, position: r.cur.position, top10: r.targets.top10, published });
  rows.sort((a, b) => a.week.localeCompare(b.week));
  const value = { rows: rows.slice(-KEEP) };
  await db.insert(appSetting).values({ key: KEY, value, updatedAt: now }).onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  return value.rows;
}

import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { loadCollection } from "@/lib/continut/colectii";
import { images } from "@/lib/continut/markdown";
import { splitLocalePath } from "@/i18n/locales";
import { KIN_PAGES, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { activeServiceAccount, gscByPath, listSites, pathOfUrl, periods, pickSite, searchAnalytics, type GscSnapshot, type Row, type SeoSettings } from "@/lib/seo";

/**
 * Admin → SEO → Imagini (Daniel, 26.11.2026: „buton de măsurare cine dă click pe imagine”). Trei întrebări:
 *  1. Cât aduce Google Imagini (Search Console, tipul „image”), față de perioada de dinainte.
 *  2. Paginile cu desene față de cele fără, în căutarea obișnuită: afișări, clicuri, CTR, loc mediu, acum și înainte.
 *  3. Cine dă clic pe un desen pe site (numărat anonim, ca butoanele de început; rândurile `conversion` cu kind „imagine”).
 */

export type ImagePage = { path: string; images: { src: string; alt: string }[] };

/** Paginile care au desene: ghiduri și glosar (din markdown) și paginile de rudenie (câmpul `image`). */
export function pagesWithImages(): ImagePage[] {
  const out: ImagePage[] = [];
  for (const c of ["ghid", "glosar"] as const) for (const e of loadCollection(c)) {
    const im = images(e.blocks);
    if (im.length) out.push({ path: e.path, images: im.map((x) => ({ src: x.src, alt: x.alt })) });
  }
  for (const p of KIN_PAGES) if (p.image) out.push({ path: kinPagePath(p), images: [{ src: p.image.src, alt: p.image.alt }] });
  return out;
}

export type GroupStats = { pages: number; seen: number; impressions: number; clicks: number; ctr: number; position: number | null; prevImpressions: number; prevClicks: number; prevCtr: number };

/**
 * Paginile cu desene față de celelalte, în căutarea obișnuită. Doar paginile românești (fără /en/, /fr/…), ca să comparăm la fel
 * cu la fel. Locul mediu e ponderat cu afișările. `paths` = paginile cu desene.
 */
export function compareGroups(cur: Row[], prev: Row[], paths: Set<string>, isRo: (p: string) => boolean = roPath): { with: GroupStats; without: GroupStats } {
  const agg = (rows: Row[]) => {
    const m = new Map<string, { i: number; c: number; pw: number }>();
    for (const r of rows) {
      const p = pathOfUrl(r.keys[0]);
      if (!isRo(p)) continue;
      const o = m.get(p) ?? { i: 0, c: 0, pw: 0 };
      o.i += r.impressions; o.c += r.clicks; o.pw += r.position * r.impressions;
      m.set(p, o);
    }
    return m;
  };
  const now = agg(cur), before = agg(prev);
  const group = (inGroup: boolean): GroupStats => {
    let seen = 0, i = 0, c = 0, pw = 0, pi = 0, pc = 0;
    for (const [p, o] of now) if (paths.has(p) === inGroup) { seen++; i += o.i; c += o.c; pw += o.pw; }
    for (const [p, o] of before) if (paths.has(p) === inGroup) { pi += o.i; pc += o.c; }
    return { pages: inGroup ? paths.size : 0, seen, impressions: i, clicks: c, ctr: i ? c / i : 0, position: i ? pw / i : null, prevImpressions: pi, prevClicks: pc, prevCtr: pi ? pc / pi : 0 };
  };
  return { with: group(true), without: group(false) };
}

const roPath = (p: string) => splitLocalePath(p).locale === null;

export type ImageReport = {
  state: "fara-cheie" | "fara-acces" | "eroare" | "legat"; error: string | null; days: number;
  /** Google Imagini: totalul acum și înainte, paginile și căutările. */
  images: { cur: Row | null; prev: Row | null; pages: Row[]; queries: Row[] };
  /** Căutarea obișnuită, pe pagini, acum și înainte (pentru comparația cu și fără desene). */
  web: { cur: Row[]; prev: Row[] };
  at: number;
};

const cache = new Map<string, ImageReport>();

export async function imageReport(s: SeoSettings, siteUrl: string, days: number, snap?: GscSnapshot): Promise<ImageReport> {
  const empty: ImageReport = { state: "fara-cheie", error: null, days, images: { cur: null, prev: null, pages: [], queries: [] }, web: { cur: [], prev: [] }, at: Date.now() };
  const key = activeServiceAccount(s);
  if (!key) return empty;
  const ck = `${key.account.client_email}|${s.siteUrl ?? ""}|${days}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit;
  try {
    const site = snap?.site ?? pickSite(await listSites(key.account), s.siteUrl ?? null, siteUrl);
    if (!site) return { ...empty, state: "fara-acces" };
    const p = periods(days);
    const sa = key.account;
    const [iCur, iPrev, iPages, iQueries, wPrev] = await Promise.all([
      searchAnalytics(sa, site, p.cur, [], 1, "image"),
      searchAnalytics(sa, site, p.prev, [], 1, "image"),
      searchAnalytics(sa, site, p.cur, ["page"], 500, "image"),
      searchAnalytics(sa, site, p.cur, ["query"], 200, "image"),
      searchAnalytics(sa, site, p.prev, ["page"], 5000),
    ]);
    const wCur = snap?.state === "legat" && snap.days === days ? snap.pages : await searchAnalytics(sa, site, p.cur, ["page"], 5000);
    const out: ImageReport = { ...empty, state: "legat", images: { cur: iCur[0] ?? null, prev: iPrev[0] ?? null, pages: iPages, queries: iQueries }, web: { cur: wCur, prev: wPrev } };
    cache.set(ck, out);
    return out;
  } catch (e) {
    return { ...empty, state: "eroare", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Fiecare pagină cu desene: afișări și clicuri în căutarea obișnuită și în Google Imagini, plus clicurile pe desene de pe site. */
export function perPage(list: ImagePage[], rep: ImageReport, clicks: Map<string, number>, snap?: GscSnapshot) {
  const web = snap?.state === "legat" ? gscByPath(snap) : new Map<string, { impressions: number; clicks: number; position: number }>();
  const img = new Map<string, { impressions: number; clicks: number }>();
  for (const r of rep.images.pages) {
    const p = pathOfUrl(r.keys[0]);
    const o = img.get(p) ?? { impressions: 0, clicks: 0 };
    o.impressions += r.impressions; o.clicks += r.clicks; img.set(p, o);
  }
  return list.map((x) => ({
    ...x, web: web.get(x.path) ?? null, img: img.get(x.path) ?? null, siteClicks: clicks.get(x.path) ?? 0,
  })).sort((a, b) => (b.web?.impressions ?? 0) - (a.web?.impressions ?? 0) || a.path.localeCompare(b.path));
}

/** Clicurile pe desene de pe site, pe desen și pe pagină, în intervalul dat (zile întregi, ora României). */
export async function imageClicks(db: Db, r: { from: string; to: string }) {
  const q = (await db.execute(sql`select coalesce(label, '—') as img, coalesce(page, '—') as page, count(*) as c,
      count(*) filter (where source = 'google') as g
    from conversion where kind = 'imagine' and day between ${r.from} and ${r.to} group by 1, 2 order by 3 desc limit 200`)).rows ?? [];
  const rows = (q as { img: string; page: string; c: unknown; g: unknown }[]).map((x) => ({ img: String(x.img), page: String(x.page), clicks: Number(x.c) || 0, fromGoogle: Number(x.g) || 0 }));
  const byPage = new Map<string, number>();
  for (const x of rows) byPage.set(x.page, (byPage.get(x.page) ?? 0) + x.clicks);
  return { rows, byPage, total: rows.reduce((a, b) => a + b.clicks, 0) };
}

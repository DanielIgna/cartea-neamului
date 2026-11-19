import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import type { AuditPage } from "@/lib/seo-audit";
import type { KeywordRow, Row } from "@/lib/seo";
import { pathOfUrl } from "@/lib/seo";
import { clusterOf } from "@/lib/seo-clustere";
import { PLANNED_GUIDES, type Keyword } from "@/data/seo-keywords";
import { daysLeft, type SeasonKey } from "@/lib/seo/sezon";

/**
 * Strategul SEO (Daniel, 19.11.2026: „un sistem inteligent SEO să analizeze ce funcționează și să sugereze teme noi”).
 *
 * Citește ce spune Google (Search Console, 28 de zile) și ce are site-ul (auditul SEO, lista de cuvinte cheie) și scoate propuneri:
 * - „aproape”: căutări pe locurile 4–20 la o pagină care există: pagina se îmbogățește pentru ele (secțiune, întrebare frecventă);
 * - „titlu”: pagini văzute des, dar apăsate rar față de locul lor: titlul și descrierea se rescriu;
 * - „tema”: căutări fără pagină potrivită, grupate pe subiecte: articol nou (se scrie ca ciornă, se publică doar după aprobare);
 * - „scadere”: căutări care au coborât cel puțin 3 locuri: pagina se reîmprospătează;
 * - „plan”: rândurile încă nescrise din lista de cuvinte cheie (src/data/seo-keywords.ts), mai sus cele din sezon.
 *
 * Învață: când Daniel marchează o propunere „Făcut”, se păstrează cifrele de atunci; după 28 de zile se compară cu cele noi și se
 * notează dacă a mers. Felurile de propuneri și secțiunile care au adus rezultate urcă în listă data viitoare (rata cu netezire
 * Laplace, ca o singură reușită să nu întoarcă totul). Nimic nu se publică singur: propunerile stau în Admin → SEO → Strateg.
 * Reguli scrise de mână, fără AI și fără cifre inventate; fără Search Console rămân doar „plan” și sezonul.
 */
export type IdeaKind = "aproape" | "titlu" | "tema" | "scadere" | "plan";
export const KIND_LABEL: Record<IdeaKind, string> = {
  aproape: "Aproape de prima pagină", titlu: "Titlu de rescris", tema: "Temă nouă", scadere: "În scădere", plan: "Din planul de cuvinte",
};
export type IdeaStatus = "nou" | "acceptat" | "respins" | "facut";
export type Metrics = { clicks: number; impressions: number; position: number | null };
export type Idea = {
  id: string; kind: IdeaKind; title: string; why: string; action: string;
  /** Pagina vizată (la „tema” și „plan”: adresa propusă sau pagina din plan). */
  path: string | null; cluster: string;
  queries: string[]; impressions: number; clicks: number; position: number | null;
  /** Paginile existente spre care și dinspre care să se pună legături. */
  links: string[];
  season?: SeasonKey; score: number;
};
export type StoredIdea = Idea & {
  status: IdeaStatus; createdAt: string; decidedAt?: string; doneAt?: string;
  baseline?: Metrics; result?: Metrics & { at: string; verdict: Verdict };
};
export type Verdict = "a-mers" | "neclar" | "n-a-mers";
export type Learned = Record<string, { tried: number; wins: number }>;
export type ClusterPerf = { key: string; label: string; pages: number; clicks: number; impressions: number; ctr: number; clicksPerPage: number; position: number | null; verdict: "merge" | "mediu" | "slab" };
export type StrategState = { ideas: StoredIdea[]; learned: Learned; lastRun: string | null; perf: ClusterPerf[]; skippedTone: number; gsc: boolean };

/* ---------- Cuvinte ---------- */

const STOP = new Set(("de din la si in pe cu a al ale ai un o ce cum unde cand care pentru prin sau ori fara despre lui lor sa se nu mai " +
  "este sunt e the of and for to in on how what where with from my your").split(" "));
/** Cuvinte care țin de regula de ton (fără limbaj religios apăsat): o temă care le are nu se propune. */
const TONE = new Set(["biblie", "biblia", "biblic", "biblice", "hristos", "isus", "iisus", "dumnezeu", "rugaciune", "evanghelie", "evanghelia", "mantuire", "pocainta"]);
const BRAND = ["cartea neamului", "carteaneamului"];

export const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ș|ş/g, "s").replace(/ț|ţ/g, "t");
export function tokens(s: string): string[] {
  return [...new Set(fold(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)))];
}
export const isBranded = (q: string) => BRAND.some((b) => fold(q).includes(b));
export const breaksTone = (q: string) => tokens(q).some((t) => TONE.has(t));
const jaccard = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0;
  const B = new Set(b);
  const inter = a.filter((x) => B.has(x)).length;
  return inter / (a.length + b.length - inter);
};

/** CTR-ul obișnuit pe fiecare loc din Google (rotunjit, din studiile publice de CTR); doar pentru comparație. */
export function expectedCtr(position: number): number {
  const t = [0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018];
  const i = Math.max(1, Math.round(position)) - 1;
  return i < t.length ? t[i] : 0.01;
}

/* ---------- Ce a învățat ---------- */

/** Cât de bine a mers un fel de propunere sau o secțiune: 1 = neutru; peste 1 a mers, sub 1 n-a mers. */
export function weightOf(learned: Learned, key: string): number {
  const l = learned[key];
  if (!l) return 1;
  return ((l.wins + 1) / (l.tried + 2)) / 0.5;
}
const weight = (learned: Learned, kind: IdeaKind, cluster: string) => weightOf(learned, `fel:${kind}`) * weightOf(learned, `sectiune:${cluster}`);

/** Rezultatul unei schimbări, după 28 de zile: a mers dacă au crescut clicurile sau a urcat clar în Google. */
export function verdictOf(before: Metrics, after: Metrics): Verdict {
  const dClicks = after.clicks - before.clicks;
  const dPos = before.position != null && after.position != null ? before.position - after.position : 0;
  const dImp = after.impressions - before.impressions;
  if ((dClicks >= 3 && after.clicks >= before.clicks * 1.2) || (dPos >= 2 && after.impressions >= before.impressions * 0.8) || (dImp >= 30 && after.impressions >= before.impressions * 1.5)) return "a-mers";
  if ((before.clicks >= 5 && after.clicks < before.clicks * 0.8) || dPos <= -2) return "n-a-mers";
  return "neclar";
}

export function learn(learned: Learned, idea: Pick<Idea, "kind" | "cluster">, v: Verdict): Learned {
  if (v === "neclar") return learned;
  const out = { ...learned };
  for (const k of [`fel:${idea.kind}`, `sectiune:${idea.cluster}`]) {
    const cur = out[k] ?? { tried: 0, wins: 0 };
    out[k] = { tried: cur.tried + 1, wins: cur.wins + (v === "a-mers" ? 1 : 0) };
  }
  return out;
}

/* ---------- Analiza ---------- */

export type GscData = { queries: KeywordRow[]; pages: Row[]; queryPages: Row[] };
export type AnalyzeInput = { gsc: GscData | null; pages: AuditPage[]; keywords: Keyword[]; learned?: Learned; now?: Date };

/** Cât aduce fiecare secțiune: clicuri pe pagină și CTR, față de media site-ului. */
export function clusterPerf(gsc: GscData, pages: AuditPage[]): ClusterPerf[] {
  const count = new Map<string, number>();
  for (const p of pages) if (p.indexable) count.set(p.cluster.key, (count.get(p.cluster.key) ?? 0) + 1);
  const by = new Map<string, { label: string; clicks: number; impressions: number; posSum: number }>();
  for (const r of gsc.pages) {
    const c = clusterOf(pathOfUrl(r.keys[0]));
    if (!c.indexable) continue;
    const x = by.get(c.key) ?? { label: c.label, clicks: 0, impressions: 0, posSum: 0 };
    x.clicks += r.clicks; x.impressions += r.impressions; x.posSum += r.position * r.impressions;
    by.set(c.key, x);
  }
  const rows = [...by.entries()].map(([key, x]) => {
    const n = Math.max(1, count.get(key) ?? 1);
    return { key, label: x.label, pages: count.get(key) ?? 0, clicks: x.clicks, impressions: x.impressions, ctr: x.impressions ? x.clicks / x.impressions : 0, clicksPerPage: x.clicks / n, position: x.impressions ? x.posSum / x.impressions : null };
  });
  const totalClicks = rows.reduce((a, r) => a + r.clicks, 0);
  const totalPages = Math.max(1, rows.reduce((a, r) => a + Math.max(1, r.pages), 0));
  const avg = totalClicks / totalPages;
  return rows.map((r): ClusterPerf => ({ ...r, verdict: avg > 0 && r.clicksPerPage >= avg * 1.5 ? "merge" : avg > 0 && r.clicksPerPage < avg * 0.5 ? "slab" : "mediu" }))
    .sort((a, b) => b.clicksPerPage - a.clicksPerPage || b.impressions - a.impressions);
}

const MIN_NEAR = 20, MIN_TITLE = 100, MIN_TOPIC = 10, MIN_DROP = 20;

/** Paginile existente cele mai apropiate de un subiect (după cuvintele din titlu și adresă). */
function related(pages: AuditPage[], words: string[], except: string | null, n = 3): string[] {
  return pages.filter((p) => p.indexable && p.path !== except)
    .map((p) => ({ p: p.path, s: jaccard(words, tokens(`${p.title} ${p.path.replace(/[/-]/g, " ")}`)) }))
    .filter((x) => x.s > 0.15).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.p);
}

export function analyze({ gsc, pages, keywords, learned = {}, now = new Date() }: AnalyzeInput): { ideas: Idea[]; perf: ClusterPerf[]; skippedTone: number } {
  const ideas: Idea[] = [];
  const byPath = new Map(pages.map((p) => [p.path, p]));
  let skippedTone = 0;
  const perf = gsc ? clusterPerf(gsc, pages) : [];
  const winning = new Set(perf.filter((p) => p.verdict === "merge").map((p) => p.key));
  const push = (i: Omit<Idea, "score">, base: number) => {
    const boost = winning.has(i.cluster) ? 1.25 : 1;
    ideas.push({ ...i, score: Math.round(base * boost * weight(learned, i.kind, i.cluster) * 10) / 10 });
  };

  if (gsc) {
    // 1. Aproape de prima pagină: căutare + pagină pe locurile 4–20, grupate pe pagină.
    const near = new Map<string, Row[]>();
    for (const r of gsc.queryPages) {
      const [q, url] = r.keys;
      const path = pathOfUrl(url);
      if (isBranded(q) || r.position < 3.5 || r.position > 20 || r.impressions < MIN_NEAR) continue;
      if (!byPath.get(path)?.indexable) continue;
      near.set(path, [...(near.get(path) ?? []), r]);
    }
    for (const [path, rows] of near) {
      rows.sort((a, b) => b.impressions - a.impressions);
      const top = rows.slice(0, 5);
      const imp = top.reduce((a, r) => a + r.impressions, 0);
      const gain = top.reduce((a, r) => a + r.impressions * Math.max(0, expectedCtr(3) - r.ctr), 0);
      const best = top[0];
      push({ id: `aproape:${path}`, kind: "aproape", path, cluster: clusterOf(path).key, title: `Urcă „${best.keys[0]}” pe primele locuri`,
        why: `${top.length === 1 ? "Căutarea e" : `${top.length} căutări sunt`} pe locul ${best.position.toFixed(1)}${top.length > 1 ? " și în jur" : ""}, cu ${imp} afișări în 28 de zile. Pe locurile 1–3 ar aduce cam ${Math.round(gain)} clicuri în plus.`,
        action: `Adaugă în pagină o secțiune sau o întrebare frecventă care răspunde direct la ${top.map((r) => `„${r.keys[0]}”`).join(", ")} și pune 2–3 legături spre ea din paginile înrudite.`,
        queries: top.map((r) => r.keys[0]), impressions: imp, clicks: top.reduce((a, r) => a + r.clicks, 0), position: best.position,
        links: related(pages, tokens(top.map((r) => r.keys[0]).join(" ")), path) }, gain + imp * 0.05);
    }

    // 2. Titluri de rescris: văzute des, apăsate rar față de locul lor.
    const topQuery = new Map<string, { q: string; imp: number }>();
    for (const r of gsc.queryPages) {
      const p = pathOfUrl(r.keys[1]);
      if (!isBranded(r.keys[0]) && r.impressions > (topQuery.get(p)?.imp ?? 0)) topQuery.set(p, { q: r.keys[0], imp: r.impressions });
    }
    for (const r of gsc.pages) {
      const path = pathOfUrl(r.keys[0]);
      const page = byPath.get(path);
      if (!page?.indexable || r.impressions < MIN_TITLE || r.position > 15) continue;
      const exp = expectedCtr(r.position);
      if (r.ctr >= exp * 0.5) continue;
      const q = topQuery.get(path)?.q;
      const missed = Math.round(r.impressions * (exp - r.ctr));
      push({ id: `titlu:${path}`, kind: "titlu", path, cluster: page.cluster.key, title: `Titlu nou pentru ${path}`,
        why: `${r.impressions} afișări pe locul ${r.position.toFixed(1)}, dar doar ${(r.ctr * 100).toFixed(1)}% apasă (obișnuit pe locul ăsta: ~${(exp * 100).toFixed(0)}%). Se pierd cam ${missed} clicuri în 28 de zile.`,
        action: `Titlul de acum: „${page.title}”. Scrie unul care începe cu ${q ? `„${q}”` : "căutarea principală"}, spune ce primește omul (gratuit, pas cu pas, exemplu) și o descriere de 140–155 de caractere cu același cuvânt.`,
        queries: q ? [q] : [], impressions: r.impressions, clicks: r.clicks, position: r.position, links: [] }, missed * 1.2);
    }

    // 3. În scădere: căutări care au coborât cel puțin 3 locuri.
    const landing = new Map<string, string>();
    for (const r of [...gsc.queryPages].sort((a, b) => a.impressions - b.impressions)) landing.set(r.keys[0], pathOfUrl(r.keys[1]));
    const drops = new Map<string, KeywordRow[]>();
    for (const k of gsc.queries) {
      if (isBranded(k.query) || k.prevPosition == null || k.impressions < MIN_DROP || k.position - k.prevPosition < 3) continue;
      const path = landing.get(k.query);
      if (!path || !byPath.get(path)?.indexable) continue;
      drops.set(path, [...(drops.get(path) ?? []), k]);
    }
    for (const [path, ks] of drops) {
      ks.sort((a, b) => b.impressions - a.impressions);
      const k = ks[0];
      push({ id: `scadere:${path}`, kind: "scadere", path, cluster: clusterOf(path).key, title: `Reîmprospătează ${path}`,
        why: `„${k.query}” a coborât de pe locul ${k.prevPosition!.toFixed(1)} pe ${k.position.toFixed(1)}${ks.length > 1 ? `, și încă ${ks.length - 1} căutări la fel` : ""}.`,
        action: "Verifică dacă datele și legăturile sunt la zi, adaugă ce lipsește față de primele rezultate din Google pentru căutarea asta și schimbă data actualizării doar dacă textul s-a schimbat cu adevărat.",
        queries: ks.slice(0, 5).map((x) => x.query), impressions: ks.reduce((a, x) => a + x.impressions, 0), clicks: ks.reduce((a, x) => a + x.clicks, 0), position: k.position, links: [] },
      ks.reduce((a, x) => a + x.impressions * (x.position - x.prevPosition!) / 10, 0));
    }

    // 4. Teme noi: căutări fără pagină potrivită (sau pe locuri slabe pe o pagină nepotrivită), grupate pe subiect.
    const covered = (q: string) => {
      const t = tokens(q);
      if (!t.length) return true;
      return pages.some((p) => p.indexable && p.path !== "/" && t.filter((w) => tokens(`${p.title} ${p.path.replace(/[/-]/g, " ")}`).includes(w)).length / t.length >= 0.75);
    };
    const pool = gsc.queries.filter((k) => !isBranded(k.query) && k.impressions >= MIN_TOPIC && (k.position > 20 || landing.get(k.query) === "/") && !covered(k.query))
      .sort((a, b) => b.impressions - a.impressions);
    const groups: { seed: KeywordRow; t: string[]; items: KeywordRow[] }[] = [];
    for (const k of pool) {
      if (breaksTone(k.query)) { skippedTone++; continue; }
      const t = tokens(k.query);
      const g = groups.find((x) => jaccard(x.t, t) >= 0.5 || (t.length >= 2 && t.every((w) => x.t.includes(w))));
      if (g) g.items.push(k); else groups.push({ seed: k, t, items: [k] });
    }
    for (const g of groups.slice(0, 15)) {
      const imp = g.items.reduce((a, k) => a + k.impressions, 0);
      const slug = fold(g.seed.query).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
      const path = `/ghid/${slug}`;
      push({ id: `tema:${slug}`, kind: "tema", path, cluster: "ghid", title: `Articol nou: „${g.seed.query}”`,
        why: `Google arată deja site-ul la ${g.items.length === 1 ? "această căutare" : `${g.items.length} căutări înrudite`} (${imp} afișări în 28 de zile), dar nu există o pagină care să le răspundă${g.seed.position > 20 ? `: cel mai bun loc e ${g.seed.position.toFixed(0)}` : ""}.`,
        action: `Ciornă de ghid la ${path} (cel puțin 1.000 de cuvinte, 4–6 întrebări frecvente, surse). Subtitluri din căutări: ${g.items.slice(0, 6).map((k) => `„${k.query}”`).join(", ")}. Se publică doar după ce o aprobi.`,
        queries: g.items.slice(0, 8).map((k) => k.query), impressions: imp, clicks: g.items.reduce((a, k) => a + k.clicks, 0), position: g.seed.position,
        links: related(pages, g.t, null) }, imp * 0.6);
    }
  }

  // 5. Din planul de cuvinte: rândurile încă nescrise sau de îmbunătățit, grupate pe pagina țintă; sezonul apropiat urcă.
  const shown = new Map<string, number>();
  if (gsc) for (const k of gsc.queries) shown.set(fold(k.query), k.impressions);
  const plan = new Map<string, Keyword[]>();
  for (const k of keywords) if (k.status === "de-creat") plan.set(k.targetUrl, [...(plan.get(k.targetUrl) ?? []), k]);
  for (const [path, ks] of plan) {
    if (ks.some((k) => breaksTone(k.keyword))) { skippedTone++; continue; }
    const season = ks.find((k) => k.sezon && daysLeft(k.sezon, now) != null)?.sezon;
    const prio = Math.min(...ks.map((k) => k.prioritate));
    const demand = ks.reduce((a, k) => a + (shown.get(fold(k.keyword)) ?? 0), 0);
    const guide = PLANNED_GUIDES.find((g) => path === `/ghid/${g.slug}`);
    const cluster = ks[0].cluster;
    push({ id: `plan:${path}`, kind: "plan", path, cluster, title: guide ? `De scris: ${guide.title}` : `De făcut: ${path}`,
      why: `${ks.length} ${ks.length === 1 ? "căutare" : "căutări"} din planul de cuvinte (prioritatea ${prio})${demand ? `, ${demand} afișări văzute deja în Google` : ""}${season ? `, în sezon acum (${season})` : ""}.`,
      action: `${guide ? "Ciornă de ghid" : "Pagină nouă"} pentru ${ks.slice(0, 5).map((k) => `„${k.keyword}”`).join(", ")}. Se publică doar după ce o aprobi.`,
      queries: ks.slice(0, 8).map((k) => k.keyword), impressions: demand, clicks: 0, position: null, links: related(pages, tokens(ks.map((k) => k.keyword).join(" ")), path), ...(season ? { season } : {}) },
    (4 - prio) * 8 + demand * 0.6 + (season ? 25 : 0));
  }

  ideas.sort((a, b) => b.score - a.score);
  return { ideas, perf, skippedTone };
}

/* ---------- Ținerea propunerilor între rulări ---------- */

/** Cifrele de acum ale unei propuneri: pagina ei (dacă are date) sau căutările ei. */
export function measure(gsc: GscData, idea: Pick<Idea, "path" | "queries">): Metrics {
  if (idea.path) {
    const rows = gsc.pages.filter((r) => pathOfUrl(r.keys[0]) === idea.path);
    if (rows.length) {
      const imp = rows.reduce((a, r) => a + r.impressions, 0);
      return { clicks: rows.reduce((a, r) => a + r.clicks, 0), impressions: imp, position: imp ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / imp : null };
    }
  }
  const qs = new Set(idea.queries.map(fold));
  const rows = gsc.queries.filter((k) => qs.has(fold(k.query)));
  const imp = rows.reduce((a, r) => a + r.impressions, 0);
  return { clicks: rows.reduce((a, r) => a + r.clicks, 0), impressions: imp, position: imp ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / imp : null };
}

const DAY = 86_400_000;
export const MEASURE_AFTER_DAYS = 28;
/** Respinsele nu mai apar 90 de zile; deciziile vechi se păstrează pentru învățare, cel mult 300 de rânduri. */
const FORGET_REJECTED_DAYS = 90, MAX_STORED = 300, MAX_OPEN = 40;

/**
 * Unește propunerile noi cu cele ținute: cele noi și încă nedecise se înlocuiesc cu cifrele de azi; cele acceptate, respinse sau
 * făcute rămân cum le-a lăsat Daniel. Cele „Făcut” de cel puțin 28 de zile se măsoară și se învață din ele.
 */
export function mergeIdeas(prev: StrategState, fresh: Idea[], gsc: GscData | null, now = new Date()): { ideas: StoredIdea[]; learned: Learned; measured: number } {
  let learned = prev.learned;
  let measured = 0;
  const kept: StoredIdea[] = [];
  for (const i of prev.ideas) {
    if (i.status === "nou") continue;
    if (i.status === "respins" && i.decidedAt && now.getTime() - Date.parse(i.decidedAt) > FORGET_REJECTED_DAYS * DAY) continue;
    if (i.status === "facut" && !i.result && i.doneAt && i.baseline && gsc && now.getTime() - Date.parse(i.doneAt) >= MEASURE_AFTER_DAYS * DAY) {
      const after = measure(gsc, i);
      const v = verdictOf(i.baseline, after);
      learned = learn(learned, i, v);
      measured++;
      kept.push({ ...i, result: { ...after, at: now.toISOString(), verdict: v } });
      continue;
    }
    kept.push(i);
  }
  const decided = new Set(kept.map((i) => i.id));
  const createdBefore = new Map(prev.ideas.map((i) => [i.id, i.createdAt]));
  const open = fresh.filter((i) => !decided.has(i.id)).slice(0, MAX_OPEN)
    .map((i): StoredIdea => ({ ...i, status: "nou", createdAt: createdBefore.get(i.id) ?? now.toISOString() }));
  const all = [...open, ...kept.sort((a, b) => Date.parse(b.decidedAt ?? b.createdAt) - Date.parse(a.decidedAt ?? a.createdAt))].slice(0, MAX_STORED);
  return { ideas: all, learned, measured };
}

/** Ce s-a învățat, pe scurt: pe felul propunerii și pe secțiune, cu rata de reușită. */
export function learnedSummary(learned: Learned) {
  return Object.entries(learned).map(([key, l]) => ({ key, kind: key.startsWith("fel:") ? "fel" as const : "sectiune" as const, name: key.split(":")[1], ...l, rate: l.tried ? l.wins / l.tried : 0, weight: weightOf(learned, key) }))
    .sort((a, b) => b.tried - a.tried);
}

/* ---------- Baza de date ---------- */

const KEY = "seo_strateg";
const EMPTY: StrategState = { ideas: [], learned: {}, lastRun: null, perf: [], skippedTone: 0, gsc: false };

export async function strategState(db: Pick<Db, "select">): Promise<StrategState> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const v = (row?.value ?? {}) as Partial<StrategState>;
  return { ...EMPTY, ...v, ideas: Array.isArray(v.ideas) ? v.ideas : [], learned: v.learned && typeof v.learned === "object" ? v.learned : {}, perf: Array.isArray(v.perf) ? v.perf : [] };
}

export async function saveStrateg(db: Pick<Db, "insert">, value: StrategState, by: string | null = null, now = new Date()) {
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

/** O rulare: citește Search Console (dacă e legat), face propunerile și le ține. */
export async function runStrateg(db: Db, o: { now?: Date; by?: string | null } = {}) {
  const now = o.now ?? new Date();
  const [{ gscSnapshot, seoSettings }, { SITE_URL }, { auditPages }, { publishedMap }, { seoKeywords }] = await Promise.all([
    import("@/lib/seo"), import("@/lib/site-url"), import("@/lib/seo-audit"), import("@/lib/motor-seo/motor"), import("@/data/seo-keywords"),
  ]);
  const snap = await gscSnapshot(await seoSettings(db), SITE_URL, 28, true);
  const gsc = snap.state === "legat" ? { queries: snap.queries, pages: snap.pages, queryPages: snap.queryPages } : null;
  const prev = await strategState(db);
  const pages = auditPages(await publishedMap(db));
  const a = analyze({ gsc, pages, keywords: seoKeywords(), learned: prev.learned, now });
  const m = mergeIdeas(prev, a.ideas, gsc, now);
  const value: StrategState = { ideas: m.ideas, learned: m.learned, lastRun: now.toISOString(), perf: a.perf, skippedTone: a.skippedTone, gsc: !!gsc };
  await saveStrateg(db, value, o.by ?? null, now);
  const open = m.ideas.filter((i) => i.status === "nou").length;
  return { gsc: snap.state, open, measured: m.measured, perf: a.perf.length, note: `${open} propuneri deschise${gsc ? "" : " (fără Search Console: doar planul de cuvinte și sezonul)"}${m.measured ? `, ${m.measured} schimbări măsurate după 28 de zile` : ""}` };
}

/** Daniel hotărăște o propunere: acceptă, respinge sau o marchează făcută (atunci se păstrează cifrele de pornire). */
export async function decideIdea(db: Db, id: string, status: Exclude<IdeaStatus, "nou"> | "redeschide", by: string, now = new Date()) {
  const st = await strategState(db);
  const i = st.ideas.find((x) => x.id === id);
  if (!i) return false;
  if (status === "redeschide") {
    Object.assign(i, { status: "nou" as const, decidedAt: undefined, doneAt: undefined, baseline: undefined, result: undefined });
  } else {
    i.status = status;
    i.decidedAt = now.toISOString();
    if (status === "facut") {
      i.doneAt = now.toISOString();
      const { gscSnapshot, seoSettings } = await import("@/lib/seo");
      const { SITE_URL } = await import("@/lib/site-url");
      const snap = await gscSnapshot(await seoSettings(db), SITE_URL, 28);
      i.baseline = snap.state === "legat" ? measure(snap, i) : { clicks: i.clicks, impressions: i.impressions, position: i.position };
    }
  }
  await saveStrateg(db, st, by, now);
  return true;
}

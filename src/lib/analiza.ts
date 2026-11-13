import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { DEMO_EMAIL } from "./demo";
import { localDayHour, SEARCH_SOURCES } from "./vizite";

/**
 * Admin → Analiză: cifrele din vizitele numărate anonim (page_view, src/lib/vizite.ts) puse lângă conturile, arborii și plățile
 * din baza de date. Doar citiri. Sesiunea = paginile aceluiași vizitator fără o pauză mai lungă de 30 de minute.
 */

export const PERIODS = [
  { key: "azi", label: "Azi" }, { key: "7z", label: "7z" }, { key: "30z", label: "30z" }, { key: "60z", label: "60z" },
  { key: "90z", label: "90z" }, { key: "6l", label: "6L" }, { key: "12l", label: "12L" }, { key: "an", label: "De la 1 ian." },
] as const;
export type PeriodKey = (typeof PERIODS)[number]["key"];
export const isPeriod = (v: unknown): v is PeriodKey => PERIODS.some((p) => p.key === v);

const DAY = 86_400_000;
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

export type Range = { from: string; to: string; days: number };
export function rangeOf(p: PeriodKey, today = localDayHour().day): { cur: Range; prev: Range } {
  const len = p === "azi" ? 1 : p === "7z" ? 7 : p === "30z" ? 30 : p === "60z" ? 60 : p === "90z" ? 90 : p === "6l" ? 182 : p === "12l" ? 365
    : daysBetween(`${today.slice(0, 4)}-01-01`, today) + 1;
  const from = addDays(today, -(len - 1));
  return { cur: { from, to: today, days: len }, prev: { from: addDays(from, -len), to: addDays(from, -1), days: len } };
}

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const localDay = (col: SQL) => sql`((${col}) at time zone 'UTC' at time zone 'Europe/Bucharest')::date`;

export type Session = {
  day: string; hour: number; views: number; secs: number; source: string; referrer: string | null; campaign: string | null; medium: string | null;
  entry: string; exit: string; device: string; country: string | null; logged: boolean; signup: boolean; tree: boolean; pay: boolean;
};

/** Sesiunile dintr-un interval, câte un rând fiecare, cu sursa și pagina de intrare (de la prima pagină) și cea de ieșire. */
export async function sessionsOf(db: Db, r: Range): Promise<Session[]> {
  const list = await rows(db, sql`
    with v as (
      select visitor, at, day, hour, path, source, referrer, campaign, medium, device, country, logged,
        case when lag(at) over w is null or at - lag(at) over w > interval '30 minutes' then 1 else 0 end as starts
      from page_view where day between ${r.from} and ${r.to}
      window w as (partition by visitor order by at)),
    s as (select *, sum(starts) over (partition by visitor order by at rows unbounded preceding) as sn from v)
    select (array_agg(day order by at))[1]::text as day, (array_agg(hour order by at))[1] as hour, count(*) as views,
      extract(epoch from max(at) - min(at)) as secs,
      (array_agg(source order by at))[1] as source, (array_agg(referrer order by at))[1] as referrer,
      (array_agg(campaign order by at))[1] as campaign, (array_agg(medium order by at))[1] as medium,
      (array_agg(path order by at))[1] as entry, (array_agg(path order by at desc))[1] as exit,
      (array_agg(device order by at))[1] as device, (array_agg(country order by at))[1] as country, bool_or(logged) as logged,
      bool_or(path = '/intrare') as signup, bool_or(path = '/arbore-nou' or path like '/arbore/%') as tree, bool_or(path = '/plata' or path like '/plata/%') as pay
    from s group by visitor, sn limit 300000`);
  return list.map((x) => ({
    day: String(x.day).slice(0, 10), hour: n(x.hour), views: n(x.views), secs: Math.round(n(x.secs)), source: String(x.source),
    referrer: (x.referrer as string) ?? null, campaign: (x.campaign as string) ?? null, medium: (x.medium as string) ?? null,
    entry: String(x.entry), exit: String(x.exit), device: String(x.device), country: (x.country as string) ?? null,
    logged: !!x.logged, signup: !!x.signup, tree: !!x.tree, pay: !!x.pay,
  }));
}

export async function uniqueVisitors(db: Db, r: Range) {
  const [x] = await rows(db, sql`select count(distinct visitor) as c, count(*) as v from page_view where day between ${r.from} and ${r.to}`);
  return { visitors: n(x?.c), views: n(x?.v) };
}

/** Pe zile (sau pe ore, pentru „Azi”): vizitatori unici, sesiuni și pagini văzute. */
export async function trafficSeries(db: Db, r: Range, sessions: Session[]) {
  if (r.days === 1) {
    const vis = await rows(db, sql`select hour, count(distinct visitor) as c from page_view where day = ${r.from} group by hour`);
    const byH = new Map(vis.map((x) => [n(x.hour), n(x.c)]));
    return Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${h}:00`, visitors: byH.get(h) ?? 0, sessions: sessions.filter((s) => s.hour === h).length }));
  }
  const vis = await rows(db, sql`select day::text as day, count(distinct visitor) as c from page_view where day between ${r.from} and ${r.to} group by day`);
  const byD = new Map(vis.map((x) => [String(x.day).slice(0, 10), n(x.c)]));
  const sByD = new Map<string, number>();
  for (const s of sessions) sByD.set(s.day, (sByD.get(s.day) ?? 0) + 1);
  const days = Array.from({ length: r.days }, (_, i) => addDays(r.from, i));
  const daily = days.map((d) => ({ key: d, label: `${d.slice(8, 10)}.${d.slice(5, 7)}`, visitors: byD.get(d) ?? 0, sessions: sByD.get(d) ?? 0 }));
  if (r.days <= 92) return daily;
  // Peste trei luni, pe săptămâni (vizitatorii se adună pe zile, fiindcă amprenta se schimbă zilnic).
  const weeks: typeof daily = [];
  for (let i = 0; i < daily.length; i += 7) {
    const part = daily.slice(i, i + 7);
    weeks.push({ key: part[0].key, label: part[0].label, visitors: part.reduce((a, b) => a + b.visitors, 0), sessions: part.reduce((a, b) => a + b.sessions, 0) });
  }
  return weeks;
}

export async function topPages(db: Db, r: Range) {
  const list = await rows(db, sql`select path, count(*) as views, count(distinct visitor) as visitors from page_view
    where day between ${r.from} and ${r.to} group by path order by views desc limit 60`);
  return list.map((x) => ({ path: String(x.path), views: n(x.views), visitors: n(x.visitors) }));
}

export async function countries(db: Db, r: Range) {
  const list = await rows(db, sql`select coalesce(country, '?') as c, count(distinct visitor) as v from page_view
    where day between ${r.from} and ${r.to} group by 1 order by 2 desc limit 15`);
  return list.map((x) => ({ label: String(x.c), count: n(x.v) }));
}

/** Conturile, arborii și plățile din interval (din baza de date, nu din vizite). Contul de probă nu intră. */
export async function business(db: Db, r: Range) {
  const [u] = await rows(db, sql`select count(*) as c from "user" where email <> ${DEMO_EMAIL} and ${localDay(sql`created_at`)} between ${r.from} and ${r.to}`);
  const [t] = await rows(db, sql`select count(*) as c from tree t join "user" u on u.id = t.owner_id where u.email <> ${DEMO_EMAIL} and ${localDay(sql`t.created_at`)} between ${r.from} and ${r.to}`);
  const pay = await rows(db, sql`select currency, count(*) as c, sum(amount) as s from payment where ${localDay(sql`created_at`)} between ${r.from} and ${r.to} group by currency`);
  return {
    accounts: n(u?.c), trees: n(t?.c),
    payments: pay.reduce((a, x) => a + n(x.c), 0),
    lei: pay.filter((x) => x.currency === "ron").reduce((a, x) => a + n(x.s) / 100, 0),
    eur: pay.filter((x) => x.currency === "eur").reduce((a, x) => a + n(x.s) / 100, 0),
  };
}

/** Drumul conturilor făcute în interval: câte au pornit un arbore, câte au adăugat rude, câte au plătit (oricând după). */
export async function accountFunnel(db: Db, r: Range) {
  const [x] = await rows(db, sql`with u as (select id from "user" where email <> ${DEMO_EMAIL} and ${localDay(sql`created_at`)} between ${r.from} and ${r.to})
    select count(*) as accounts,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id) or exists (select 1 from tree_member m where m.user_id = u.id)) as trees,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id and (select count(*) from person p where p.tree_id = t.id) >= 5)) as grown,
      count(*) filter (where exists (select 1 from payment p where p.user_id = u.id)) as paid
    from u`);
  return { accounts: n(x?.accounts), trees: n(x?.trees), grown: n(x?.grown), paid: n(x?.paid) };
}

/**
 * Cât revin oamenii cu cont: conturile grupate pe săptămâna în care s-au făcut și, pentru fiecare din următoarele săptămâni,
 * câți au mai intrat sau au mai lucrat ceva (sesiuni de intrare, schimbări în arbori, timpul măsurat cu acord).
 * Vizitatorii fără cont nu pot fi urmăriți de la o zi la alta (amprenta lor se schimbă zilnic), cu bună știință.
 */
export async function retention(db: Db, weeks = 10) {
  const list = await rows(db, sql`with u as (select id, created_at from "user" where email <> ${DEMO_EMAIL} and created_at > now() - make_interval(weeks => ${weeks})),
    act as (
      select user_id, created_at as t from session union all select user_id, updated_at from session
      union all select actor_id, created_at from audit_log where actor_id is not null
      union all select user_id, day::timestamp from usage_day)
    select date_trunc('week', u.created_at)::date::text as cohort, u.id,
      coalesce(array_agg(distinct floor(extract(epoch from (a.t - u.created_at)) / 604800)::int) filter (where a.t is not null), '{}') as w
    from u left join act a on a.user_id = u.id and a.t >= u.created_at + interval '1 day'
    group by 1, 2`);
  const byCohort = new Map<string, number[][]>();
  for (const x of list) {
    const c = String(x.cohort).slice(0, 10);
    const w = (Array.isArray(x.w) ? x.w : String(x.w ?? "").replace(/[{}]/g, "").split(",").filter(Boolean)).map(Number);
    if (!byCohort.has(c)) byCohort.set(c, []);
    byCohort.get(c)!.push(w);
  }
  const now = Date.now();
  return [...byCohort.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([cohort, users]) => {
    const age = Math.floor((now - Date.parse(`${cohort}T00:00:00Z`)) / (7 * DAY));
    return {
      cohort, size: users.length,
      weeks: Array.from({ length: 6 }, (_, k) => (k > age ? null : users.filter((w) => w.includes(k)).length)),
    };
  });
}

/* ------------------------------ Socoteli din sesiuni ------------------------------ */

export const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : 0);
/** Schimbarea față de perioada dinainte, în procente; null când înainte era 0. */
export const change = (cur: number, prev: number) => (prev ? Math.round((100 * (cur - prev)) / prev) : null);

export function summary(s: Session[]) {
  const bounces = s.filter((x) => x.views === 1).length;
  const multi = s.filter((x) => x.views > 1);
  return {
    sessions: s.length, bounces, bounceRate: pct(bounces, s.length),
    pagesPerSession: s.length ? Math.round((10 * s.reduce((a, b) => a + b.views, 0)) / s.length) / 10 : 0,
    avgSecs: multi.length ? Math.round(multi.reduce((a, b) => a + b.secs, 0) / multi.length) : 0,
    phone: s.filter((x) => x.device === "telefon").length,
  };
}

export function groupBy<K extends string>(s: Session[], key: (x: Session) => K | null) {
  const m = new Map<K, Session[]>();
  for (const x of s) {
    const k = key(x);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(x);
  }
  return [...m.entries()].map(([k, list]) => ({ key: k, count: list.length, ...summary(list), signup: list.filter((x) => x.signup).length, tree: list.filter((x) => x.tree).length, pay: list.filter((x) => x.pay).length }))
    .sort((a, b) => b.count - a.count);
}

export const isSearch = (source: string) => SEARCH_SOURCES.has(source);

/** Harta „zi din săptămână × oră” a începuturilor de sesiune (1 = luni). */
export function weekHeat(s: Session[]) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const x of s) {
    const dow = (new Date(`${x.day}T12:00:00Z`).getUTCDay() + 6) % 7;
    grid[dow][x.hour] += 1;
  }
  return grid;
}

export const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct (link scris, salvat sau din aplicații)", google: "Google", bing: "Bing", duckduckgo: "DuckDuckGo", yahoo: "Yahoo", yandex: "Yandex",
  ecosia: "Ecosia", brave: "Brave", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp", x: "X (Twitter)", youtube: "YouTube",
  tiktok: "TikTok", linkedin: "LinkedIn", telegram: "Telegram", pinterest: "Pinterest", reddit: "Reddit", chatgpt: "ChatGPT", perplexity: "Perplexity", email: "Email",
};
export const sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s;

export function durationLabel(secs: number) {
  if (secs < 60) return `${secs} s`;
  const m = Math.floor(secs / 60), r = secs % 60;
  return m < 60 ? `${m} min${r ? ` ${r} s` : ""}` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/* ------------------------------ Observații fără AI: reguli simple ------------------------------ */

export type Note = { tone: "warn" | "ok" | "info"; text: string };

export function observations(o: {
  visitors: number; prevVisitors: number; sum: ReturnType<typeof summary>; prevSum: ReturnType<typeof summary>;
  sources: { key: string; count: number }[]; accounts: number; prevAccounts: number; funnel: { accounts: number; trees: number; paid: number };
  heat: number[][]; days: number;
}): Note[] {
  const out: Note[] = [];
  const { sum } = o;
  if (!sum.sessions) {
    out.push({ tone: "info", text: "Încă nu sunt vizite numărate în această perioadă. Numărarea a pornit odată cu această pagină; primele cifre apar după primele vizite." });
    return out;
  }
  if (sum.sessions >= 20 && sum.bounceRate >= 70) out.push({ tone: "warn", text: `Bounce ridicat (${sum.bounceRate}%): cei mai mulți pleacă după o singură pagină. Merită un pas următor clar pe paginile de intrare (de pildă „Începe arborele”).` });
  const ch = change(o.visitors, o.prevVisitors);
  if (ch != null && Math.abs(ch) >= 15 && o.prevVisitors >= 10) out.push({ tone: ch > 0 ? "ok" : "warn", text: `Vizitatorii unici au ${ch > 0 ? "crescut" : "scăzut"} cu ${Math.abs(ch)}% față de perioada dinainte.` });
  const ach = change(o.accounts, o.prevAccounts);
  if (ach != null && Math.abs(ach) >= 20 && o.prevAccounts >= 2) out.push({ tone: ach > 0 ? "ok" : "warn", text: `Conturile noi au ${ach > 0 ? "crescut" : "scăzut"} cu ${Math.abs(ach)}%.` });
  const top = o.sources[0];
  if (top) out.push({ tone: "info", text: `Cele mai multe sesiuni vin din „${sourceLabel(top.key)}” (${top.count}, ${pct(top.count, sum.sessions)}%).` });
  const search = o.sources.filter((s) => isSearch(s.key)).reduce((a, b) => a + b.count, 0);
  if (sum.sessions >= 30 && pct(search, sum.sessions) < 10) out.push({ tone: "info", text: `Doar ${pct(search, sum.sessions)}% din sesiuni vin din căutări (Google și altele). Paginile publice și Admin → SEO pot aduce mai mult.` });
  if (pct(sum.phone, sum.sessions) >= 60) out.push({ tone: "info", text: `${pct(sum.phone, sum.sessions)}% din sesiuni sunt de pe telefon: tot ce schimbăm trebuie să arate bine întâi pe telefon.` });
  if (o.visitors >= 100 && pct(o.accounts, o.visitors) < 1) out.push({ tone: "warn", text: `Sub 1% dintre vizitatori își fac cont (${o.accounts} din ${o.visitors}).` });
  if (o.funnel.accounts >= 5 && pct(o.funnel.trees, o.funnel.accounts) < 70) out.push({ tone: "warn", text: `${o.funnel.accounts - o.funnel.trees} din ${o.funnel.accounts} conturi noi n-au pornit încă un arbore. Un email de ajutor sau un ghid la primul pas ar putea ajuta.` });
  if (o.funnel.paid) out.push({ tone: "ok", text: `${o.funnel.paid} din conturile noi au plătit deja.` });
  if (o.days >= 7 && sum.sessions >= 30) {
    let best = { d: 0, h: 0, v: 0 };
    o.heat.forEach((row, d) => row.forEach((v, h) => { if (v > best.v) best = { d, h, v }; }));
    const DAYS = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
    out.push({ tone: "info", text: `Cele mai multe vizite încep ${DAYS[best.d]} în jurul orei ${best.h}:00: un moment bun pentru postări și emailuri.` });
  }
  return out;
}

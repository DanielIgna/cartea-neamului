/**
 * De unde vine fiecare cont nou (Daniel, 16.11.2026): partea de pe server. Ce ține browserul e în src/lib/sursa-shared.ts.
 *
 * - La crearea contului (cu email sau cu Google) se scrie un rând în `account_source`. Sursa first-touch, sursa last-touch,
 *   referrer-ul, pagina de intrare, dispozitivul și țara intră DOAR dacă omul acceptase cookie-urile de analiză; altfel rămâne
 *   doar răspunsul la „De unde ai aflat de noi?”. Contul venit prin legătura de invitație a cuiva e marcat „recomandare”.
 * - Conturile de dinainte n-au rând: sursa lor e „necunoscut”.
 * - Admin → Oameni (coloana și filtrul „Sursa”, drumul pe fișa omului), Admin → Analiză → Surse (vizitatori, conturi, arbori,
 *   plăți, venituri pe sursă) și Admin → Linkuri cu sursă (generatorul, cu click-uri și conturi pe fiecare link).
 * Fluxul de plată (Stripe) nu e atins: veniturile se citesc doar din tabelul `payment`.
 */
import { desc, eq, sql, type SQL } from "drizzle-orm";
import { realAccountSql } from "./conturi-test";
import type { Db } from "@/db";
import { accountSource, sourceLink } from "@/db/schema";
import { deviceOf, sourceOf } from "./vizite";
import { sourceLabel } from "./analiza";
import {
  ANSWER_COOKIE, ANSWER_LABEL, CHOICE_COOKIE, FIRST_COOKIE, LAST_COOKIE, analyticsAllowed, decodeAnswer, decodeTouch, isAnswer, readCookie, slugOf,
  type Answer, type Touch,
} from "./sursa-shared";

/** Cheia sursei unei atingeri: eticheta din ?src= așa cum e, altfel utm_source sau site-ul din care a venit; nimic = „direct”. */
export function sourceKeyOf(t: Touch | null | undefined): string {
  if (!t) return "direct";
  const s = slugOf(t.s);
  if (s) return s;
  return sourceOf(t.r ?? null, t.us ?? null);
}

const at = (t: Touch | null) => (t?.t ? new Date(t.t * 1000) : null);
const countryOf = (h: Headers | null | undefined) => { const c = h?.get("x-vercel-ip-country"); return c && /^[A-Z]{2}$/.test(c) ? c : null; };

/** Rândul pentru contul nou, din cookie-urile cererii. Pur (fără bază), ca să poată fi verificat în teste. */
export function sourceRowOf(cookieHeader: string | null | undefined, h: Headers | null | undefined, invite: boolean) {
  const analytics = analyticsAllowed(readCookie(cookieHeader, CHOICE_COOKIE));
  const ans = decodeAnswer(readCookie(cookieHeader, ANSWER_COOKIE));
  const answer: Answer | null = ans?.a ?? (invite ? "recomandare" : null);
  const base = { analytics, invite, answer, answerOther: ans?.a === "altceva" ? ans.o ?? null : null, answerAuto: !ans && invite };
  if (!analytics) return base;
  const first = decodeTouch(readCookie(cookieHeader, FIRST_COOKIE));
  const last = decodeTouch(readCookie(cookieHeader, LAST_COOKIE)) ?? first;
  return {
    ...base,
    source: sourceKeyOf(first),
    firstSrc: slugOf(first?.s), firstUtmSource: first?.us ?? null, firstMedium: first?.um ?? null, firstCampaign: first?.uc ?? null,
    firstReferrer: first?.r ?? null, firstLanding: first?.p ?? null, firstAt: at(first),
    lastSource: sourceKeyOf(last), lastSrc: slugOf(last?.s), lastMedium: last?.um ?? null, lastCampaign: last?.uc ?? null,
    lastReferrer: last?.r ?? null, lastLanding: last?.p ?? null, lastAt: at(last),
    device: deviceOf(h?.get("user-agent") ?? "", null), country: countryOf(h),
  };
}

/** Scrie sursa contului nou. Nu aruncă niciodată (nu strică crearea contului). */
export async function recordAccountSource(db: Pick<Db, "insert">, userId: string, h: Headers | null | undefined, invite: boolean) {
  try {
    const row = sourceRowOf(h?.get("cookie"), h, invite);
    await db.insert(accountSource).values({ userId, ...row }).onConflictDoNothing();
  } catch (e) {
    console.error("sursa: contul nou", e);
  }
}

/* ------------------------------ Cheia de grupare ------------------------------ */

/** Sursa unui cont, cum apare în Oameni și în Analiză → Surse. */
export const KEY_SQL = sql`case when s.user_id is null then 'necunoscut' when s.invite then 'invitatie'
  when s.analytics then coalesce(s.source, 'direct') else 'fara-acord' end`;

export const SPECIAL_LABEL: Record<string, string> = {
  necunoscut: "Necunoscut (cont de dinainte)", "fara-acord": "Fără acord la cookie-uri", invitatie: "Invitație (recomandare)", direct: "Direct (fără link și fără site)",
};

/** Numele unei surse, pentru oameni: „Facebook”, „Invitație (recomandare)”, „fb-romani-new-york”. */
export const labelOfSource = (k: string, linkName?: string | null) => SPECIAL_LABEL[k] ?? (linkName ? `${linkName} (link)` : sourceLabel(k));

/** Numele linkurilor făcute în Admin, după etichetă, ca în tabele să scrie „FB Români New York (link)”. */
export async function linkNames(db: Db): Promise<Map<string, string>> {
  const r = await db.select({ slug: sourceLink.slug, name: sourceLink.name }).from(sourceLink);
  return new Map(r.map((x) => [x.slug, x.name]));
}

export type AccountSourceRow = typeof accountSource.$inferSelect;
export type PersonSource = { key: string; row: AccountSourceRow | null; linkName?: string | null };

/** Sursa fiecărui cont (pentru tabelul din Oameni). */
export async function sourceKeys(db: Db): Promise<Map<string, string>> {
  const r = await db.execute(sql`select u.id, ${KEY_SQL} as k from "user" u left join account_source s on s.user_id = u.id`);
  return new Map(((r.rows ?? []) as { id: string; k: string }[]).map((x) => [String(x.id), String(x.k)]));
}

export async function personSource(db: Db, userId: string): Promise<PersonSource> {
  const [row] = await db.select().from(accountSource).where(eq(accountSource.userId, userId));
  if (!row) return { key: "necunoscut", row: null };
  const key = row.invite ? "invitatie" : row.analytics ? row.source ?? "direct" : "fara-acord";
  const names = await linkNames(db);
  return { key, row, linkName: names.get(key) ?? null };
}

export const answerLabel = (a: string | null | undefined, other?: string | null) =>
  !a ? null : isAnswer(a) ? (a === "altceva" && other ? `${ANSWER_LABEL.altceva}: „${other}”` : ANSWER_LABEL[a]) : a;

/* ------------------------------ Analiză → Surse ------------------------------ */

export type Range = { from: string; to: string; days: number };
const localDay = (col: SQL) => sql`((${col}) at time zone 'UTC' at time zone 'Europe/Bucharest')::date`;
const n = (v: unknown) => Number(v ?? 0) || 0;

export type SourceStat = {
  key: string; visitors: number; accounts: number; trees: number; paid: number; lei: number; eur: number;
  /** Conturi / vizitatori (%), null fără vizitatori numărați. */ rate: number | null;
};

/**
 * Pentru fiecare sursă, în perioadă: vizitatorii (unici pe zi, după prima pagină a zilei, din vizitele anonime), conturile
 * create (după sursa first-touch), câte au arbore, câte au plătit și cât (plățile lor, oricând după).
 */
export async function sourcesReport(db: Db, r: Range): Promise<SourceStat[]> {
  const [vis, acc] = await Promise.all([
    db.execute(sql`with f as (select distinct on (visitor, day) source from page_view where day between ${r.from} and ${r.to} order by visitor, day, at)
      select source as k, count(*) as c from f group by source`),
    db.execute(sql`with u as (
        select u.id, ${KEY_SQL} as k from "user" u left join account_source s on s.user_id = u.id
        where ${realAccountSql("u")} and ${localDay(sql`u.created_at`)} between ${r.from} and ${r.to})
      select k, count(*) as accounts,
        count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id) or exists (select 1 from tree_member m where m.user_id = u.id)) as trees,
        count(*) filter (where exists (select 1 from payment p where p.user_id = u.id)) as paid,
        coalesce(sum((select sum(p.amount) from payment p where p.user_id = u.id and p.currency = 'ron')), 0) as ron,
        coalesce(sum((select sum(p.amount) from payment p where p.user_id = u.id and p.currency = 'eur')), 0) as eur
      from u group by k`),
  ]);
  const map = new Map<string, SourceStat>();
  const get = (k: string) => map.get(k) ?? map.set(k, { key: k, visitors: 0, accounts: 0, trees: 0, paid: 0, lei: 0, eur: 0, rate: null }).get(k)!;
  for (const x of (vis.rows ?? []) as Record<string, unknown>[]) get(String(x.k)).visitors += n(x.c);
  for (const x of (acc.rows ?? []) as Record<string, unknown>[]) {
    const s = get(String(x.k));
    s.accounts += n(x.accounts); s.trees += n(x.trees); s.paid += n(x.paid); s.lei += n(x.ron) / 100; s.eur += n(x.eur) / 100;
  }
  for (const s of map.values()) s.rate = s.visitors ? Math.round((1000 * s.accounts) / s.visitors) / 10 : null;
  return [...map.values()].sort((a, b) => b.accounts - a.accounts || b.visitors - a.visitors || a.key.localeCompare(b.key));
}

/** Răspunsurile la „De unde ai aflat de noi?” pentru conturile din perioadă (cu cele scrise la „Altceva”). */
export async function answersReport(db: Db, r: Range) {
  const res = await db.execute(sql`select s.answer as a, s.answer_other as o, s.answer_auto as auto from account_source s join "user" u on u.id = s.user_id
    where ${realAccountSql("u")} and ${localDay(sql`u.created_at`)} between ${r.from} and ${r.to}`);
  const rows = (res.rows ?? []) as { a: string | null; o: string | null; auto: boolean }[];
  const counts = new Map<string, number>();
  const others: string[] = [];
  for (const x of rows) {
    const k = x.a ?? "fara-raspuns";
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (x.a === "altceva" && x.o) others.push(x.o);
  }
  return { total: rows.length, counts: [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count), others: others.slice(0, 30) };
}

/* ------------------------------ Linkurile cu sursă ------------------------------ */

/** Paginile spre care poate duce un link (cele publice, cu cele mai multe vizite). */
export const LINK_PAGES: [string, string][] = [
  ["/", "Prima pagină"], ["/cadou-de-sarbatori", "Cadou de sărbători"], ["/diaspora", "Diaspora"], ["/resurse-genealogie", "Resurse genealogie"],
  ["/ghid", "Ghidul"], ["/istoria-umanitatii", "Istoria umanității"], ["/intrare?mod=cont-nou", "Direct la contul nou"],
];
export const isLinkPage = (p: string) => LINK_PAGES.some(([x]) => x === p);

/** Adresa întreagă a unui link (cu ?src= pus după parametrii paginii, dacă are). */
export function linkUrl(origin: string, page: string, slug: string) {
  return `${origin}${page}${page.includes("?") ? "&" : "?"}src=${slug}`;
}

export type LinkStat = { slug: string; name: string; page: string; createdAt: Date; clicks: number; accounts: number; lastAccounts: number };

export async function linkList(db: Db): Promise<LinkStat[]> {
  const links = await db.select().from(sourceLink).orderBy(desc(sourceLink.createdAt));
  if (!links.length) return [];
  const slugs = links.map((l) => l.slug);
  const list = sql.join(slugs.map((s) => sql`${s}`), sql`, `);
  const [clicks, accounts] = await Promise.all([
    db.execute(sql`select source as k, count(distinct visitor || day::text) as c from page_view where source in (${list}) group by source`),
    db.execute(sql`select k, count(*) filter (where kind = 'f') as f, count(*) filter (where kind = 'l') as l from (
        select s.first_src as k, 'f' as kind from account_source s where s.analytics and s.first_src in (${list})
        union all select s.last_src, 'l' from account_source s where s.analytics and s.last_src in (${list}) and s.last_src is distinct from s.first_src
      ) x group by k`),
  ]);
  const c = new Map(((clicks.rows ?? []) as Record<string, unknown>[]).map((x) => [String(x.k), n(x.c)]));
  const a = new Map(((accounts.rows ?? []) as Record<string, unknown>[]).map((x) => [String(x.k), { f: n(x.f), l: n(x.l) }]));
  return links.map((l) => ({ ...l, clicks: c.get(l.slug) ?? 0, accounts: a.get(l.slug)?.f ?? 0, lastAccounts: a.get(l.slug)?.l ?? 0 }));
}

/** Un link nou: eticheta din nume (unică: dacă e luată, primește „-2”, „-3”…). Întoarce eticheta. */
export async function createLink(db: Db, name: string, page: string, by: string | null, slugBase?: string): Promise<string> {
  const base = (slugBase && slugOf(slugBase)) || slugOf(name) || "link";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base.slice(0, 36)}-${i}`;
    const r = await db.insert(sourceLink).values({ slug, name: name.trim().slice(0, 80), page: isLinkPage(page) ? page : "/", createdBy: by })
      .onConflictDoNothing().returning({ slug: sourceLink.slug });
    if (r.length) return slug;
  }
  throw new Error("sursa: nu am găsit o etichetă liberă");
}

/** Eticheta unui grup de Facebook: `fb-<numele grupului>` (fără un „fb” dublat dacă numele începe deja cu el). */
export function facebookSlugBase(name: string): string {
  const s = slugOf(name, 37) ?? "grup";
  return s.startsWith("fb-") || s === "fb" ? s : `fb-${s}`;
}

/** Numele de grupuri dintr-o listă lipită (unul pe rând sau despărțite prin virgulă/punct și virgulă), fără dubluri, cel mult 50. */
export function groupNames(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of raw.split(/[\n;,]+/)) {
    const name = x.replace(/\s+/g, " ").trim().slice(0, 76);
    const key = slugOf(name);
    if (!name || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 50) break;
  }
  return out;
}

export async function deleteLink(db: Db, slug: string) {
  await db.delete(sourceLink).where(eq(sourceLink.slug, slug));
}

/** Pentru „Datele mele”: ce știm despre de unde a venit contul (fără cheile tehnice goale). */
export async function sourceExport(db: Db, userId: string) {
  const [row] = await db.select().from(accountSource).where(eq(accountSource.userId, userId));
  if (!row) return null;
  return Object.fromEntries(Object.entries(row).filter(([k, v]) => k !== "userId" && v != null && v !== ""));
}

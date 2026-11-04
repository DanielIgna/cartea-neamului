import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import journal from "../../drizzle/meta/_journal.json";
import { FREE_PERSONS, PRICE_EUR_YEAR } from "./admin";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());

/* ------------------------------ Business ------------------------------ */

export type BusinessStats = Awaited<ReturnType<typeof businessStats>>;

/** Tot ce arată zona Business: oameni, arbori, activitate și ce ar aduce planul „Familie”. Doar citiri. */
export async function businessStats(db: Db) {
  const [u] = await rows(db, sql`select
      count(*) as total,
      count(*) filter (where created_at > now() - interval '7 days') as new7,
      count(*) filter (where created_at > now() - interval '30 days') as new30,
      count(*) filter (where email_verified) as verified
    from "user"`);
  const [act] = await rows(db, sql`select
      count(distinct user_id) filter (where updated_at > now() - interval '1 day') as d1,
      count(distinct user_id) filter (where updated_at > now() - interval '7 days') as d7,
      count(distinct user_id) filter (where updated_at > now() - interval '30 days') as d30
    from session`);
  const [google] = await rows(db, sql`select count(distinct user_id) as c from account where provider_id = 'google'`);
  const weeks = await rows<{ week: string; c: unknown }>(db, sql`select date_trunc('week', created_at) as week, count(*) as c
    from "user" where created_at > now() - interval '12 weeks' group by 1 order by 1`);

  const [t] = await rows(db, sql`with sizes as (
      select t.id, t.discoverable, (select count(*) from person p where p.tree_id = t.id) as persons,
             (select count(*) from tree_member m where m.tree_id = t.id) as members
      from tree t)
    select count(*) as total,
      count(*) filter (where discoverable) as discoverable,
      count(*) filter (where members > 1) as shared,
      count(*) filter (where persons >= ${FREE_PERSONS}) as over_limit,
      count(*) filter (where persons >= ${Math.round(FREE_PERSONS * 0.75)} and persons < ${FREE_PERSONS}) as near_limit,
      coalesce(round(avg(persons)), 0) as avg_persons,
      coalesce(max(persons), 0) as max_persons
    from sizes`);
  const [c] = await rows(db, sql`select
      (select count(*) from person) as persons,
      (select count(*) from person where living) as living,
      (select count(*) from person where claimed_by_user_id is not null) as claimed,
      (select count(*) from person where created_at > now() - interval '7 days') as persons7,
      (select count(*) from document) as documents,
      (select count(*) from document where kind = 'photo') as photos,
      (select count(*) from message) as messages,
      (select count(*) from message where created_at > now() - interval '7 days') as messages7,
      (select count(*) from invitation where accepted_at is not null) as invites_accepted,
      (select count(*) from invitation) as invites,
      (select count(*) from join_request where status = 'pending') as joins_pending,
      (select count(*) from join_request where status = 'accepted') as joins_accepted,
      (select count(*) from place_contact) as contacts,
      (select count(*) from place_contact where status = 'accepted') as contacts_accepted`);
  const books = await rows<{ status: string; c: unknown; bani: unknown }>(db, sql`select status, count(*) as c, coalesce(sum(price_bani), 0) as bani
    from book_export group by status`);

  const topTrees = await rows(db, sql`select t.id, t.name, t.created_at, t.discoverable, o.name as owner, o.email as owner_email,
      (select count(*) from person p where p.tree_id = t.id) as persons,
      (select count(*) from tree_member m where m.tree_id = t.id) as members,
      (select count(*) from document d where d.tree_id = t.id) as documents,
      (select max(p.updated_at) from person p where p.tree_id = t.id) as last_edit
    from tree t left join "user" o on o.id = t.owner_id
    order by persons desc, t.created_at desc limit 15`);
  const recentUsers = await rows(db, sql`select u.id, u.name, u.email, u.created_at,
      (select string_agg(distinct a.provider_id, ', ') from account a where a.user_id = u.id) as providers,
      (select count(*) from tree_member m where m.user_id = u.id) as trees,
      (select max(s.updated_at) from session s where s.user_id = u.id) as last_seen
    from "user" u order by u.created_at desc limit 15`);

  const overLimit = n(t.over_limit);
  const paidBani = books.filter((b) => b.status === "paid" || b.status === "ready").reduce((s, b) => s + n(b.bani), 0);
  return {
    users: { total: n(u.total), new7: n(u.new7), new30: n(u.new30), verified: n(u.verified), google: n(google?.c), active1: n(act.d1), active7: n(act.d7), active30: n(act.d30) },
    signupsByWeek: fillWeeks(weeks.map((w) => ({ week: iso(w.week)!, c: n(w.c) })), 12),
    trees: { total: n(t.total), discoverable: n(t.discoverable), shared: n(t.shared), overLimit, nearLimit: n(t.near_limit), avgPersons: n(t.avg_persons), maxPersons: n(t.max_persons) },
    content: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, n(v)])) as Record<string, number>,
    books: books.map((b) => ({ status: b.status, count: n(b.c), lei: n(b.bani) / 100 })),
    revenue: { booksLei: paidBani / 100, potentialEurYear: overLimit * PRICE_EUR_YEAR, subscriptionsActive: 0 },
    topTrees: topTrees.map((r) => ({ id: String(r.id), name: String(r.name), owner: (r.owner as string) ?? "—", ownerEmail: (r.owner_email as string) ?? "", persons: n(r.persons), members: n(r.members), documents: n(r.documents), discoverable: !!r.discoverable, createdAt: iso(r.created_at), lastEdit: iso(r.last_edit) })),
    recentUsers: recentUsers.map((r) => ({ id: String(r.id), name: String(r.name), email: String(r.email), providers: (r.providers as string) ?? "", trees: n(r.trees), createdAt: iso(r.created_at), lastSeen: iso(r.last_seen) })),
  };
}

/** Săptămânile fără conturi noi apar cu 0, ca graficul să nu sară peste ele. */
export function fillWeeks(data: { week: string; c: number }[], count: number, now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const byDay = new Map(data.map((d) => [d.week.slice(0, 10), d.c]));
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() - 7 * (count - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { week: key, c: byDay.get(key) ?? 0 };
  });
}

/* ------------------------------ Infra & Dev ------------------------------ */

const TABLES = ["user", "session", "account", "verification", "tree", "tree_member", "invitation", "person", "relationship", "raised_by",
  "document", "document_link", "book_export", "consent", "audit_log", "message", "place_pin", "tree_place", "place_contact", "join_request", "join_attempt"];

export type InfraStats = Awaited<ReturnType<typeof infraStats>>;

/** Baza de date: mărime, tabele, migrații, sesiuni și erorile prinse de aplicație (din audit_log). Doar citiri. */
export async function infraStats(db: Db) {
  const t0 = Date.now();
  await db.execute(sql`select 1`);
  const pingMs = Date.now() - t0;
  const [info] = await rows(db, sql`select version() as version, pg_database_size(current_database()) as bytes, current_database() as name`);
  const existing = new Set((await rows<{ t: string }>(db, sql`select table_name as t from information_schema.tables where table_schema = 'public'`)).map((r) => r.t));
  const present = TABLES.filter((x) => existing.has(x));
  const counts = present.length
    ? await rows<{ t: string; c: unknown; bytes: unknown }>(db, sql.join(present.map((x) =>
        sql`select ${x} as t, (select count(*) from ${sql.identifier(x)}) as c, pg_total_relation_size(${`public."${x}"`}) as bytes`), sql` union all `))
    : [];
  let migrations = { applied: 0, last: null as string | null };
  try {
    const [m] = await rows(db, sql`select count(*) as c, max(created_at) as last from drizzle.__drizzle_migrations`);
    migrations = { applied: n(m.c), last: m.last ? new Date(n(m.last)).toISOString() : null };
  } catch { /* tabela migrațiilor nu există încă */ }
  const [s] = await rows(db, sql`select count(*) filter (where expires_at > now()) as live, count(*) filter (where expires_at <= now()) as expired from session`);
  const [ja] = await rows(db, sql`select count(*) filter (where created_at > now() - interval '1 day') as d1, count(*) filter (where created_at > now() - interval '1 day' and not found) as miss1 from join_attempt`);
  const [e] = await rows(db, sql`select count(*) filter (where created_at > now() - interval '1 day') as d1, count(*) filter (where created_at > now() - interval '7 days') as d7
    from audit_log where entity = 'eroare'`);
  const errors = await rows(db, sql`select created_at, entity_id, action, diff from audit_log where entity = 'eroare' order by created_at desc limit 25`);
  const [docs] = await rows(db, sql`select count(*) filter (where file_key is not null) as files from document`);
  return {
    db: { pingMs, version: String(info.version ?? "").split(" on ")[0].split(",")[0], bytes: n(info.bytes), name: String(info.name ?? "") },
    tables: counts.map((r) => ({ name: r.t, rows: n(r.c), bytes: n(r.bytes) })).sort((a, b) => b.bytes - a.bytes),
    missingTables: TABLES.filter((x) => !existing.has(x)),
    migrations: { ...migrations, expected: journal.entries.length, latestTag: journal.entries.at(-1)?.tag ?? "" },
    sessions: { live: n(s.live), expired: n(s.expired) },
    joinAttempts: { d1: n(ja.d1), miss1: n(ja.miss1) },
    errors: {
      d1: n(e.d1), d7: n(e.d7),
      recent: errors.map((r) => ({ at: iso(r.created_at), path: String(r.entity_id), kind: String(r.action), ...(r.diff as { message?: string; digest?: string; method?: string; route?: string } ?? {}) })),
    },
    storedFiles: n(docs.files),
  };
}

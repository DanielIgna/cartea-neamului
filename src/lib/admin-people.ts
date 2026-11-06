/**
 * „Oamenii” din panoul de admin: fiecare cont, cu cât și-a crescut arborele și ce a folosit, plus drumul tuturor (cont →
 * arbore → rude chemate → amintiri) și câteva observații din cifre. Doar citiri și doar cifre: nu arată ce scrie în amintiri
 * sau mesaje și nu numără nimic din capitolul „Credința” (date ocrotite mai strict). Contul de probă, al tuturor, nu intră.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { DEMO_EMAIL } from "./demo";
import { CHAPTERS } from "./questions";
import { accountPlans, type Plan } from "./plans";
import { INVITE_VALID_DAYS } from "./invitations";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());
const DAY = 86_400_000;

/**
 * Tot ce face un om în site și lasă o urmă cu dată, plus intrările în cont. Fără capitolul „Credința” și fără înregistrările
 * cu glasul ca fișiere (sunt numărate o dată, la amintirea lor).
 */
const EVENTS = sql`
  select created_by as uid, created_at as at, 'persoana' as kind from person where created_by is not null
  union all select author_id, created_at, 'amintire' from memory where author_id is not null and chapter <> 'credinta'
  union all select uploaded_by, created_at, case when kind = 'photo' then 'poza' else 'document' end from document
    where uploaded_by is not null and kind <> 'audio'
  union all select from_user_id, created_at, 'mesaj' from message
  union all select created_by, expires_at - interval '${sql.raw(String(INVITE_VALID_DAYS))} days', 'invitatie' from invitation where created_by is not null
  union all select r.author_id, r.created_at, 'raspuns' from memory_reply r join memory m on m.id = r.memory_id
    where r.author_id is not null and m.chapter <> 'credinta'
  union all select asked_by, created_at, 'intrebare' from memory_question where asked_by is not null
  union all select user_id, created_at, 'intrare' from session`;

export type Stage = "cont" | "arbore" | "creste" | "chemat" | "familie" | "amintiri" | "la-rude";
export const STAGES: Record<Stage, string> = {
  cont: "Doar cont", arbore: "Are arbore", creste: "Crește arborele", chemat: "A chemat rude", familie: "Familia a intrat",
  amintiri: "Scrie amintiri", "la-rude": "Intrat la rude",
};

export type PersonRow = {
  id: string; name: string; email: string; verified: boolean; createdAt: string | null; providers: string;
  lastSeen: string | null; lastAction: string | null; sessions: number; activeDays30: number; phone: boolean;
  trees: number; owned: number; mainTree: { id: string; name: string; persons: number; members: number } | null;
  personsAdded: number; memories: number; ownStory: number; helper: number; voices: number; voiceSeconds: number; photos: number;
  invites: number; invitesAccepted: number; messages: number; replies: number; questions: number;
  plan: Plan; planNote: string | null; stage: Stage; returned: boolean;
};

/** Unde a ajuns omul: cine are arbore al lui urcă de la „Are arbore” la „Scrie amintiri”; cine e doar în arborii rudelor e „Intrat la rude”. */
export function stageOf(p: Pick<PersonRow, "trees" | "owned" | "personsAdded" | "invites" | "memories" | "mainTree">): Stage {
  if (p.trees === 0) return "cont";
  if (p.memories > 0) return "amintiri";
  if (p.owned === 0) return "la-rude";
  if ((p.mainTree?.members ?? 0) >= 2) return "familie";
  if (p.invites > 0) return "chemat";
  return p.personsAdded >= 5 ? "creste" : "arbore";
}

/** S-a întors: a mai intrat sau a mai făcut ceva la cel puțin o zi după ce și-a făcut contul. */
const cameBack = (createdAt: string | null, ...later: (string | null)[]) =>
  !!createdAt && later.some((x) => !!x && new Date(x).getTime() - new Date(createdAt).getTime() >= DAY);

/** Toate conturile (fără cel de probă), cu cifrele fiecăruia; cu `only`, doar contul acela. */
export async function peopleList(db: Db, only?: string): Promise<PersonRow[]> {
  const list = await rows(db, sql`
    with ev as (${EVENTS}),
    act as (select uid, max(at) as last_action, count(distinct date_trunc('day', at)) filter (where at > now() - interval '30 days') as days30 from ev group by uid)
    select u.id, u.name, u.email, u.email_verified, u.created_at,
      (select string_agg(distinct a.provider_id, ', ') from account a where a.user_id = u.id) as providers,
      (select max(s.updated_at) from session s where s.user_id = u.id) as last_seen,
      (select count(*) from session s where s.user_id = u.id) as sessions,
      exists (select 1 from session s where s.user_id = u.id and s.user_agent ~* '(iphone|ipad|android|mobile)') as phone,
      act.last_action, coalesce(act.days30, 0) as days30,
      (select count(*) from tree_member m where m.user_id = u.id) as trees,
      (select count(*) from tree t where t.owner_id = u.id) as owned,
      mt.id as main_id, mt.name as main_name, mt.persons as main_persons, mt.members as main_members,
      (select count(*) from person p where p.created_by = u.id) as persons_added,
      (select count(*) from memory m where m.author_id = u.id and m.chapter <> 'credinta') as memories,
      (select count(*) from memory m where m.author_id = u.id and m.question_key like 'carte.%' and not m.helper and m.chapter <> 'credinta') as own_story,
      (select count(*) from memory m where m.author_id = u.id and m.helper and m.chapter <> 'credinta') as helper,
      (select count(*) from memory m where m.author_id = u.id and m.audio_document_id is not null and m.chapter <> 'credinta') as voices,
      (select coalesce(sum(m.audio_seconds), 0) from memory m where m.author_id = u.id and m.chapter <> 'credinta') as voice_seconds,
      (select count(*) from document d where d.uploaded_by = u.id and d.kind = 'photo') as photos,
      (select count(*) from invitation i where i.created_by = u.id) as invites,
      (select count(*) from invitation i where i.created_by = u.id and i.accepted_at is not null) as invites_accepted,
      (select count(*) from message x where x.from_user_id = u.id) as messages,
      (select count(*) from memory_reply r join memory m on m.id = r.memory_id where r.author_id = u.id and m.chapter <> 'credinta') as replies,
      (select count(*) from memory_question q where q.asked_by = u.id) as questions
    from "user" u
    left join act on act.uid = u.id
    left join lateral (
      select t.id, t.name, (select count(*) from person p where p.tree_id = t.id) as persons,
        (select count(*) from tree_member mm where mm.tree_id = t.id) as members
      from tree_member m join tree t on t.id = m.tree_id where m.user_id = u.id
      order by (t.owner_id = u.id) desc, persons desc limit 1) mt on true
    where lower(u.email) <> ${DEMO_EMAIL} ${only ? sql`and u.id = ${only}` : sql``}
    order by u.created_at desc`);
  const plans = await accountPlans(db);
  return list.map((r) => {
    const row = {
      id: String(r.id), name: String(r.name), email: String(r.email), verified: !!r.email_verified, createdAt: iso(r.created_at),
      providers: String(r.providers ?? ""), lastSeen: iso(r.last_seen), lastAction: iso(r.last_action), sessions: n(r.sessions),
      activeDays30: n(r.days30), phone: !!r.phone, trees: n(r.trees), owned: n(r.owned),
      mainTree: r.main_id ? { id: String(r.main_id), name: String(r.main_name), persons: n(r.main_persons), members: n(r.main_members) } : null,
      personsAdded: n(r.persons_added), memories: n(r.memories), ownStory: n(r.own_story), helper: n(r.helper), voices: n(r.voices),
      voiceSeconds: n(r.voice_seconds), photos: n(r.photos), invites: n(r.invites), invitesAccepted: n(r.invites_accepted),
      messages: n(r.messages), replies: n(r.replies), questions: n(r.questions),
      plan: plans.get(String(r.id))?.plan ?? "gratuit", planNote: plans.get(String(r.id))?.note ?? null,
    };
    return { ...row, stage: stageOf(row), returned: cameBack(row.createdAt, row.lastSeen, row.lastAction) };
  });
}

/** Drumul oamenilor: câți au ajuns la fiecare pas, din toate conturile. */
export function funnelOf(people: PersonRow[]) {
  const steps: [string, (p: PersonRow) => boolean][] = [
    ["Și-au făcut cont", () => true],
    ["Au un arbore", (p) => p.trees > 0],
    ["Au adăugat cel puțin 5 persoane", (p) => p.personsAdded >= 5],
    ["Și-au chemat rudele", (p) => p.invites > 0],
    ["Au rude în arbore", (p) => (p.mainTree?.members ?? 0) >= 2],
    ["Au scris o amintire", (p) => p.memories > 0],
    ["S-au întors după prima zi", (p) => p.returned],
  ];
  return steps.map(([label, ok]) => ({ label, count: people.filter(ok).length }));
}

/** Ce folosesc: din toate conturile, câți au făcut măcar o dată fiecare lucru. */
export function adoptionOf(people: PersonRow[]) {
  const items: [string, (p: PersonRow) => boolean][] = [
    ["Au trecut persoane", (p) => p.personsAdded > 0],
    ["Au pus poze", (p) => p.photos > 0],
    ["Au scris în lada cu amintiri", (p) => p.memories > 0],
    ["Și-au început povestea (autobiografia)", (p) => p.ownStory > 0],
    ["Au înregistrat cu glasul", (p) => p.voices > 0],
    ["Au fost „la bunici”", (p) => p.helper > 0],
    ["Au pus întrebări rudelor", (p) => p.questions > 0],
    ["Au scris „Și eu îmi amintesc”", (p) => p.replies > 0],
    ["Și-au scris mesaje", (p) => p.messages > 0],
    ["Au chemat rude cu link", (p) => p.invites > 0],
    ["Intră și de pe telefon sau tabletă", (p) => p.phone],
  ];
  return items.map(([label, ok]) => ({ label, count: people.filter(ok).length })).sort((a, b) => b.count - a.count);
}

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
/** „1 om și-a făcut”, „2 oameni și-au făcut”; „5 conturi”, dar „20 de conturi”. */
const sg = (v: number, one: string, many: string) => (v === 1 ? one : many);
const cnt = (v: number, noun: string) => `${v}${v % 100 >= 20 || (v % 100 === 0 && v !== 0) ? " de" : ""} ${noun}`;

/** Câteva lucruri care se văd din cifre, fiecare cu ce s-ar putea face. Apar doar cele care au sens pentru datele de acum. */
export function observations(people: PersonRow[], now = new Date()) {
  const out: string[] = [];
  const total = people.length;
  if (!total) return ["Încă nu și-a făcut nimeni cont (în afară de contul de probă)."];
  const noTree = people.filter((p) => p.trees === 0).length;
  if (noTree) out.push(`${noTree} din ${cnt(total, "oameni")} ${sg(noTree, "și-a făcut cont, dar n-are", "și-au făcut cont, dar n-au")} niciun arbore. Pornirea pas cu pas îi duce acum direct la el; merită urmărit dacă numărul scade.`);
  const owners = people.filter((p) => p.owned > 0);
  const alone = owners.filter((p) => (p.mainTree?.members ?? 0) < 2).length;
  if (owners.length && alone) out.push(`${alone} din ${cnt(owners.length, "arbori")} ${sg(alone, "are", "au")} un singur om. Chemarea rudelor e pasul la care se opresc cei mai mulți: un îndemn după câteva zile („Trimite linkul mamei”) ar putea ajuta.`);
  const invites = people.reduce((s, p) => s + p.invites, 0), used = people.reduce((s, p) => s + p.invitesAccepted, 0);
  if (invites >= 3) out.push(`Din ${cnt(invites, "invitații")} ${sg(used, "s-a folosit", "s-au folosit")} ${used} (${pct(used, invites)}%). ${used < invites / 2 ? "Multe linkuri nu ajung la rude sau nu sunt deschise: un text gata scris pentru WhatsApp ar putea ajuta." : "Linkurile ajung la rude."}`);
  const withTree = people.filter((p) => p.trees > 0);
  const writers = withTree.filter((p) => p.memories > 0).length;
  if (withTree.length >= 3) out.push(`${pct(writers, withTree.length)}% din cei cu arbore au scris măcar o amintire.${writers < withTree.length / 3 ? " Întrebarea de duminică trimisă pe email sau pe telefon i-ar putea aduce înapoi." : ""}`);
  const old = people.filter((p) => p.createdAt && now.getTime() - new Date(p.createdAt).getTime() > 7 * DAY);
  if (old.length >= 3) {
    const back = old.filter((p) => p.returned).length;
    out.push(`Din ${cnt(old.length, "conturi")} mai vechi de o săptămână, ${back} (${pct(back, old.length)}%) ${sg(back, "s-a întors", "s-au întors")} după prima zi.`);
  }
  const phone = people.filter((p) => p.phone).length;
  if (total >= 3) out.push(`${pct(phone, total)}% intră și de pe telefon sau tabletă${phone > total / 2 ? ": aplicația pe telefon contează mai mult decât calculatorul." : "."}`);
  return out;
}

/* --------------------------- Fișa unui om --------------------------- */

/** „iPhone · Safari” din felul browserului; doar cât să se vadă de pe ce intră omul. */
export function deviceOf(ua: string | null | undefined) {
  const s = ua ?? "";
  const os = /iPhone/.test(s) ? "iPhone" : /iPad/.test(s) ? "iPad" : /Android/.test(s) ? "Android" : /Windows/.test(s) ? "Windows"
    : /Macintosh|Mac OS X/.test(s) ? "Mac" : /Linux/.test(s) ? "Linux" : "alt dispozitiv";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\//.test(s) ? "Opera" : /Firefox\//.test(s) ? "Firefox" : /CriOS|Chrome\//.test(s) ? "Chrome"
    : /Safari\//.test(s) ? "Safari" : "alt browser";
  return { label: `${os} · ${browser}`, phone: ["iPhone", "Android"].includes(os) };
}

export type PersonDetail = NonNullable<Awaited<ReturnType<typeof personDetail>>>;

/** Fișa unui om pentru panou: arborii lui, ce a făcut săptămână cu săptămână, capitolele în care scrie și de pe ce intră. */
export async function personDetail(db: Db, userId: string, now = new Date()) {
  const [me] = await peopleList(db, userId);
  if (!me) return null;
  const trees = await rows(db, sql`select t.id, t.name, t.created_at, m.role, m.joined_at, (t.owner_id = ${userId}) as owner,
      (select count(*) from person p where p.tree_id = t.id) as persons,
      (select count(*) from person p where p.tree_id = t.id and p.created_by = ${userId}) as by_him,
      (select count(*) from tree_member mm where mm.tree_id = t.id) as members,
      (select count(*) from document d where d.tree_id = t.id and d.file_key is not null) as files,
      (select max(p.updated_at) from person p where p.tree_id = t.id) as last_edit
    from tree_member m join tree t on t.id = m.tree_id where m.user_id = ${userId} order by persons desc`);
  const weeks = await rows(db, sql`with ev as (${EVENTS})
    select date_trunc('week', at) as week, kind, count(*) as c from ev
    where uid = ${userId} and at > now() - interval '12 weeks' group by 1, 2`);
  const chapters = await rows(db, sql`select chapter, count(*) as c from memory
    where author_id = ${userId} and chapter <> 'credinta' group by chapter order by c desc`);
  const devices = await rows(db, sql`select user_agent, count(*) as c, max(updated_at) as last from session
    where user_id = ${userId} group by user_agent order by last desc`);
  // Cum a crescut arborele lui principal: câte persoane avea la sfârșitul fiecărei săptămâni.
  const growth = me.mainTree ? await rows(db, sql`select date_trunc('week', created_at) as week, count(*) as c from person
    where tree_id = ${me.mainTree.id} group by 1 order by 1`) : [];

  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const weekKeys = Array.from({ length: 12 }, (_, i) => new Date(monday.getTime() - (11 - i) * 7 * DAY).toISOString().slice(0, 10));
  const byWeek = new Map(weekKeys.map((k) => [k, { week: k, intrari: 0, persoane: 0, amintiri: 0, poze: 0, altele: 0 }]));
  for (const w of weeks) {
    const slot = byWeek.get(iso(w.week)!.slice(0, 10));
    if (!slot) continue;
    const k = String(w.kind), c = n(w.c);
    if (k === "intrare") slot.intrari += c;
    else if (k === "persoana") slot.persoane += c;
    else if (k === "amintire") slot.amintiri += c;
    else if (k === "poza") slot.poze += c;
    else slot.altele += c;
  }
  let running = 0;
  const growthWeeks = growth.map((g) => ({ week: iso(g.week)!.slice(0, 10), total: (running += n(g.c)) }));
  const deviceRows = new Map<string, { label: string; phone: boolean; sessions: number; last: string | null }>();
  for (const d of devices) {
    const dev = deviceOf(d.user_agent as string | null);
    const cur = deviceRows.get(dev.label);
    if (cur) cur.sessions += n(d.c);
    else deviceRows.set(dev.label, { ...dev, sessions: n(d.c), last: iso(d.last) });
  }
  return {
    person: me,
    trees: trees.map((t) => ({
      id: String(t.id), name: String(t.name), createdAt: iso(t.created_at), joinedAt: iso(t.joined_at), role: String(t.role), owner: !!t.owner,
      persons: n(t.persons), byHim: n(t.by_him), members: n(t.members), files: n(t.files), lastEdit: iso(t.last_edit),
    })),
    weeks: [...byWeek.values()],
    growth: growthWeeks.slice(-12),
    chapters: chapters.map((c) => ({ label: CHAPTERS.find((x) => x.key === c.chapter)?.label ?? "Alte amintiri", count: n(c.c) })),
    devices: [...deviceRows.values()],
  };
}

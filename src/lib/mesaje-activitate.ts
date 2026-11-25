/**
 * Mesaje după ce face omul în cont (Daniel, 25.11.2026): reguli simple, fără învățare automată, scrise aici și arătate în
 * Admin → Învățare și conversii → „Mesaje după activitate”. Pleacă doar cât automatizarea `mesaje-activitate` e pornită în
 * Admin → Autonomie (OPRITĂ implicit), doar celor care au spus „Da” la sfaturile pe email (dezabonarea e cea de la vești),
 * cel mult un email de marketing pe zi pentru fiecare om (se uită și la emailurile din zilele gratuite și la celelalte),
 * fiecare regulă o singură dată (povestea cel mult o dată la 30 de zile). Lista „nu contacta” o verifică sendEmail.
 *
 * Texte în română și în engleză (engleza pentru celelalte limbi), ca la emailul de reactivare din CRM.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { automationMark } from "@/db/schema";
import { realAccountSql } from "./conturi-test";
import { isPlaceholder } from "./family";
import { accessFor, accountPlans, planSettings } from "./plans";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;
export const AUTO_KEY = "mesaje-activitate";
export const DAILY_LIMIT = 50;
/** O poveste din arbore cel mult o dată la atâtea zile. */
export const STORY_EVERY_DAYS = 30;

export const RULES = ["inceput", "rude", "bunici", "poze", "poveste"] as const;
export type Rule = (typeof RULES)[number];

export const RULE_LABEL: Record<Rule, { title: string; when: string }> = {
  inceput: { title: "„Începe cu părinții și bunicii”", when: "e în zilele gratuite, a trecut cel puțin o zi de la cont și are sub 3 persoane în arbore" },
  rude: { title: "„Cheamă o rudă care știe mai mult”", when: "are cel puțin 5 persoane, n-a invitat pe nimeni și contul are cel puțin 3 zile" },
  bunici: { title: "„Completează și bunicii”", when: "are cel puțin 10 persoane, dar îi lipsește cel puțin un bunic sau o bunică (din fișa lui)" },
  poze: { title: "„O poză veche face arborele viu”", when: "are cel puțin 10 persoane și nicio poză" },
  poveste: { title: "O poveste din arborele lui", when: "n-a mai intrat de 3–21 de zile și are cel puțin 3 persoane (cel mult o dată la 30 de zile)" },
};

export type ActivityFacts = {
  persons: number; invites: number; photos: number;
  /** zile de la crearea contului */
  ageDays: number;
  /** zile de la ultima intrare (null = nu știm) */
  idleDays: number | null;
  inTrial: boolean;
  /** câți dintre cei 4 bunici ai fișei lui lipsesc (null = n-are fișa lui în arbore) */
  missingGrandparents: number | null;
  /** omul din arbore despre care scriem povestea (cel mai vechi cu an) */
  story: Story | null;
};
export type Story = { treeId: string; personId: string; given: string; name: string; sex: string; year: number; place: string | null; bio: string | null };

/** Prima regulă care se potrivește și n-a mai fost trimisă. Pură, ca să se poată testa. `storyAt` = când a plecat ultima poveste. */
export function pickRule(f: ActivityFacts, sent: ReadonlySet<Rule>, storyAt: Date | null, now: Date): Rule | null {
  const can = (r: Rule) => !sent.has(r);
  if (can("inceput") && f.inTrial && f.ageDays >= 1 && f.persons < 3) return "inceput";
  if (can("rude") && f.persons >= 5 && f.invites === 0 && f.ageDays >= 3) return "rude";
  if (can("bunici") && f.persons >= 10 && f.missingGrandparents != null && f.missingGrandparents > 0) return "bunici";
  if (can("poze") && f.persons >= 10 && f.photos === 0) return "poze";
  const storyOk = !storyAt || now.getTime() - storyAt.getTime() >= STORY_EVERY_DAYS * DAY;
  if (storyOk && f.story && f.persons >= 3 && f.idleDays != null && f.idleDays >= 3 && f.idleDays <= 21) return "poveste";
  return null;
}

/* ---------- Textele ---------- */

type Mail = { subject: string; paragraphs: string[]; button: string; path: string };

export function messageFor(rule: Rule, locale: string, name: string, f: ActivityFacts, treeId: string | null): Mail {
  const ro = locale === "ro";
  const first = name.split(" ")[0] || name;
  const tree = treeId ? `/arbore/${treeId}` : "/";
  const s = f.story;
  switch (rule) {
    case "inceput":
      return ro
        ? { subject: "Începe cu părinții și bunicii", path: tree, button: "Deschide arborele",
            paragraphs: [`Bună, ${first}!`, "Cel mai ușor început: trece-ți părinții, apoi bunicii din ambele părți. Ajung numele și, dacă le știi, anul și satul. Durează cinci minute și arborele prinde deja formă.", "Nu știi un nume? Lasă-l gol: îl poate completa o rudă mai târziu."] }
        : { subject: "Start with your parents and grandparents", path: tree, button: "Open the tree",
            paragraphs: [`Hello ${first},`, "The easiest start: add your parents, then your grandparents on both sides. Names are enough, plus the year and village if you know them. It takes five minutes and the tree already takes shape.", "Don’t know a name? Leave it empty: a relative can fill it in later."] };
    case "rude":
      return ro
        ? { subject: "Cine din familie știe mai multe?", path: tree, button: "Invită o rudă",
            paragraphs: [`Bună, ${first}!`, `Arborele are deja ${f.persons} persoane. Cel mai repede crește când vin și rudele: o mătușă sau un unchi își amintește nume pe care nu le găsești nicăieri.`, "Trimite-le invitația pe WhatsApp din pagina arborelui. Ei adaugă ce știu, iar tu vezi totul într-un singur loc."] }
        : { subject: "Who in the family knows more?", path: tree, button: "Invite a relative",
            paragraphs: [`Hello ${first},`, `Your tree already has ${f.persons} people. It grows fastest when relatives join: an aunt or uncle remembers names you won’t find anywhere else.`, "Send them the invitation on WhatsApp from the tree page. They add what they know, and you see everything in one place."] };
    case "bunici":
      return ro
        ? { subject: "Completează și bunicii", path: tree, button: "Completează bunicii",
            paragraphs: [`Bună, ${first}!`, `Ai ajuns la ${f.persons} de persoane în arbore, frumos! Mai lipsesc ${f.missingGrandparents === 1 ? "un bunic" : `${f.missingGrandparents} dintre bunici`} din fișa ta.`, "Bunicii sunt puntea spre străbunici: de la ei pornesc cele două spițe ale neamului. Un nume și satul lor ajung pentru început; o rudă mai în vârstă te poate ajuta cu restul."] }
        : { subject: "Add your grandparents too", path: tree, button: "Add your grandparents",
            paragraphs: [`Hello ${first},`, `You already have ${f.persons} people in your tree, well done! ${f.missingGrandparents === 1 ? "One grandparent is" : `${f.missingGrandparents} grandparents are`} still missing from your own profile.`, "Grandparents are the bridge to your great-grandparents. A name and their village are enough to start; an older relative can help with the rest."] };
    case "poze":
      return ro
        ? { subject: "O poză veche face arborele viu", path: tree, button: "Pune o poză",
            paragraphs: [`Bună, ${first}!`, `Arborele are ${f.persons} de persoane, dar încă nicio poză. O singură fotografie veche, pusă pe fișa bunicilor, îl face viu: rudele recunosc imediat oamenii și își amintesc povești.`, "Poți fotografia cu telefonul o poză de pe perete sau din album, direct din fișa omului."] }
        : { subject: "An old photo brings the tree to life", path: tree, button: "Add a photo",
            paragraphs: [`Hello ${first},`, `Your tree has ${f.persons} people but no photos yet. A single old photo on your grandparents’ profile brings it to life: relatives recognise people at once and remember stories.`, "You can photograph a picture from the wall or an album with your phone, straight from the person’s profile."] };
    case "poveste": {
      const place = s?.place ? (ro ? ` în ${s.place}` : ` in ${s.place}`) : "";
      const bio = s?.bio ? s.bio.replace(/\s+/g, " ").trim().slice(0, 240) : null;
      const path = s ? `/arbore/${s.treeId}/persoana/${s.personId}` : tree;
      return ro
        ? { subject: `${s?.name ?? "Un strămoș"}, din arborele tău`, path, button: `Deschide fișa lui ${s?.given ?? ""}`.trim(),
            paragraphs: [`Bună, ${first}!`, `Din arborele tău: ${s?.name}, ${s?.sex === "F" ? "născută" : "născut"} pe la ${s?.year}${place}, e cel mai vechi om cu an din neamul vostru de acolo.`,
              ...(bio ? [`Ce ați scris despre ${s?.given}: „${bio}${s!.bio!.length > 240 ? "…" : ""}”`] : [`Încă nu s-a scris nimic despre ${s?.given}. Ce se mai povestește în familie despre ${s?.sex === "F" ? "ea" : "el"}? O amintire de două rânduri, o poză sau satul de unde venea fac mult pentru cei care vin după voi.`])] }
        : { subject: `${s?.name ?? "An ancestor"}, from your family tree`, path, button: `Open ${s?.given ?? "the"}’s profile`,
            paragraphs: [`Hello ${first},`, `From your tree: ${s?.name}, born around ${s?.year}${place}, is the oldest person with a known year in your family there.`,
              ...(bio ? [`What you wrote about ${s?.given}: “${bio}${s!.bio!.length > 240 ? "…" : ""}”`] : [`Nothing has been written about ${s?.given} yet. What does the family still say about them? A two-line memory, a photo or the village they came from mean a lot to those who come after you.`])] };
    }
  }
}

/* ---------- Cine primește ce ---------- */

type Cand = { id: string; name: string; email: string; locale: string; created_at: string; last: string | null; persons: number; invites: number; photos: number; tree_id: string | null };

/** Conturile reale cu acordul pentru vești dat, cu semnalele lor (doar arborii pe care îi au în grijă). */
export async function activityCandidates(db: Db): Promise<Cand[]> {
  return rows<Cand>(db, sql`
    with last_news as (select distinct on (user_id) user_id, granted from consent where purpose = 'news' order by user_id, created_at desc)
    select u.id, u.name, u.email, u.locale, u.created_at,
      (select max(s.updated_at) from session s where s.user_id = u.id) as last,
      (select count(*) from person p join tree t on t.id = p.tree_id where t.owner_id = u.id) as persons,
      (select count(*) from invitation i where i.created_by = u.id) as invites,
      (select count(*) from document d join tree t on t.id = d.tree_id where t.owner_id = u.id and d.kind = 'photo') as photos,
      (select t.id from tree t where t.owner_id = u.id order by (select count(*) from person p where p.tree_id = t.id) desc, t.id limit 1) as tree_id
    from "user" u join last_news ln on ln.user_id = u.id and ln.granted
    where ${realAccountSql("u")}
    order by u.created_at`);
}

/** Câți dintre cei 4 bunici lipsesc din fișa omului (fișa revendicată de el în arborele lui). */
async function missingGrandparents(db: Db, userId: string, treeId: string): Promise<number | null> {
  const [me] = await rows<{ id: string }>(db, sql`select id from person where tree_id = ${treeId} and claimed_by_user_id = ${userId} limit 1`);
  if (!me) return null;
  const parentsOf = async (ids: string[]) => ids.length ? rows<{ id: string; given: string }>(db, sql`
    select p.id, p.given_name as given from relationship r join person p on p.id = r.person_a
    where r.tree_id = ${treeId} and r.type = 'parent_child' and r.person_b in (${sql.join(ids.map((x) => sql`${x}`), sql`, `)})`) : [];
  const parents = (await parentsOf([me.id])).filter((p) => !isPlaceholder(p.given));
  const grand = (await parentsOf(parents.map((p) => p.id))).filter((p) => !isPlaceholder(p.given));
  return Math.max(0, 4 - grand.length);
}

/** Cel mai vechi om cu an din arbore (mort, nediscret, cu nume adevărat). */
async function storyOf(db: Db, treeId: string): Promise<Story | null> {
  const r = await rows<Row>(db, sql`select id, given_name, surname, sex, extract(year from birth_from)::int as year, birth_place, biography
    from person where tree_id = ${treeId} and not living and not discreet and birth_from is not null and given_name <> ''
    order by birth_from, id limit 10`);
  const x = r.find((p) => !isPlaceholder(String(p.given_name)));
  if (!x) return null;
  return { treeId, personId: String(x.id), given: String(x.given_name), name: `${x.given_name} ${x.surname ?? ""}`.trim(), sex: String(x.sex), year: n(x.year),
    place: (x.birth_place as string) || null, bio: (x.biography as string) || null };
}

export type Planned = { userId: string; name: string; email: string; locale: string; rule: Rule; mail: Mail; facts: ActivityFacts };

/** Ce ar pleca azi (fără să trimită nimic): pentru previzualizarea din Admin și pentru trimitere. */
export async function planActivity(db: Db, now = new Date()): Promise<{ planned: Planned[]; busyToday: number; observed: number }> {
  const people = await activityCandidates(db);
  if (!people.length) return { planned: [], busyToday: 0, observed: 0 };
  const since = new Date(now.getTime() - 20 * 3_600_000).toISOString();
  const [marks, busy, settings, plans, ] = await Promise.all([
    rows<{ ref: string; at: string }>(db, sql`select ref, at from automation_mark where automation = ${AUTO_KEY}`),
    // Cine a primit deja azi un email de marketing de la noi: din zilele gratuite, sfaturile de bun venit, CRM, surse publice sau de aici.
    rows<{ id: string }>(db, sql`
      select user_id as id from conversion_mail where sent_at > ${since}
      union select split_part(ref, ':', 1) from automation_mark where at > ${since} and automation in ('bun-venit','crm-reactivare','aproape-plata','surse-publice',${AUTO_KEY})`),
    planSettings(db), accountPlans(db),
  ]);
  const busyIds = new Set(busy.map((b) => b.id));
  const sentBy = new Map<string, Set<Rule>>(), storyAt = new Map<string, Date>();
  for (const m of marks) {
    const [uid, rule] = m.ref.split(":");
    if (!sentBy.has(uid)) sentBy.set(uid, new Set());
    sentBy.get(uid)!.add(rule as Rule);
    if (rule === "poveste") { const at = new Date(m.at); if (!storyAt.has(uid) || storyAt.get(uid)! < at) storyAt.set(uid, at); }
  }
  const planned: Planned[] = [];
  for (const u of people) {
    if (busyIds.has(u.id)) continue;
    const ap = plans.get(u.id);
    const access = accessFor({ createdAt: new Date(u.created_at), plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, tier: ap?.tier,
      keepUntil: ap?.keepUntil ? new Date(ap.keepUntil) : null }, settings, now);
    const last = u.last ? new Date(u.last) : null;
    const base = {
      persons: n(u.persons), invites: n(u.invites), photos: n(u.photos),
      ageDays: Math.floor((now.getTime() - new Date(u.created_at).getTime()) / DAY),
      idleDays: last ? Math.floor((now.getTime() - last.getTime()) / DAY) : null,
      inTrial: access.kind === "proba",
    };
    // Bunicii și povestea se caută doar când pot conta (sunt câteva interogări pe cont).
    const missing = u.tree_id && base.persons >= 10 ? await missingGrandparents(db, u.id, u.tree_id) : null;
    const story = u.tree_id && base.persons >= 3 && base.idleDays != null && base.idleDays >= 3 && base.idleDays <= 21 ? await storyOf(db, u.tree_id) : null;
    const facts: ActivityFacts = { ...base, missingGrandparents: missing, story };
    const rule = pickRule(facts, sentBy.get(u.id) ?? new Set(), storyAt.get(u.id) ?? null, now);
    if (!rule) continue;
    planned.push({ userId: u.id, name: u.name ?? "", email: u.email, locale: u.locale ?? "ro", rule, mail: messageFor(rule, u.locale ?? "ro", u.name ?? "", facts, u.tree_id), facts });
  }
  return { planned, busyToday: busyIds.size, observed: people.length };
}

type Mailer = (m: { to: string; subject: string; html: string; text: string; tag: string; idempotencyKey?: string; headers?: Record<string, string>; marketing?: boolean }) => Promise<{ ok?: boolean; skipped?: boolean }>;
const defaultMailer: Mailer = async (m) => {
  const r = await (await import("./email")).sendEmail(m);
  return "skipped" in r ? { skipped: true } : { ok: r.ok };
};

/** Trimite ce e de trimis azi, cel mult DAILY_LIMIT. Fără emailuri reale în teste (mailer dat de test). */
export async function runActivityMessages(db: Db, o: { now?: Date; mailer?: Mailer; limit?: number; siteUrl?: string } = {}) {
  const now = o.now ?? new Date();
  const site = o.siteUrl ?? (await import("./site-url")).SITE_URL;
  const mailer = o.mailer ?? defaultMailer;
  const { planned, observed } = await planActivity(db, now);
  const { unsubscribeToken } = await import("./crestere");
  const { footerFor, renderMail } = await import("./emailuri");
  const { isLocale } = await import("@/i18n/locales");
  const out = { observed, due: planned.length, sent: 0, skipped: 0, failed: 0, byRule: {} as Partial<Record<Rule, number>> };
  for (const p of planned) {
    if (out.sent >= (o.limit ?? DAILY_LIMIT)) break;
    const ro = p.locale === "ro";
    const tok = unsubscribeToken(p.userId);
    const sep = p.mail.path.includes("?") ? "&" : "?";
    const { html, text } = renderMail([
      ...p.mail.paragraphs.map((x) => ({ p: x })),
      { button: p.mail.button, href: `${site}${p.mail.path}${sep}utm_source=email&utm_medium=email&utm_campaign=activitate-${p.rule}` },
      { note: ro ? "Primești acest email pentru că ai spus „Da” la sfaturile pe email." : "You are receiving this email because you said “Yes” to tips by email.",
        link: ro ? "Dezabonează-te dintr-un clic" : "Unsubscribe in one click", href: `${site}/dezabonare?u=${encodeURIComponent(p.userId)}&t=${tok}` },
    ], await footerFor(isLocale(p.locale) ? p.locale : "ro"));
    const ref = p.rule === "poveste" ? `${p.userId}:poveste:${now.toISOString().slice(0, 10)}` : `${p.userId}:${p.rule}`;
    const r = await mailer({ to: p.email, subject: p.mail.subject, html, text, tag: `activitate-${p.rule}`, marketing: true, idempotencyKey: `activitate-${ref}`,
      headers: { "List-Unsubscribe": `<${site}/api/vesti/dezabonare?u=${encodeURIComponent(p.userId)}&t=${tok}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    if (r.ok) {
      await db.insert(automationMark).values({ automation: AUTO_KEY, ref, at: now }).onConflictDoNothing();
      out.sent++;
      out.byRule[p.rule] = (out.byRule[p.rule] ?? 0) + 1;
    } else if (r.skipped) out.skipped++;
    else out.failed++;
  }
  return out;
}

/** Câte au plecat pe fiecare regulă (pentru Admin). */
export async function activityStats(db: Db) {
  const r = await rows<{ rule: string; c: number; last: string }>(db, sql`select split_part(ref, ':', 2) as rule, count(*) as c, max(at) as last from automation_mark where automation = ${AUTO_KEY} group by 1`);
  return Object.fromEntries(r.map((x) => [x.rule, { count: n(x.c), last: x.last ? new Date(x.last).toISOString() : null }])) as Partial<Record<Rule, { count: number; last: string | null }>>;
}

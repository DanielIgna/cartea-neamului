/**
 * „Invită-l pe [nume] să completeze ramura lui” (Daniel, 17.11.2026): după ce arborele are 5 persoane, pe pagina arborelui
 * apare un îndemn vizibil, cu WhatsApp, link și email, pentru o rudă în viață care încă nu și-a revendicat fișa. Linkul e
 * invitația obișnuită în arbore, legată de fișa rudei (o poate revendica la intrare).
 *
 * Măsurat în Admin → Creștere, din `automation_mark` (fără tabel nou):
 * - `ramura-afisata`  ref `<userId>:<personId>`: îndemnul a fost arătat (o dată pe om și rudă);
 * - `ramura-link`     ref `<treeId>:<personId>`: s-a făcut linkul din îndemn;
 * - acceptate: invitațiile pentru acea fișă primite de rudă (invitation.person_id + accepted_at);
 * - vizitele venite pe linkurile trimise: campania `ramura` din Analiză.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { automationMark } from "@/db/schema";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
export const BRANCH_MIN_PERSONS = 5;
export const BRANCH_CAMPAIGN = "ramura";

export type BranchPick = { personId: string; name: string; sex: "M" | "F" | "U"; count: number };

/**
 * Pe cine să cheme: o rudă în viață, cu prenume, fără cont legat de fișă și fără invitație primită. Întâi părinții omului,
 * apoi frații, bunicii, copiii, apoi oricine altcineva în viață. Nimic, dacă arborele are sub 5 persoane.
 */
export async function branchPick(db: Db, treeId: string, userId: string): Promise<BranchPick | null> {
  const [c] = await rows(db, sql`select count(*) as c from person where tree_id = ${treeId}`);
  const count = Number(c?.c ?? 0);
  if (count < BRANCH_MIN_PERSONS) return null;
  const list = await rows<{ id: string; given_name: string; sex: "M" | "F" | "U"; score: number }>(db, sql`
    with me as (select id from person where tree_id = ${treeId} and claimed_by_user_id = ${userId} limit 1),
    parents as (select r.person_a as id from relationship r, me where r.type = 'parent_child' and r.person_b = me.id),
    sibs as (select r.person_b as id from relationship r where r.type = 'parent_child' and r.person_a in (select id from parents)),
    grand as (select r.person_a as id from relationship r where r.type = 'parent_child' and r.person_b in (select id from parents)),
    kids as (select r.person_b as id from relationship r, me where r.type = 'parent_child' and r.person_a = me.id)
    select p.id, p.given_name, p.sex,
      case when p.id in (select id from parents) then 4 when p.id in (select id from sibs) then 3
           when p.id in (select id from grand) then 2 when p.id in (select id from kids) then 1 else 0 end as score
    from person p
    where p.tree_id = ${treeId} and p.living and not p.discreet and p.claimed_by_user_id is null and trim(p.given_name) <> ''
      and p.id not in (select id from me)
      and not exists (select 1 from invitation i where i.person_id = p.id and i.accepted_at is not null)
    order by score desc, p.birth_from asc nulls last, p.created_at asc
    limit 1`);
  const p = list[0];
  return p ? { personId: String(p.id), name: p.given_name.trim(), sex: p.sex, count } : null;
}

export const markBranchShown = (db: Db, userId: string, personId: string) =>
  db.insert(automationMark).values({ automation: "ramura-afisata", ref: `${userId}:${personId}` }).onConflictDoNothing();
export const markBranchLink = (db: Db, treeId: string, personId: string) =>
  db.insert(automationMark).values({ automation: "ramura-link", ref: `${treeId}:${personId}` }).onConflictDoNothing();

/** Cifrele pentru Admin → Creștere. */
export async function branchStats(db: Db) {
  const [r] = await rows(db, sql`select
      (select count(*) from automation_mark where automation = 'ramura-afisata') as shown,
      (select count(distinct split_part(ref, ':', 1)) from automation_mark where automation = 'ramura-afisata') as users,
      (select count(*) from automation_mark where automation = 'ramura-link') as links,
      (select count(*) from automation_mark k join invitation i on i.person_id::text = split_part(k.ref, ':', 2) and i.accepted_at is not null
        where k.automation = 'ramura-link') as accepted,
      (select count(distinct visitor) from page_view where day > current_date - 30 and campaign = ${BRANCH_CAMPAIGN}) as visitors30`)
    .catch(() => [{} as Row]);
  const num = (v: unknown) => Number(v ?? 0) || 0;
  return { shown: num(r?.shown), users: num(r?.users), links: num(r?.links), accepted: num(r?.accepted), visitors30: num(r?.visitors30) };
}

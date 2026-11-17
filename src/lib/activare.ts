/**
 * Activarea (Daniel, 17.11.2026): 6 din 18 conturi nu aveau arbore. După înscriere omul ajunge direct la primii pași
 * („Adaugă-te pe tine, apoi pe părinți și bunici”, src/components/QuickStart.tsx). Cine nu și-a făcut arborele în 24 de ore
 * primește un singur email, în limba lui, cu legătura directă la acest pas (/primii-pasi).
 *
 * E un email despre cont, anunțat la înscriere („În zilele gratuite îți trimitem câteva emailuri scurte despre cont”), cu
 * aceeași dezabonare dintr-un clic ca emailurile din zilele gratuite (acordul `conversie`): cine s-a dezabonat nu-l primește.
 * Pleacă din automatizarea „activare” (Admin → Autonomie), o dată pentru fiecare cont, doar în fereastra 24–96 de ore.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { automationMark } from "@/db/schema";
import { realAccountSql } from "./conturi-test";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const HOUR = 3_600_000;
/** Fereastra în care pleacă emailul: după 24 de ore, dar nu mai târziu de 4 zile (un cont vechi nu-l mai primește). */
export const ACTIVATION_FROM_H = 24;
export const ACTIVATION_TO_H = 96;
export const ACTIVATION_KEY = "activare";
export const ACTIVATION_PATH = "/primii-pasi";

export type ActivationCandidate = { id: string; name: string; email: string; locale: string | null };

/** Conturile reale de 24–96 de ore, fără niciun arbore (nici al lor, nici al rudelor), nedezabonate, încă fără emailul acesta. */
export async function activationCandidates(db: Db, now = new Date()): Promise<ActivationCandidate[]> {
  const from = new Date(now.getTime() - ACTIVATION_TO_H * HOUR).toISOString();
  const to = new Date(now.getTime() - ACTIVATION_FROM_H * HOUR).toISOString();
  return rows<ActivationCandidate>(db, sql`
    select u.id, u.name, u.email, u.locale from "user" u
    where u.created_at between ${from}::timestamp and ${to}::timestamp and ${realAccountSql("u")}
      and not exists (select 1 from tree_member m where m.user_id = u.id)
      and not exists (select 1 from tree t where t.owner_id = u.id)
      and coalesce((select c.granted from consent c where c.user_id = u.id and c.purpose = 'conversie' order by c.created_at desc limit 1), true)
      and not exists (select 1 from automation_mark k where k.automation = ${ACTIVATION_KEY} and k.ref = u.id)`);
}

export const markActivationSent = (db: Db, userId: string, now = new Date()) =>
  db.insert(automationMark).values({ automation: ACTIVATION_KEY, ref: userId, at: now }).onConflictDoNothing();

/** Pentru Admin → Creștere: câte emailuri au plecat și câți și-au făcut arborele după el. */
export async function activationStats(db: Db) {
  const [r] = await rows(db, sql`select count(*) as sent,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = k.ref and t.created_at > k.at)) as started
    from automation_mark k where k.automation = ${ACTIVATION_KEY}`).catch(() => [{} as Row]);
  const [w] = await rows(db, sql`select count(*) as all_users,
      count(*) filter (where not exists (select 1 from tree_member m where m.user_id = u.id)) as no_tree
    from "user" u where ${realAccountSql("u")}`).catch(() => [{} as Row]);
  const num = (v: unknown) => Number(v ?? 0) || 0;
  return { sent: num(r?.sent), started: num(r?.started), users: num(w?.all_users), noTree: num(w?.no_tree) };
}

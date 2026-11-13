import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { DEMO_EMAIL } from "@/lib/demo";
import { fold } from "./nume";

/**
 * Câți oameni și câte familii cu un nume de familie sunt în Cartea Neamului, pentru paginile publice /nume.
 * Confidențialitate: doar totaluri, niciodată un nume, o dată, un loc sau un arbore anume; o cifră apare doar dacă numele
 * e în cel puțin MIN_TREES arbori diferiți și la cel puțin MIN_PERSONS persoane, iar numărul de persoane e rotunjit în jos
 * la multiplu de 5 („peste 20”). Arborele de probă nu se numără.
 */
export const MIN_PERSONS = 5;
export const MIN_TREES = 5;

export type RawStat = { persons: number; trees: number };
export type PublicStat = { personsAtLeast: number; trees: number };

/** Ce se poate arăta public dintr-un total, sau null dacă e sub prag. */
export function publicStat(raw: RawStat | undefined | null): PublicStat | null {
  if (!raw || raw.persons < MIN_PERSONS || raw.trees < MIN_TREES) return null;
  return { personsAtLeast: Math.floor(raw.persons / 5) * 5, trees: raw.trees };
}

/** Totalurile pe nume (numele de familie și numele de fată), fără diacritice și fără litere mari. */
export async function surnameTotals(db: Pick<Db, "execute">): Promise<Map<string, RawStat>> {
  const r = await db.execute(sql`
    select n, count(distinct pid)::int as persons, count(distinct tid)::int as trees from (
      select p.id as pid, p.tree_id as tid, lower(trim(p.surname)) as n from person p
        join tree t on t.id = p.tree_id left join "user" u on u.id = t.owner_id
        where coalesce(lower(u.email), '') <> ${DEMO_EMAIL}
      union
      select p.id, p.tree_id, lower(trim(p.birth_surname)) from person p
        join tree t on t.id = p.tree_id left join "user" u on u.id = t.owner_id
        where p.birth_surname is not null and coalesce(lower(u.email), '') <> ${DEMO_EMAIL}
    ) x where n <> '' group by n`);
  const out = new Map<string, RawStat>();
  // Diacriticele se scot aici (în baza de date pot fi ș sau ş): „Mureșan” și „Muresan” se adună.
  const byFold = new Map<string, { pids: number; trees: number }>();
  for (const row of (r.rows ?? []) as { n: string; persons: number; trees: number }[]) {
    const k = fold(row.n);
    const prev = byFold.get(k);
    // Pentru grafii diferite ale aceluiași nume luăm valoarea cea mai mare (nu suma), ca să nu umflăm cifra.
    byFold.set(k, { pids: Math.max(prev?.pids ?? 0, Number(row.persons)), trees: Math.max(prev?.trees ?? 0, Number(row.trees)) });
  }
  for (const [k, v] of byFold) out.set(k, { persons: v.pids, trees: v.trees });
  return out;
}

let memo: { at: number; data: Map<string, RawStat> } | null = null;
/** Totalurile, ținute 10 minute în memorie (paginile se reîmprospătează tot din 10 în 10 minute); fără bază, nimic. */
export async function cachedSurnameTotals(db: Pick<Db, "execute">, now = Date.now()): Promise<Map<string, RawStat>> {
  if (memo && now - memo.at < 600_000) return memo.data;
  const data = await surnameTotals(db).catch(() => new Map<string, RawStat>());
  memo = { at: now, data };
  return data;
}

export async function surnamePublicStat(db: Pick<Db, "execute">, name: string): Promise<PublicStat | null> {
  return publicStat((await cachedSurnameTotals(db)).get(fold(name)));
}

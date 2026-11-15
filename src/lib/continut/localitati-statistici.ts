import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { DEMO_EMAIL } from "@/lib/demo";
import { MIN_TREES } from "./nume-statistici";

/**
 * Câte familii din Cartea Neamului au rădăcini într-o comună și ce nume de familie poartă, pentru paginile publice de localități.
 * Confidențialitate: doar arborii ai căror proprietari au ales să poată fi găsiți („Din aceleași locuri”), fără arborele de probă;
 * doar totaluri, niciodată un arbore, o persoană sau o dată. Numărul de arbori apare doar de la MIN_TREES în sus, iar un nume
 * apare doar dacă e în cel puțin MIN_TREES arbori diferiți cu rădăcini acolo.
 */
export type AreaStat = { trees: number; surnames: { name: string; trees: number }[] };
export type RawArea = { trees: number; surnames: Map<string, { name: string; trees: number }> };

export function publicAreaStat(raw: RawArea | undefined | null): AreaStat | null {
  if (!raw || raw.trees < MIN_TREES) return null;
  const surnames = [...raw.surnames.values()].filter((s) => s.trees >= MIN_TREES).sort((a, b) => b.trees - a.trees || a.name.localeCompare(b.name, "ro")).slice(0, 20);
  return { trees: raw.trees, surnames };
}

export async function areaTotals(db: Pick<Db, "execute">): Promise<Map<string, RawArea>> {
  const r = await db.execute(sql`
    select tp.area as area, tp.tree_id as tid, tp.surnames as surnames from tree_place tp
      join tree t on t.id = tp.tree_id left join "user" u on u.id = t.owner_id
      where tp.area is not null and t.discoverable = true and coalesce(lower(u.email), '') <> ${DEMO_EMAIL}`);
  const trees = new Map<string, Set<string>>();
  const names = new Map<string, Map<string, { name: string; trees: Set<string> }>>();
  for (const row of (r.rows ?? []) as { area: string; tid: string; surnames: string }[]) {
    (trees.get(row.area) ?? trees.set(row.area, new Set()).get(row.area)!).add(row.tid);
    const m = names.get(row.area) ?? names.set(row.area, new Map()).get(row.area)!;
    for (const raw of (row.surnames ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
      const k = raw.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const e = m.get(k) ?? m.set(k, { name: raw, trees: new Set() }).get(k)!;
      e.trees.add(row.tid);
    }
  }
  const out = new Map<string, RawArea>();
  for (const [area, t] of trees) {
    out.set(area, { trees: t.size, surnames: new Map([...(names.get(area) ?? new Map()).entries()].map(([k, v]) => [k, { name: v.name, trees: v.trees.size }])) });
  }
  return out;
}

let memo: { at: number; data: Map<string, RawArea> } | null = null;
/** Totalurile, ținute 10 minute în memorie; fără bază, nimic. */
export async function areaPublicStat(db: Pick<Db, "execute">, area: string, now = Date.now()): Promise<AreaStat | null> {
  if (!memo || now - memo.at >= 600_000) memo = { at: now, data: await areaTotals(db).catch(() => new Map<string, RawArea>()) };
  return publicAreaStat(memo.data.get(area));
}

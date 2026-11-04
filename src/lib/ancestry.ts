import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { isPlaceholder } from "./family";

export type AncestorRow = { id: string; childId: string | null; gen: number; sex: "M" | "F" | "U"; givenName?: string | null };

/** Ascendenții unei persoane pe `maxGen` generații, într-o singură interogare recursivă. */
export async function fetchAncestorRows(db: Db, rootId: string, maxGen = 4): Promise<AncestorRow[]> {
  const res = await db.execute(sql`
    WITH RECURSIVE anc(id, child_id, gen, sex, given) AS (
      SELECT p.id, NULL::uuid, 0, p.sex, p.given_name FROM person p WHERE p.id = ${rootId}
      UNION ALL
      SELECT p.id, anc.id, anc.gen + 1, p.sex, p.given_name
      FROM anc
      JOIN relationship r ON r.type = 'parent_child' AND r.person_b = anc.id
      JOIN person p ON p.id = r.person_a
      WHERE anc.gen < ${maxGen}
    )
    SELECT id, child_id AS "childId", gen, sex, given AS "givenName" FROM anc`);
  return (res as unknown as { rows: AncestorRow[] }).rows.map((r) => ({ ...r, gen: Number(r.gen) }));
}

/**
 * Numerotare Ahnentafel (Sosa-Stradonitz): 1 = persoana centrală, 2n = tatăl lui n, 2n+1 = mama lui n.
 * Locul se dă după sexul din fișă. Când doi părinți vor același loc, îl ia întâi părintele adevărat, nu un „Tată necunoscut”
 * pus automat (acela rămâne pe dinafară). Un al doilea părinte adevărat de același sex (de obicei mama trecută din greșeală
 * ca bărbat) și un părinte cu sex necunoscut primesc locul rămas liber, ca să nu dispară pe tăcute din desen cu tot neamul lui.
 */
export function toAhnentafel(rows: AncestorRow[]): Map<number, string> {
  const out = new Map<number, string>();
  const root = rows.find((r) => r.gen === 0);
  if (!root) return out;
  out.set(1, root.id);
  const byGen = new Map<number, AncestorRow[]>();
  for (const r of rows) if (r.gen > 0) byGen.set(r.gen, [...(byGen.get(r.gen) ?? []), r]);
  const blank = (r: AncestorRow) => !!r.givenName && isPlaceholder(r.givenName);
  // întâi cei cu sexul știut, apoi ceilalți; la fiecare, întâi oamenii adevărați, apoi „necunoscuții”
  const rank = (r: AncestorRow) => (r.sex === "U" ? 2 : 0) + (blank(r) ? 1 : 0);
  // numerele copiilor din generația anterioară (o persoană poate apărea de mai multe ori: implex)
  let prev = new Map<string, number[]>([[root.id, [1]]]);
  for (let g = 1; byGen.has(g); g++) {
    const next = new Map<string, number[]>();
    const rowsG = [...byGen.get(g)!].sort((a, b) => rank(a) - rank(b));
    for (const r of rowsG) {
      for (const n of prev.get(r.childId!) ?? []) {
        let slot = r.sex === "F" ? 2 * n + 1 : 2 * n;
        if (out.has(slot) && (r.sex === "U" || !blank(r))) slot = slot === 2 * n ? 2 * n + 1 : 2 * n;
        if (out.has(slot)) continue;
        out.set(slot, r.id);
        next.set(r.id, [...(next.get(r.id) ?? []), slot]);
      }
    }
    prev = next;
  }
  return out;
}

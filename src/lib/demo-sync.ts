import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { person, relationship } from "@/db/schema";
import { DEMO, DEMO_EXTRAS } from "./demo-data";
import { parseFuzzyDate } from "./dates";

/**
 * Aduce arborele de exemplu la zi cu `DEMO` și `DEMO_EXTRAS`, fără să șteargă sau să schimbe ce există:
 * adaugă doar persoanele lipsă (după xref-ul GEDCOM) și legăturile lor. Se poate rula de câte ori vrei.
 */
export async function syncDemo(db: Db, treeId: string) {
  const rows = await db.select({ id: person.id, xref: person.gedcomXref }).from(person).where(eq(person.treeId, treeId));
  const byXref = new Map(rows.filter((r) => r.xref).map((r) => [r.xref!, r.id]));
  let added = 0;
  const insert = async (xref: string, d: { given: string; surname: string; born?: string; b: string; bp: string; d?: string; dp?: string; occ?: string; note?: string }, sex: "M" | "F", living: boolean) => {
    const b = parseFuzzyDate(d.b), dd = parseFuzzyDate(d.d);
    const [p] = await db.insert(person).values({
      treeId, givenName: d.given, surname: d.surname, birthSurname: d.born, sex, gedcomXref: xref,
      birthDateText: d.b, birthFrom: b.from, birthTo: b.to, birthPlace: d.bp,
      deathDateText: d.d, deathFrom: dd.from, deathTo: dd.to, deathPlace: d.dp,
      living, occupation: d.occ, biography: d.note,
    }).returning({ id: person.id });
    byXref.set(xref, p.id);
    added++;
    return p.id;
  };
  const link = (type: "parent_child" | "partnership", a: string, b: string) =>
    db.insert(relationship).values({ treeId, type, personA: a, personB: b, subtype: type === "parent_child" ? "biologic" : "casatorie" }).onConflictDoNothing();

  for (const n of Object.keys(DEMO).map(Number).sort((a, b) => a - b)) {
    if (n === 1 || byXref.has(`@I${n}@`)) continue;
    const child = byXref.get(`@I${Math.floor(n / 2)}@`);
    if (!child) continue;
    const id = await insert(`@I${n}@`, DEMO[n], n % 2 === 0 ? "M" : "F", false);
    await link("parent_child", id, child);
    const partner = byXref.get(`@I${n ^ 1}@`);
    if (partner) await link("partnership", n % 2 === 0 ? id : partner, n % 2 === 0 ? partner : id);
  }
  for (const x of DEMO_EXTRAS) {
    if (byXref.has(x.xref)) continue;
    const parents = (x.parents ?? []).map((r) => byXref.get(r));
    const partner = x.partner ? byXref.get(x.partner) : undefined;
    if (parents.some((p) => !p) || (x.partner && !partner)) continue;
    const id = await insert(x.xref, x, x.sex, !!x.living);
    for (const p of parents) await link("parent_child", p!, id);
    if (partner) await link("partnership", partner, id);
  }
  return added;
}

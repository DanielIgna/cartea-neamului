import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { person, raisedBy, relationship } from "@/db/schema";
import type { Graph } from "./kinship";

/**
 * „A crescut-o”: cine a crescut un copil fără să-i fie părinte, de pildă mama vitregă care i-a crescut pe copiii soțului
 * din alte căsătorii, sau bunicii. Părinții adevărați rămân la „Părinți”; legătura apare doar în fișe, în profil și în carte,
 * fără să schimbe desenele sau gradele de rudenie.
 */
export type Raised = { child: string; carer: string };

export async function raisedIn(db: Db, treeId: string): Promise<Raised[]> {
  return db.select({ child: raisedBy.childId, carer: raisedBy.carerId }).from(raisedBy).where(eq(raisedBy.treeId, treeId)).orderBy(raisedBy.createdAt);
}

/** Leagă sau dezleagă pe cine a crescut copilul. */
export async function setRaised(db: Db, treeId: string, childId: string, carerId: string, on: boolean, by: string | null): Promise<{ ok?: true; error?: string }> {
  if (childId === carerId) return { error: "Alege pe altcineva decât persoana însăși." };
  const both = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), inArray(person.id, [childId, carerId])));
  if (both.length !== 2) return { error: "Persoana nu mai există în acest arbore." };
  if (!on) {
    await db.delete(raisedBy).where(and(eq(raisedBy.treeId, treeId), eq(raisedBy.childId, childId), eq(raisedBy.carerId, carerId)));
    return { ok: true };
  }
  const rels = await db.select({ a: relationship.personA, b: relationship.personB }).from(relationship)
    .where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child")));
  if (rels.some((r) => r.a === carerId && r.b === childId)) return { error: "Îi este deja părinte; apare la „Părinți”." };
  // Un urmaș al copilului nu are cum să-l fi crescut.
  const seen = new Set([childId]);
  for (let frontier = [childId]; frontier.length; ) {
    const next = rels.filter((r) => frontier.includes(r.a) && !seen.has(r.b)).map((r) => r.b);
    if (next.includes(carerId)) return { error: "Persoana aleasă e urmașul ei; nu are cum să o fi crescut." };
    next.forEach((n) => seen.add(n));
    frontier = next;
  }
  await db.insert(raisedBy).values({ treeId, childId, carerId, createdBy: by }).onConflictDoNothing();
  return { ok: true };
}

/** Cine l-a crescut pe `id` și pe cine a crescut `id`, fără părinții adevărați (dacă între timp a devenit și părinte, apare doar la „Părinți”). */
export function raisedLinks(g: Graph, raised: Raised[], id: string) {
  const parents = g.parents.get(id) ?? [];
  return {
    carers: raised.filter((r) => r.child === id && !parents.includes(r.carer)).map((r) => r.carer),
    raised: raised.filter((r) => r.carer === id && !(g.parents.get(r.child) ?? []).includes(id)).map((r) => r.child),
  };
}

/**
 * Pe cine să propunem la „Cine a crescut-o?”: întâi soții părinților care nu-i sunt părinți (mama sau tatăl vitreg), apoi bunicii,
 * apoi frații și surorile părinților; restul arborelui rămâne la „altcineva”.
 */
export function carerCandidates(g: Graph, id: string, shown: (x: string) => boolean) {
  const parents = g.parents.get(id) ?? [];
  const step = new Set<string>(), grand = new Set<string>(), aunts = new Set<string>();
  for (const p of parents) {
    for (const sp of g.partners.get(p) ?? []) if (!parents.includes(sp)) step.add(sp);
    for (const gp of g.parents.get(p) ?? []) {
      grand.add(gp);
      for (const s of g.children.get(gp) ?? []) if (!parents.includes(s)) aunts.add(s);
    }
  }
  const keep = (s: Set<string>) => [...s].filter((x) => x !== id && shown(x));
  return { step: keep(step), grand: keep(grand), aunts: keep(aunts) };
}

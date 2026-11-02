import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { person, tree, document, documentLink, relationship } from "@/db/schema";
import type { Rel } from "./kinship";
import { fetchAncestorRows, toAhnentafel } from "./ancestry";
import { parseFuzzyDate } from "./dates";

export type PersonView = {
  id: string; name: string; givenName: string; surname: string; birthSurname: string | null; sex: "M" | "F" | "U";
  birthText: string | null; birthPlace: string | null; deathText: string | null; deathPlace: string | null;
  birthYear: number | null; deathYear: number | null; approx: boolean;
  living: boolean; claimed: boolean; occupation: string | null; biography: string | null; notes: string | null;
  createdBy: string | null; claimedBy: string | null; photoId: string | null;
  documents: { id: string; title: string; kind: string; dateText: string | null; hasFile: boolean; description?: string | null; mimeType?: string | null }[];
};

export function toView(p: typeof person.$inferSelect, docs: PersonView["documents"] = []): PersonView {
  const b = parseFuzzyDate(p.birthDateText), d = parseFuzzyDate(p.deathDateText);
  return {
    id: p.id, name: `${p.givenName} ${p.surname}`.trim(), givenName: p.givenName, surname: p.surname, birthSurname: p.birthSurname, sex: p.sex,
    birthText: p.birthDateText, birthPlace: p.birthPlace, deathText: p.deathDateText, deathPlace: p.deathPlace,
    birthYear: b.year, deathYear: d.year, approx: b.approx, living: p.living, claimed: !!p.claimedByUserId,
    occupation: p.occupation, biography: p.biography, notes: p.notes, createdBy: p.createdBy, claimedBy: p.claimedByUserId, photoId: p.photoDocumentId, documents: docs,
  };
}

export const MAX_GENERATIONS = 10;

/**
 * Tot ce are nevoie ecranul arborelui: toate persoanele și relațiile arborelui (pentru frați, soți, copii,
 * descendenți și gradul de rudenie) plus ascendenții persoanei centrale numerotați Ahnentafel.
 */
export async function loadTreeView(db: Db, treeId: string, centerId?: string, generations = 4) {
  const [t] = await db.select().from(tree).where(eq(tree.id, treeId));
  if (!t) return null;
  const rows = await db.select().from(person).where(eq(person.treeId, treeId));
  const center = centerId && rows.some((p) => p.id === centerId) ? centerId : t.rootPersonId;
  const empty = { tree: t, centerId: null, rootId: t.rootPersonId, slots: {} as Record<number, string>, people: {} as Record<string, PersonView>, rels: [] as Rel[] };
  if (!center) return empty;
  const gens = Math.min(Math.max(generations, 1), MAX_GENERATIONS);
  const ahnen = toAhnentafel(await fetchAncestorRows(db, center, gens));
  const relRows = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  const ids = rows.map((p) => p.id);
  const links = ids.length
    ? await db.select({ personId: documentLink.personId, id: document.id, title: document.title, kind: document.kind, dateText: document.dateText, fileKey: document.fileKey, description: document.description, mimeType: document.mimeType })
        .from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId)).where(inArray(documentLink.personId, ids))
    : [];
  const people: Record<string, PersonView> = {};
  for (const p of rows) people[p.id] = toView(p, links.filter((l) => l.personId === p.id).map(({ personId: _, fileKey, ...d }) => ({ ...d, hasFile: !!fileKey })));
  const slots: Record<number, string> = {};
  for (const [n, id] of ahnen) slots[n] = id;
  return { tree: t, centerId: center, rootId: t.rootPersonId, slots, people, rels: relRows };
}

export async function loadTimeline(db: Db, treeId: string) {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  return people.map((p) => toView(p)).filter((p) => p.birthYear).sort((a, b) => a.birthYear! - b.birthYear!);
}

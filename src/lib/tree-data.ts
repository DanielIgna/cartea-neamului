import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { person, tree, document, documentLink } from "@/db/schema";
import { fetchAncestorRows, toAhnentafel } from "./ancestry";
import { parseFuzzyDate } from "./dates";

export type PersonView = {
  id: string; name: string; givenName: string; surname: string; birthSurname: string | null; sex: "M" | "F" | "U";
  birthText: string | null; birthPlace: string | null; deathText: string | null; deathPlace: string | null;
  birthYear: number | null; deathYear: number | null; approx: boolean;
  living: boolean; claimed: boolean; occupation: string | null; biography: string | null;
  documents: { id: string; title: string; kind: string; dateText: string | null }[];
};

export function toView(p: typeof person.$inferSelect, docs: PersonView["documents"] = []): PersonView {
  const b = parseFuzzyDate(p.birthDateText), d = parseFuzzyDate(p.deathDateText);
  return {
    id: p.id, name: `${p.givenName} ${p.surname}`.trim(), givenName: p.givenName, surname: p.surname, birthSurname: p.birthSurname, sex: p.sex,
    birthText: p.birthDateText, birthPlace: p.birthPlace, deathText: p.deathDateText, deathPlace: p.deathPlace,
    birthYear: b.year, deathYear: d.year, approx: b.approx, living: p.living, claimed: !!p.claimedByUserId,
    occupation: p.occupation, biography: p.biography, documents: docs,
  };
}

/** Tot ce are nevoie ecranul arborelui: arborele, persoana centrală și ascendenții ei numerotați Ahnentafel. */
export async function loadTreeView(db: Db, treeId: string, centerId?: string, generations = 4) {
  const [t] = await db.select().from(tree).where(eq(tree.id, treeId));
  if (!t) return null;
  const center = centerId ?? t.rootPersonId;
  if (!center) return { tree: t, centerId: null, rootId: null, slots: {} as Record<number, PersonView> };
  const ahnen = toAhnentafel(await fetchAncestorRows(db, center, generations));
  const ids = [...new Set(ahnen.values())];
  const people = ids.length ? await db.select().from(person).where(inArray(person.id, ids)) : [];
  const links = ids.length
    ? await db.select({ personId: documentLink.personId, id: document.id, title: document.title, kind: document.kind, dateText: document.dateText })
        .from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId)).where(inArray(documentLink.personId, ids))
    : [];
  const byId = new Map(people.map((p) => [p.id, toView(p, links.filter((l) => l.personId === p.id).map(({ personId: _, ...d }) => d))]));
  const slots: Record<number, PersonView> = {};
  for (const [n, id] of ahnen) slots[n] = byId.get(id)!;
  return { tree: t, centerId: center, rootId: t.rootPersonId, slots };
}

export async function loadTimeline(db: Db, treeId: string) {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  return people.map((p) => toView(p)).filter((p) => p.birthYear).sort((a, b) => a.birthYear! - b.birthYear!);
}

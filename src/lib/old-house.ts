import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { document, documentLink, memory, oldHouse, person, user } from "@/db/schema";
import { canSee, type Viewer } from "./lada";
import type { Graph } from "./kinship";

/**
 * Casa bătrânească a unui om din arbore: unde e, cine a ridicat-o, în ce an, poze și povestea ei. Se vede după aceleași reguli
 * ca amintirile (src/lib/lada.ts): ciornă (doar autorul și omul), familia apropiată sau tot arborele. Nu apare în carte, pe
 * hartă sau în cronologie. Fiecare autor scrie cel mult una pentru un om; o schimbă sau o șterge doar el (sau, după ce contul
 * lui s-a șters, editorii arborelui).
 */
export { HOUSE_VISIBILITY, MAX_HOUSE_PHOTOS, type HouseView, type HouseVisibility } from "./old-house-shared";
import { HOUSE_VISIBILITY, type HouseView, type HouseVisibility } from "./old-house-shared";

type HouseRow = typeof oldHouse.$inferSelect;

/** Poate `viewer` să vadă casa? Aceleași reguli ca la o amintire din lada omului. */
export function canSeeHouse(h: Pick<HouseRow, "personId" | "authorId" | "visibility" | "maxDegree">, viewer: Viewer, g: Graph, defaultDegree: number, ownerUserId: string | null) {
  return canSee({ personId: h.personId, authorId: h.authorId, visibility: h.visibility, maxDegree: h.maxDegree }, viewer, g, defaultDegree, ownerUserId);
}

/** Casele unui om pe care le poate vedea cel care se uită, cele mai noi întâi. */
export async function loadHouses(db: Pick<Db, "select">, treeId: string, personId: string, viewer: Viewer, g: Graph, defaultDegree: number, ownerUserId: string | null): Promise<HouseView[]> {
  const rows = await db.select({ h: oldHouse, author: user.name }).from(oldHouse).leftJoin(user, eq(user.id, oldHouse.authorId))
    .where(and(eq(oldHouse.treeId, treeId), eq(oldHouse.personId, personId))).orderBy(sql`${oldHouse.updatedAt} desc`);
  return rows.filter(({ h }) => canSeeHouse(h, viewer, g, defaultDegree, ownerUserId)).map(({ h, author }) => ({
    id: h.id, place: h.place, builtBy: h.builtBy, builtYear: h.builtYear, story: h.story, photoIds: h.photoIds ?? [],
    visibility: (HOUSE_VISIBILITY as readonly string[]).includes(h.visibility) ? (h.visibility as HouseVisibility) : "private",
    maxDegree: h.maxDegree, author, mine: !!h.authorId && h.authorId === viewer.userId, orphan: !h.authorId, updatedAt: h.updatedAt.toISOString(),
  }));
}

/** Casele care folosesc o poză (pentru /api/document: o deschide doar cine vede casa). */
export async function housesWithPhoto(db: Pick<Db, "select">, treeId: string, docId: string) {
  return db.select().from(oldHouse).where(and(eq(oldHouse.treeId, treeId), sql`${oldHouse.photoIds} @> ${JSON.stringify([docId])}::jsonb`));
}

/** Toate pozele puse la casele unui arbore (nu apar în album). */
export async function houseMediaIds(db: Pick<Db, "select">, treeId: string) {
  const rows = await db.select({ ids: oldHouse.photoIds }).from(oldHouse).where(eq(oldHouse.treeId, treeId));
  return new Set(rows.flatMap((r) => r.ids ?? []));
}

type Q = Pick<Db, "select" | "delete">;

/**
 * Șterge pozele care nu mai sunt folosite nicăieri: nici în album, nici poză de profil, nici la o amintire, nici la o altă casă.
 * Întoarce cheile fișierelor, de șters din stocare după tranzacție.
 */
export async function dropUnusedPhotos(db: Q, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const linked = new Set((await db.select({ id: documentLink.documentId }).from(documentLink).where(inArray(documentLink.documentId, ids))).map((r) => r.id));
  const profile = new Set((await db.select({ id: person.photoDocumentId }).from(person).where(inArray(person.photoDocumentId, ids))).map((r) => r.id));
  const mem = await db.select({ a: memory.photoDocumentId, b: memory.audioDocumentId, c: memory.consentDocumentId }).from(memory)
    .where(or(inArray(memory.photoDocumentId, ids), inArray(memory.audioDocumentId, ids), inArray(memory.consentDocumentId, ids)));
  const used = new Set(mem.flatMap((r) => [r.a, r.b, r.c]));
  const trees = [...new Set((await db.select({ t: document.treeId }).from(document).where(inArray(document.id, ids))).map((r) => r.t))];
  const houses = trees.length ? await db.select({ ids: oldHouse.photoIds }).from(oldHouse).where(inArray(oldHouse.treeId, trees)) : [];
  for (const h of houses) for (const x of h.ids ?? []) used.add(x);
  const orphans = ids.filter((x) => !linked.has(x) && !profile.has(x) && !used.has(x));
  if (!orphans.length) return [];
  const gone = await db.delete(document).where(inArray(document.id, orphans)).returning({ key: document.fileKey });
  return gone.map((d) => d.key).filter((k): k is string => !!k);
}

/** Șterge casele date, cu pozele rămase fără rost. */
export async function dropHouses(db: Q, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await db.select({ ids: oldHouse.photoIds }).from(oldHouse).where(inArray(oldHouse.id, ids));
  await db.delete(oldHouse).where(inArray(oldHouse.id, ids));
  return dropUnusedPhotos(db, [...new Set(rows.flatMap((r) => r.ids ?? []))]);
}

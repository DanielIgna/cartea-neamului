import { and, eq, sql } from "drizzle-orm";
import { createRealtime, rawSql, type SealedLiveQuery } from "@neon/realtime/server";
import type { Db } from "@/db";
import { person, treeMember } from "@/db/schema";

/** Un rând pe persoană: id-ul și „versiunea” (updated_at ca text), ca orice adăugare sau corectură să ajungă live. */
export type PersonVersion = { id: string; version: string };
export type TreeLive = { sealedQuery: SealedLiveQuery<PersonVersion>; initialData: PersonVersion[] };

export function realtimeConfigured() {
  return Boolean(process.env.NEON_REALTIME_SECRET && process.env.NEON_REALTIME_URL && process.env.DATABASE_URL);
}

let server: ReturnType<typeof createRealtime> | null = null;
function realtime() {
  return (server ??= createRealtime({
    secret: process.env.NEON_REALTIME_SECRET!,
    db: new URL(process.env.DATABASE_URL!).pathname.slice(1) || "neondb",
  }));
}

/**
 * Persoanele unui arbore, văzute de un membru. Join-ul pe tree_member face parte din interogarea live:
 * dacă cineva e scos din arbore, nu mai primește actualizări.
 */
export function treePeopleQuery(userId: string, treeId: string) {
  return rawSql<PersonVersion>(
    `SELECT person.id, person.updated_at::text AS version FROM person
     INNER JOIN tree_member ON tree_member.tree_id = person.tree_id
     WHERE tree_member.user_id = $1 AND person.tree_id = $2::uuid`,
    [userId, treeId],
  );
}

/** Aceeași interogare, rulată normal pentru randarea inițială (aceeași formă a rândurilor). */
async function treePeopleRows(db: Db, userId: string, treeId: string): Promise<PersonVersion[]> {
  return db.select({ id: person.id, version: sql<string>`${person.updatedAt}::text` }).from(person)
    .innerJoin(treeMember, eq(treeMember.treeId, person.treeId))
    .where(and(eq(treeMember.userId, userId), eq(person.treeId, treeId)));
}

export function sealTreePeople(userId: string, treeId: string) {
  return realtime().seal({ query: treePeopleQuery(userId, treeId) });
}

/** Pentru pagina arborelui: rândurile inițiale + interogarea sigilată, pe care browserul se abonează. */
export async function loadTreeLive(db: Db, userId: string, treeId: string): Promise<TreeLive | null> {
  if (!realtimeConfigured()) return null;
  const [initialData, sealedQuery] = await Promise.all([treePeopleRows(db, userId, treeId), sealTreePeople(userId, treeId)]);
  return { initialData, sealedQuery };
}

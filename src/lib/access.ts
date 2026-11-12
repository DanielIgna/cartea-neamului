import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { treeMember } from "@/db/schema";
import { auth } from "./auth";
import { ensureSchema } from "./bootstrap";
import { canWriteInTree } from "./plata";

export type Role = "owner" | "editor" | "contributor" | "viewer";
const RANK: Record<Role, number> = { viewer: 0, contributor: 1, editor: 2, owner: 3 };

/** Cine e intrat în cont. O singură citire pe cerere, oricâte părți ale paginii întreabă (aspectul, limba, pagina). */
export const currentUser = cache(async () => {
  await ensureSchema();
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
});

export async function requireUser(next = "/") {
  const u = await currentUser();
  if (!u) redirect(`/intrare?next=${encodeURIComponent(next)}`);
  return u;
}

/**
 * Rolul omului în arbore. Când plățile sunt pornite și zilele lui gratuite (sau anul plătit) s-au terminat, e vizitator
 * oriunde, până plătește: vede tot, nu mai schimbă nimic. Tot vizitator e și ruda invitată, în zilele ei gratuite, într-un arbore
 * al cărui proprietar a rămas doar cu citirea. `roleInTree` dă rolul scris, fără plată.
 */
export async function roleIn(db: Db, treeId: string, userId: string): Promise<Role | null> {
  const role = await roleInTree(db, treeId, userId);
  if (role === null || role === "viewer") return role;
  return (await canWriteInTree(db, treeId, userId)) ? role : "viewer";
}

export async function roleInTree(db: Db, treeId: string, userId: string): Promise<Role | null> {
  const [m] = await db.select({ role: treeMember.role }).from(treeMember).where(and(eq(treeMember.treeId, treeId), eq(treeMember.userId, userId)));
  return m?.role ?? null;
}

/** Contributorii pot adăuga; editorii pot corecta tot; vizitatorii doar văd. */
export function can(role: Role | null, needed: Role) {
  return role !== null && RANK[role] >= RANK[needed];
}

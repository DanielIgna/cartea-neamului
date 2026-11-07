import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { treeMember } from "@/db/schema";
import { auth } from "./auth";
import { ensureSchema } from "./bootstrap";

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

export async function roleIn(db: Db, treeId: string, userId: string): Promise<Role | null> {
  const [m] = await db.select({ role: treeMember.role }).from(treeMember).where(and(eq(treeMember.treeId, treeId), eq(treeMember.userId, userId)));
  return m?.role ?? null;
}

/** Contributorii pot adăuga; editorii pot corecta tot; vizitatorii doar văd. */
export function can(role: Role | null, needed: Role) {
  return role !== null && RANK[role] >= RANK[needed];
}

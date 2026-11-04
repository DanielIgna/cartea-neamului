"use server";
import { z } from "zod";
import { db } from "@/db";
import { currentUser, roleIn } from "@/lib/access";
import { birthOrigins } from "@/lib/origins";
import type { Origin } from "@/lib/vremuri";

/** Ținutul istoric al fiecărui om din arbore, pentru povestea vremurilor (doar pentru membrii arborelui). */
export async function treeOrigins(treeId: string): Promise<Record<string, Origin>> {
  const me = await currentUser();
  if (!me || !z.string().uuid().safeParse(treeId).success || !(await roleIn(db, treeId, me.id))) return {};
  return birthOrigins(db, treeId);
}

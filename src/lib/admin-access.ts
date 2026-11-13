import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { currentUser, requireUser } from "./access";
import { isAdminUser } from "./admin";

export async function isAdmin() {
  const me = await currentUser();
  return isAdminUser(me);
}

/**
 * Panoul de admin cere verificarea în 2 pași (pentru clienți e doar la alegere). Nu se cere local, nici pentru un cont care intră
 * doar cu Google (acolo paza o face Google și nu are parolă cu care s-o pornească aici). ADMIN_2FA=off în Vercel o oprește la nevoie.
 */
export async function adminNeedsTwoStep(userId: string) {
  if (process.env.NODE_ENV !== "production" || process.env.ADMIN_2FA?.trim() === "off") return false;
  const [u] = await db.select({ on: user.twoFactorEnabled }).from(user).where(eq(user.id, userId));
  if (u?.on) return false;
  const pwd = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, userId), eq(account.providerId, "credential"))).limit(1);
  return pwd.length > 0;
}

/** Paginile de admin: cine nu e admin vede „pagina nu există”, ca să nu afle nici că panoul e acolo. */
export async function requireAdmin(next = "/admin") {
  const me = await requireUser(next);
  if (!isAdminUser(me)) notFound();
  if (await adminNeedsTwoStep(me.id)) redirect("/securitate?admin=1");
  return me;
}

/** Pentru acțiunile și adresele de admin: e admin și, unde se cere, are verificarea în 2 pași pornită. */
export async function adminReady(me: { id: string; email: string; createdAt?: Date | string | null; emailVerified?: boolean | null } | null) {
  return !!me && isAdminUser(me) && !(await adminNeedsTwoStep(me.id));
}

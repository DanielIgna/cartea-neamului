import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { currentUser, requireUser } from "./access";
import { isAdminUser, isOwnerEmail, isOwnerUser } from "./admin";

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
  // Amândouă deodată: se cer la fiecare pagină de admin.
  const [[u], pwd] = await Promise.all([
    db.select({ on: user.twoFactorEnabled }).from(user).where(eq(user.id, userId)),
    db.select({ id: account.id }).from(account).where(and(eq(account.userId, userId), eq(account.providerId, "credential"))).limit(1),
  ]);
  if (u?.on) return false;
  return pwd.length > 0;
}

type Candidate = { id: string; email: string; createdAt?: Date | string | null; emailVerified?: boolean | null };
/**
 * Admin, citit proaspăt: sesiunea e ținută 5 minute într-un cookie, așa că un proprietar care tocmai și-a confirmat adresa
 * ar aștepta. Pentru adresele proprietarilor întrebăm baza de date.
 */
async function isAdminFresh(me: Candidate) {
  if (isAdminUser(me)) return true;
  if (!isOwnerEmail(me.email)) return false;
  const [u] = await db.select({ email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt }).from(user).where(eq(user.id, me.id));
  return isOwnerUser(u);
}

/** Paginile de admin: cine nu e admin vede „pagina nu există”, ca să nu afle nici că panoul e acolo. */
export async function requireAdmin(next = "/admin") {
  const me = await requireUser(next);
  // Verificările deodată; rezultatul pentru pasul 2 contează doar dacă e admin.
  const [admin, twoStep] = await Promise.all([isAdminFresh(me), adminNeedsTwoStep(me.id)]);
  if (!admin) notFound();
  if (twoStep) redirect("/securitate?admin=1");
  return me;
}

/** Pentru acțiunile și adresele de admin: e admin și, unde se cere, are verificarea în 2 pași pornită. */
export async function adminReady(me: { id: string; email: string; createdAt?: Date | string | null; emailVerified?: boolean | null } | null) {
  return !!me && (await isAdminFresh(me)) && !(await adminNeedsTwoStep(me.id));
}

/** Fondatorii (proprietarii din OWNERS, cu adresa confirmată): Centrul de cunoștințe e doar pentru ei, nu și pentru adminii din ADMIN_EMAILS. */
async function isFounderFresh(id: string) {
  const [u] = await db.select({ email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt }).from(user).where(eq(user.id, id));
  return !!u && isOwnerUser(u);
}
export async function requireFounder(next = "/admin") {
  const me = await requireAdmin(next);
  if (!(await isFounderFresh(me.id))) notFound();
  return me;
}
export async function founderReady(me: { id: string; email: string; createdAt?: Date | string | null; emailVerified?: boolean | null } | null) {
  return !!me && (await adminReady(me)) && (await isFounderFresh(me.id));
}

/**
 * Accesul unui om, după plată: o singură citire a setărilor pe cerere și o citire pentru om. Folosit de `roleIn`
 * (src/lib/access.ts): cine nu mai are voie să scrie e tratat ca vizitator în toți arborii lui, până plătește.
 * Regulile sunt în src/lib/plans.ts (`accessFor`).
 */
import { cache } from "react";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, document, person, tree, treeMember, user } from "@/db/schema";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
import {
  accessFor, isTier, limitsFor, mayInviteWriters, mayStartTree, planSettings, room, writesInTree, yearPrice, type Access, type LimitKey, type PlanSettings,
} from "./plans";
import { isPlan } from "./plan-names";

const settingsOnce = cache((db: Db) => planSettings(db));

export async function userAccess(db: Db, userId: string, now = new Date()): Promise<{ access: Access; settings: PlanSettings; ownsTree: boolean }> {
  const settings = await settingsOnce(db);
  if (!settings.on) return { access: { kind: "deschis" }, settings, ownsTree: false };
  const [u] = await db.select({
    email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt, plan: accountPlan.plan, paidUntil: accountPlan.paidUntil, tier: accountPlan.tier,
    owns: sql<boolean>`exists (select 1 from tree t where t.owner_id = ${user.id})`,
  }).from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, userId));
  if (!u) return { access: { kind: "expirat", since: now }, settings, ownsTree: false };
  const exempt = isDemo(u.email) || isAdminUser(u);
  const access = accessFor({ createdAt: u.createdAt, plan: isPlan(u.plan) ? u.plan : null, paidUntil: u.paidUntil, tier: isTier(u.tier) ? u.tier : null, exempt }, settings, now);
  return { access, settings, ownsTree: !!u.owns };
}

const accessOnce = cache((db: Db, userId: string) => userAccess(db, userId));
/** Poate omul să adauge și să schimbe ceva acum? (o dată pe cerere) */
export async function canWriteNow(db: Db, userId: string) {
  return (await accessOnce(db, userId)).access.kind !== "expirat";
}

/** Ce scrie în bandă: zilele rămase sau „doar citire”, cu prețul anului pentru omul ăsta. */
export async function accessBanner(db: Db, userId: string) {
  const { access, settings, ownsTree } = await accessOnce(db, userId);
  if (access.kind !== "proba" && access.kind !== "expirat") return null;
  return { access, price: yearPrice(ownsTree, settings), familie: { lei: settings.familieLei, eur: settings.familieEur } };
}

/** Proprietarul arborelui și accesul lui (o dată pe cerere). */
const ownerOnce = cache(async (db: Db, treeId: string) => {
  const [t] = await db.select({ ownerId: tree.ownerId }).from(tree).where(eq(tree.id, treeId));
  if (!t?.ownerId) return null;
  return { ownerId: t.ownerId, access: (await accessOnce(db, t.ownerId)).access };
});

/** Poate scrie omul în arborele ăsta? Ține seama și de proprietar (src/lib/plans.ts, `writesInTree`). */
export async function canWriteInTree(db: Db, treeId: string, userId: string) {
  const { access, settings } = await accessOnce(db, userId);
  if (!settings.on) return true;
  if (access.kind !== "proba" && access.kind !== "expirat") return true;
  const owner = await ownerOnce(db, treeId);
  return writesInTree(access, owner?.access ?? null, owner?.ownerId === userId);
}

/** Câte sunt deja în arbore din fiecare lucru numărat (persoane, poze, glasuri, acte, cine scrie). */
async function usedInTree(db: Db, treeId: string, what: Exclude<LimitKey, "trees">): Promise<number> {
  if (what === "persons") return Number((await db.select({ n: sql<number>`count(*)::int` }).from(person).where(eq(person.treeId, treeId)))[0].n);
  if (what === "writers") return Number((await db.select({ n: sql<number>`count(*)::int` }).from(treeMember)
    .where(and(eq(treeMember.treeId, treeId), ne(treeMember.role, "viewer"))))[0].n);
  const kinds: ("photo" | "audio" | "act" | "letter" | "other")[] = what === "photos" ? ["photo"] : what === "audio" ? ["audio"] : ["act", "letter", "other"];
  return Number((await db.select({ n: sql<number>`count(*)::int` }).from(document)
    .where(and(eq(document.treeId, treeId), inArray(document.kind, kinds), sql`${document.fileKey} is not null`)))[0].n);
}

/** Tipul de document → ce plafon îl numără. */
export const quotaOf = (kind: string): "photos" | "audio" | "docs" => (kind === "photo" ? "photos" : kind === "audio" ? "audio" : "docs");

/**
 * Cât mai încape într-un arbore dintr-un lucru, după planul titularului: `null` = fără limită (plăți oprite, gratuit mereu,
 * plafon 0). Arbore fără titular: plafoanele de probă.
 */
export async function treeRoom(db: Db, treeId: string, what: Exclude<LimitKey, "trees">) {
  const settings = await settingsOnce(db);
  if (!settings.on) return null;
  const owner = await ownerOnce(db, treeId);
  const oa: Access = owner?.access ?? { kind: "expirat", since: new Date() };
  if (!limitsFor(oa, settings)?.[what]) return null;
  return room(oa, what, await usedInTree(db, treeId, what), settings);
}

/** Câte persoane mai poate trece omul în arbore: `null` = fără limită; altfel limita și câte mai încap. */
export async function personsLeft(db: Db, treeId: string, _userId?: string): Promise<{ cap: number; left: number } | null> {
  const r = await treeRoom(db, treeId, "persons");
  return r && { cap: r.cap, left: r.left };
}

/** Ce se arată discret în arbore: plafoanele aproape pline (de la 90%) sau pline. */
export async function treeUsage(db: Db, treeId: string) {
  const out: { what: Exclude<LimitKey, "trees">; cap: number; used: number }[] = [];
  for (const what of ["persons", "photos", "audio", "docs"] as const) {
    const r = await treeRoom(db, treeId, what);
    if (r && r.used >= r.cap * 0.9) out.push({ what, cap: r.cap, used: r.used });
  }
  return out;
}

/**
 * Se poate invita încă o rudă să scrie în arbore? Titularul trebuie să țină arborele (anul plătit, beta, gratuit mereu)
 * și să mai fie loc în plafonul lui de scriitori. Fără arbore (cereri vechi), se judecă după omul care invită.
 */
export async function canInviteWriters(db: Db, userId: string, treeId?: string) {
  const { access, settings } = await accessOnce(db, userId);
  if (!settings.on) return true;
  if (!treeId) return mayInviteWriters(access, 0, settings);
  const owner = await ownerOnce(db, treeId);
  return mayInviteWriters(owner?.access ?? access, await usedInTree(db, treeId, "writers"), settings);
}

/** Poate porni încă un arbore? Întoarce limita de persoane pentru un arbore nou (`null` = fără). */
export async function treeStart(db: Db, userId: string): Promise<{ ok: boolean; cap: number | null }> {
  const { access, settings } = await accessOnce(db, userId);
  const lim = settings.on ? limitsFor(access, settings) : null;
  if (!lim) return { ok: true, cap: null };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(tree).where(eq(tree.ownerId, userId));
  return { ok: mayStartTree(access, Number(n), settings), cap: lim.persons };
}

/**
 * Pentru plata de probă a adminului cât timp vânzarea e oprită: accesul lui socotit doar din anul plătit (ca un om obișnuit,
 * fără „gratuit mereu”), ca să poată încerca și trecerea pe un plan mai scump.
 */
export async function testAccess(db: Db, userId: string, now = new Date()): Promise<Access> {
  const [r] = await db.select({ paidUntil: accountPlan.paidUntil, tier: accountPlan.tier }).from(accountPlan).where(eq(accountPlan.userId, userId));
  if (r?.paidUntil && r.paidUntil > now) return { kind: "platit", until: r.paidUntil, tier: isTier(r.tier) ? r.tier : "basic" };
  return { kind: "proba", until: now, daysLeft: 0 };
}

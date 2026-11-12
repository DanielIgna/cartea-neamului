/**
 * Accesul unui om, după plată: o singură citire a setărilor pe cerere și o citire pentru om. Folosit de `roleIn`
 * (src/lib/access.ts): cine nu mai are voie să scrie e tratat ca vizitator în toți arborii lui, până plătește.
 * Regulile sunt în src/lib/plans.ts (`accessFor`).
 */
import { cache } from "react";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, user } from "@/db/schema";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
import { accessFor, planSettings, yearPrice, type Access, type PlanSettings } from "./plans";
import { isPlan } from "./plan-names";

const settingsOnce = cache((db: Db) => planSettings(db));

export async function userAccess(db: Db, userId: string, now = new Date()): Promise<{ access: Access; settings: PlanSettings; ownsTree: boolean }> {
  const settings = await settingsOnce(db);
  if (!settings.on) return { access: { kind: "deschis" }, settings, ownsTree: false };
  const [u] = await db.select({
    email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt, plan: accountPlan.plan, paidUntil: accountPlan.paidUntil,
    owns: sql<boolean>`exists (select 1 from tree t where t.owner_id = ${user.id})`,
  }).from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, userId));
  if (!u) return { access: { kind: "expirat", since: now }, settings, ownsTree: false };
  const exempt = isDemo(u.email) || isAdminUser(u);
  const access = accessFor({ createdAt: u.createdAt, plan: isPlan(u.plan) ? u.plan : null, paidUntil: u.paidUntil, exempt }, settings, now);
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
  return { access, price: yearPrice(ownsTree, settings) };
}

"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { PlanSettings, isPlan, savePlanSettings, setAccountPlan } from "@/lib/plans";

export type AdminFormState = { ok?: string; error?: string } | null;

/** Doar adminul schimbă planurile; ceilalți primesc un răspuns sec, fără să afle ce e aici. */
async function admin() {
  const me = await currentUser();
  return isAdminUser(me) ? me : null;
}

/** „Manager control”: limitele planului gratuit și prețul abonamentului „Familie”. Nu se văd în site cât timp plățile nu sunt pornite. */
export async function savePlanLimits(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const parsed = PlanSettings.safeParse({ freePersons: form.get("freePersons"), freeFiles: form.get("freeFiles"), priceEurYear: form.get("priceEurYear") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifică cifrele." };
  await savePlanSettings(db, parsed.data, me.id);
  revalidatePath("/admin", "layout");
  return { ok: "Am salvat limitele." };
}

/** „Manager control”: planul unui cont (gratuit, gratuit mereu, Familie) și o notă pentru cel care ține site-ul. */
export async function saveAccountPlan(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const userId = String(form.get("userId") ?? "");
  const plan = form.get("plan");
  if (!userId || !isPlan(plan)) return { error: "Alege un plan." };
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!u) return { error: "Contul nu mai există." };
  await setAccountPlan(db, userId, plan, String(form.get("note") ?? ""), me.id);
  revalidatePath("/admin", "layout");
  return { ok: "Salvat." };
}

"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { markCalendar, type CalStatus } from "@/lib/calendar-continut";
import { GROWTH_DEFAULTS, growthSettings, saveGrowthSettings, type GrowthSettings } from "@/lib/crestere";
import { recomputeHealth } from "@/lib/sanatate-afacere";

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

/** Un comutator din Admin → Creștere (întrebarea despre email, butoanele invitației, cardurile de distribuit). */
export async function toggleGrowth(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const key = String(form.get("key")) as keyof GrowthSettings;
  if (!(key in GROWTH_DEFAULTS)) return;
  const s = await growthSettings(db);
  s[key] = form.get("on") === "1";
  await saveGrowthSettings(db, s, me.id);
  revalidatePath("/admin/crestere");
}

/** Bifa din calendarul de conținut: făcut, sărit sau înapoi la „de făcut”. */
export async function markCalendarItem(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const id = String(form.get("id") ?? "").slice(0, 120);
  const st = String(form.get("status") ?? "");
  if (!id) return;
  await markCalendar(db, id, st === "facut" || st === "sarit" ? (st as CalStatus) : null, me.id);
  revalidatePath("/admin/calendar");
}

/** „Recalculează” pe pagina Sănătatea afacerii: scrie scorul de azi (pentru tendință). */
export async function recomputeHealthNow(): Promise<void> {
  const me = await admin();
  if (!me) return;
  await recomputeHealth(db);
  revalidatePath("/admin/sanatate");
}

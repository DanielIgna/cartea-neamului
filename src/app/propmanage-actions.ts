"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { getLocale } from "@/i18n/server";
import { requestInvite, setOfferEnabled, type Place } from "@/lib/propmanage-cont";

/**
 * „Vreau contul gratuit” (oferta PropManage): doar cu bifa de acord. Întoarce linkul de înregistrare, pe care pagina îl
 * deschide într-un tab nou. Orice altceva („unavailable”) ascunde oferta; activarea cardului nu e atinsă.
 */
export async function propmanageInviteAction(input: { consent: boolean; place: Place }): Promise<{ link?: string; reason?: string }> {
  const me = await currentUser();
  if (!me) return { reason: "login" };
  const place: Place = input.place === "datele-mele" ? "datele-mele" : "activare";
  const r = await requestInvite(db, me.id, { consent: input.consent === true, place, locale: await getLocale().catch(() => null) });
  if (r.ok) {
    revalidatePath("/datele-mele");
    return { link: r.link };
  }
  return { reason: r.reason };
}

/** Admin → Carduri cadou: comutatorul ofertei PropManage (oprit de la sine). */
export async function togglePropmanageOffer(form: FormData) {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) redirect("/");
  const on = form.get("on") === "1";
  await setOfferEnabled(db, on, me!.id);
  revalidatePath("/admin/carduri");
  revalidatePath("/activeaza");
  redirect(`/admin/carduri?ok=${encodeURIComponent(on ? "Oferta PropManage e pornită." : "Oferta PropManage e oprită.")}#propmanage`);
}

"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { setShopOpen } from "@/lib/invitatii-nunta-server";

/** Admin → Invitații de nuntă: deschide sau oprește rubrica (paginile, cumpărarea), fără deploy. Descărcările plătite merg mai departe. */
export async function toggleShopAction(form: FormData) {
  const me = await currentUser();
  if (!(await adminReady(me))) redirect("/admin");
  const on = form.get("on") === "1";
  await setShopOpen(db, on, me!.id);
  revalidatePath("/admin/invitatii-nunta");
  redirect(`/admin/invitatii-nunta?ok=${on ? "pornit" : "oprit"}`);
}

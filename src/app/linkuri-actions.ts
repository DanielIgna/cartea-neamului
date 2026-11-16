"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { createLink, deleteLink } from "@/lib/sursa";

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

/** Admin → Linkuri cu sursă: un link nou din numele grupului sau al campaniei; pagina se întoarce cu el gata de copiat. */
export async function newSourceLink(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (!name) return;
  const slug = await createLink(db, name, String(form.get("page") ?? "/"), me.id);
  revalidatePath("/admin/linkuri");
  redirect(`/admin/linkuri?nou=${encodeURIComponent(slug)}`);
}

/** Scoate un link din listă (click-urile și conturile lui rămân în Analiză, sub aceeași sursă). */
export async function removeSourceLink(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const slug = String(form.get("slug") ?? "").slice(0, 60);
  if (slug) await deleteLink(db, slug);
  revalidatePath("/admin/linkuri");
}

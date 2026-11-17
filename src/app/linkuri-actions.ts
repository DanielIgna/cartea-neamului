"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { createLink, deleteLink, facebookSlugBase, groupNames } from "@/lib/sursa";

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

/**
 * „Generează linkuri pentru grupuri Facebook”: o listă de nume de grupuri (unul pe rând) devine câte un link ?src=fb-<grup>,
 * fiecare în listă cu click-urile și conturile lui. Pagina se întoarce cu toate, gata de copiat.
 */
export async function newFacebookLinks(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const names = groupNames(String(form.get("names") ?? ""));
  if (!names.length) return;
  const page = String(form.get("page") ?? "/");
  const slugs: string[] = [];
  for (const name of names) {
    const label = /^fb\b/i.test(name) ? name : `FB ${name}`;
    slugs.push(await createLink(db, label, page, me.id, facebookSlugBase(name)));
  }
  revalidatePath("/admin/linkuri");
  redirect(`/admin/linkuri?fb=${encodeURIComponent(slugs.join(","))}`);
}

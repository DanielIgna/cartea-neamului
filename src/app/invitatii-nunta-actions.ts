"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { setShopOpen } from "@/lib/invitatii-nunta-server";
import {
  arrangeImages, createProduct, deleteProduct, parseProductForm, productById, setProductStatus, updateProduct,
} from "@/lib/invitatii-nunta-produse";
import { deleteObjects } from "@/lib/storage";

/**
 * Admin → Invitații de nuntă: rubrica pornită/oprită și modelele (adăugare, schimbare, publicare, retragere, arhivare, ștergere,
 * ordinea pozelor). Fiecare acțiune verifică pe server că omul e admin (cu verificarea în 2 pași, unde se cere).
 */

const ADMIN = "/admin/invitatii-nunta";

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me! : null;
}

/** Paginile publice ale rubricii și sitemap-ul se refac după orice schimbare (altfel, în cel mult 10 minute / o oră). */
function refreshShop(id?: string) {
  revalidatePath(ADMIN);
  if (id) revalidatePath(`${ADMIN}/${id}`);
  revalidatePath("/invitatii-nunta");
  revalidatePath("/invitatii-nunta/[slug]", "page");
  revalidatePath("/pub/[v]/invitatii-nunta", "page");
  revalidatePath("/pub/[v]/invitatii-nunta/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/pagini.xml");
}

/** Deschide sau oprește rubrica (paginile, cumpărarea), fără deploy. Descărcările plătite merg mai departe. */
export async function toggleShopAction(form: FormData) {
  const me = await admin();
  if (!me) redirect("/admin");
  const on = form.get("on") === "1";
  await setShopOpen(db, on, me.id);
  refreshShop();
  redirect(`${ADMIN}?ok=${on ? "pornit" : "oprit"}`);
}

export type SaveState = { error?: string } | null;

/** Salvează un model (nou sau existent). Un model nou intră ca ciornă; după salvare, pagina lui din Admin. */
export async function saveProductAction(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await admin())) return { error: "Nu ai voie aici." };
  const v = parseProductForm(form);
  if (!v.ok) return { error: v.error };
  const id = String(form.get("rid") ?? "");
  const r = id ? await updateProduct(db, id, v.value) : await createProduct(db, v.value);
  if (!r.ok) return { error: r.error };
  refreshShop(r.id);
  redirect(`${ADMIN}/${r.id}?ok=${id ? "salvat" : "nou"}`);
}

/** Publică / Retrage / Arhivează. */
export async function productStatusAction(form: FormData) {
  if (!(await admin())) redirect("/admin");
  const id = String(form.get("rid") ?? "");
  const what = form.get("what");
  if (what !== "publish" && what !== "retract" && what !== "archive") redirect(`${ADMIN}/${id}`);
  const r = await setProductStatus(db, id, what);
  refreshShop(id);
  redirect(r.ok ? `${ADMIN}/${id}?ok=${what}` : `${ADMIN}/${id}?eroare=${encodeURIComponent(r.error)}`);
}

/** Șterge un model fără vânzări, cu slugul scris ca confirmare. */
export async function deleteProductAction(form: FormData) {
  if (!(await admin())) redirect("/admin");
  const id = String(form.get("rid") ?? "");
  const r = await deleteProduct(db, id, String(form.get("confirm") ?? ""), deleteObjects);
  if (!r.ok) redirect(`${ADMIN}/${id}?eroare=${encodeURIComponent(r.error)}`);
  refreshShop();
  redirect(`${ADMIN}?ok=sters`);
}

/** Noua ordine a pozelor (prima e cea principală); pozele lăsate afară se șterg. */
export async function arrangeImagesAction(id: string, order: string[]): Promise<{ ok?: true; error?: string }> {
  if (!(await admin())) return { error: "Nu ai voie aici." };
  if (!Array.isArray(order) || order.some((s) => typeof s !== "string")) return { error: "Ordinea nu e bună." };
  const r = await arrangeImages(db, id, order, deleteObjects);
  if (!r.ok) return { error: r.error };
  const p = await productById(db, id);
  refreshShop(p?.id);
  return { ok: true };
}

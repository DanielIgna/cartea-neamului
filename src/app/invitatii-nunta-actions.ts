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
import { SHOP_CATEGORIES, categoryOf, type ShopCategory } from "@/lib/invitatii-nunta";

/**
 * Admin → Invitații de nuntă: rubrica pornită/oprită și modelele (adăugare, schimbare, publicare, retragere, arhivare, ștergere,
 * ordinea pozelor). Fiecare acțiune verifică pe server că omul e admin (cu verificarea în 2 pași, unde se cere).
 * Din 28.11.2026 aceleași acțiuni servesc și Admin → Accesorii nuntă și Admin → Jurnale de familie: categoria vine din formular
 * (la produse noi) sau din produsul însuși, iar fiecare categorie are pagina ei din Admin și paginile ei publice.
 */

const adminOf = (c: ShopCategory) => SHOP_CATEGORIES[c].admin;

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me! : null;
}

/**
 * Paginile publice ale rubricii și sitemap-ul se refac după orice schimbare (altfel, în cel mult 10 minute / o oră). Invitațiile
 * și accesoriile se refac împreună, pentru blocul „Completează setul”.
 */
function refreshShop(id?: string, category: ShopCategory = "invitatie") {
  const admin = adminOf(category);
  revalidatePath(admin);
  if (id) revalidatePath(`${admin}/${id}`);
  const paths = new Set([SHOP_CATEGORIES[category].path, ...(category === "jurnal" ? [] : [SHOP_CATEGORIES.invitatie.path, SHOP_CATEGORIES.accesorii.path])]);
  for (const path of paths) {
    revalidatePath(path);
    revalidatePath(`${path}/[slug]`, "page");
    revalidatePath(`/pub/[v]${path}`, "page");
    revalidatePath(`/pub/[v]${path}/[slug]`, "page");
  }
  revalidatePath("/produse");
  revalidatePath("/pub/[v]/produse", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/pagini.xml");
}

/** Deschide sau oprește rubrica (paginile, cumpărarea), fără deploy. Descărcările plătite merg mai departe. */
export async function toggleShopAction(form: FormData) {
  const me = await admin();
  if (!me) redirect("/admin");
  const on = form.get("on") === "1";
  const category = categoryOf(form.get("category"));
  await setShopOpen(db, on, me.id, new Date(), category);
  refreshShop(undefined, category);
  redirect(`${adminOf(category)}?ok=${on ? "pornit" : "oprit"}`);
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
  const category = v.value.category ?? "invitatie";
  refreshShop(r.id, category);
  redirect(`${adminOf(category)}/${r.id}?ok=${id ? "salvat" : "nou"}`);
}

/** Publică / Retrage / Arhivează. */
export async function productStatusAction(form: FormData) {
  if (!(await admin())) redirect("/admin");
  const id = String(form.get("rid") ?? "");
  const ADMIN = adminOf((await productById(db, id))?.category ?? "invitatie");
  const what = form.get("what");
  if (what !== "publish" && what !== "retract" && what !== "archive") redirect(`${ADMIN}/${id}`);
  const r = await setProductStatus(db, id, what);
  refreshShop(id, (await productById(db, id))?.category);
  redirect(r.ok ? `${ADMIN}/${id}?ok=${what}` : `${ADMIN}/${id}?eroare=${encodeURIComponent(r.error)}`);
}

/** Șterge un model fără vânzări, cu slugul scris ca confirmare. */
export async function deleteProductAction(form: FormData) {
  if (!(await admin())) redirect("/admin");
  const id = String(form.get("rid") ?? "");
  const category = (await productById(db, id))?.category ?? "invitatie";
  const ADMIN = adminOf(category);
  const r = await deleteProduct(db, id, String(form.get("confirm") ?? ""), deleteObjects);
  if (!r.ok) redirect(`${ADMIN}/${id}?eroare=${encodeURIComponent(r.error)}`);
  refreshShop(undefined, category);
  redirect(`${ADMIN}?ok=sters`);
}

/** Noua ordine a pozelor (prima e cea principală); pozele lăsate afară se șterg. */
export async function arrangeImagesAction(id: string, order: string[]): Promise<{ ok?: true; error?: string }> {
  if (!(await admin())) return { error: "Nu ai voie aici." };
  if (!Array.isArray(order) || order.some((s) => typeof s !== "string")) return { error: "Ordinea nu e bună." };
  const r = await arrangeImages(db, id, order, deleteObjects);
  if (!r.ok) return { error: r.error };
  const p = await productById(db, id);
  refreshShop(p?.id, p?.category);
  return { ok: true };
}

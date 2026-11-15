"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { closeNotice, InviteSettings, saveInviteSettings, setShareTree } from "@/lib/invitatii";

/** Închide o veste din cont („Ai primit 7 zile gratuite…”). */
export async function closeNoticeAction(form: FormData) {
  const me = await currentUser();
  const id = String(form.get("id") ?? "");
  if (!me || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await closeNotice(db, me.id, id);
  revalidatePath("/", "layout");
}

/** Ce arbore vede (doar citire) cine vine prin legătura omului; gol = niciunul. */
export async function saveShareTreeAction(_: unknown, form: FormData): Promise<{ ok?: boolean; error?: boolean }> {
  const me = await currentUser();
  if (!me) return { error: true };
  const v = String(form.get("tree") ?? "");
  const treeId = z.string().uuid().safeParse(v).success ? v : null;
  const ok = await setShareTree(db, me.id, treeId);
  revalidatePath("/invitatii");
  return ok ? { ok: true } : { error: true };
}

/** Admin → Invitații: zilele pentru fiecare parte, limita lunară, pornit/oprit. */
export async function saveInviteSettingsAction(_: unknown, form: FormData): Promise<{ ok?: string; error?: string }> {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) return { error: "Doar adminul poate schimba setările." };
  const parsed = InviteSettings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date greșite." };
  await saveInviteSettings(db, parsed.data, me.id);
  revalidatePath("/admin/invitatii");
  return { ok: "Am salvat setările invitațiilor." };
}

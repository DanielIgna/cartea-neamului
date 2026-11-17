"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser, roleInTree, can } from "@/lib/access";
import { disableWidget, enableWidget } from "@/lib/widget-arbore";

const UUID = /^[0-9a-f-]{36}$/i;

/** Widgetul îl pornește sau îl oprește doar proprietarul sau un editor al arborelui (e gratuit, deci nu cere plata). */
async function allowed(treeId: string) {
  if (!UUID.test(treeId)) return null;
  const me = await requireUser(`/arbore/${treeId}/widget`);
  return can(await roleInTree(db, treeId, me.id), "editor") ? me : null;
}

export async function saveWidget(treeId: string, form: FormData) {
  const me = await allowed(treeId);
  if (!me) return;
  await enableWidget(db, treeId, String(form.get("title") ?? ""), me.id);
  revalidatePath(`/arbore/${treeId}/widget`);
}

export async function stopWidget(treeId: string) {
  const me = await allowed(treeId);
  if (!me) return;
  await disableWidget(db, treeId);
  revalidatePath(`/arbore/${treeId}/widget`);
}

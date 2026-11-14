"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { founderReady } from "@/lib/admin-access";
import { docById, type DocStatus } from "@/lib/cunostinte/documente";
import { readDocState, saveDocState } from "@/lib/cunostinte/verificare";

export type DocActionState = { ok?: string; error?: string } | null;
const STATUSES: DocStatus[] = ["activ", "revizuire", "ciorna", "arhivat"];

/**
 * Centrul de cunoștințe: schimbă starea unui document sau notează că l-ai recitit (următoarea revizuire se mută mai încolo).
 * Doar fondatorii. Textul documentului rămâne în cod (src/lib/cunostinte/documente.ts); aici se ține doar starea.
 */
export async function updateDoc(_: DocActionState, form: FormData): Promise<DocActionState> {
  const me = await currentUser();
  if (!me || !(await founderReady(me))) return { error: "Nu ai voie aici." };
  const id = String(form.get("id") ?? "");
  const doc = docById(id);
  if (!doc) return { error: "Document necunoscut." };
  const status = String(form.get("status") ?? "");
  const reviewed = form.get("reviewed") === "1";
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  const state = await readDocState(db);
  const cur = { ...(state[id] ?? {}) };
  if (STATUSES.includes(status as DocStatus)) cur.status = status as DocStatus;
  if (reviewed) cur.reviewedAt = new Date().toISOString();
  cur.note = note || undefined;
  cur.by = me.email;
  await saveDocState(db, { ...state, [id]: cur }, me.id);
  revalidatePath("/admin/cunostinte", "layout");
  revalidatePath("/admin/autonomie");
  return { ok: reviewed ? `${id}: recitit azi.` : `${id}: salvat.` };
}

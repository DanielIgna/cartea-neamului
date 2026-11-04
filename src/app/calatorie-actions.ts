"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree } from "@/db/schema";
import { currentUser, roleIn } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { MAX_WORD } from "@/lib/cuvant-final";

/**
 * Proprietarul alege cuvântul de la capătul călătoriei în timp: textul de bază, textul scris de el sau deloc.
 * Contul de probă nu-l poate schimba: parola lui e publică.
 */
export async function setJourneyWord(treeId: string, mode: "default" | "off" | "custom", text = ""): Promise<{ ok?: boolean; error?: string }> {
  const parsed = z.object({ treeId: z.string().uuid(), mode: z.enum(["default", "off", "custom"]), text: z.string().max(MAX_WORD) }).safeParse({ treeId, mode, text });
  if (!parsed.success) return { error: `Textul poate avea cel mult ${MAX_WORD} de caractere.` };
  const me = await currentUser();
  if (!me || (await roleIn(db, treeId, me.id)) !== "owner") return { error: "Doar proprietarul arborelui schimbă cuvântul de la final." };
  if (isDemo(me.email)) return { error: "În contul de probă cuvântul de la final rămâne cel de bază." };
  if (mode === "custom" && !text.trim()) return { error: "Scrie textul sau alege „Ascunde”." };
  const value = mode === "default" ? null : mode === "off" ? "" : text.trim();
  await db.update(tree).set({ journeyWord: value }).where(eq(tree.id, treeId));
  revalidatePath(`/arbore/${treeId}/calatorie`);
  return { ok: true };
}

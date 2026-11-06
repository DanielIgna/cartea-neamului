"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { recordConsent } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import { deleteUsage } from "@/lib/usage";

/**
 * Răspunsul la „Cât folosești site-ul”: „Bine” pornește măsurarea, „Nu vreau” (sau oprirea ei din „Datele mele”) o oprește și
 * șterge tot ce s-a adunat până atunci. Contul de probă nu se măsoară.
 */
export async function answerUsage(granted: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me) return { error: "Intră în cont." };
  if (isDemo(me.email)) return { error: "Contul de probă nu se măsoară." };
  await recordConsent(db, me.id, "usage", !!granted);
  if (!granted) await deleteUsage(db, me.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

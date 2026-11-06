"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { ensureSchema } from "@/lib/bootstrap";
import { createFamilyTree, StartInput } from "@/lib/family-start";

/** „Pornește arborele pas cu pas”: face arborele cu omul, părinții și bunicii lui, apoi îl duce la pagina de bun venit. */
export async function startFamilyTree(input: StartInput): Promise<{ error?: string }> {
  await ensureSchema();
  const me = await currentUser();
  if (!me) return { error: "Intră în cont ca să-ți pornești arborele." };
  const parsed = StartInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = await createFamilyTree(db, me.id, parsed.data);
  revalidatePath("/");
  redirect(`/arbore/${r.treeId}/bun-venit`);
}

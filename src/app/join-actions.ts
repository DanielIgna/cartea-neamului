"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { answerJoin, askToJoin, type JoinResult } from "@/lib/join";

const Find = z.object({
  given: z.string().trim().min(1, "Scrie prenumele.").max(80),
  surname: z.string().trim().min(1, "Scrie numele de familie.").max(80),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Alege data nașterii: ziua, luna și anul."),
  note: z.string().max(500, "Scrie cel mult 500 de caractere.").optional(),
});

/** „Ești deja într-un arbore?”: caută fișa după nume și data nașterii și trimite cererea proprietarului. */
export async function findMe(_: unknown, form: FormData): Promise<JoinResult & { at?: number }> {
  const v = Find.safeParse(Object.fromEntries(form));
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Completează numele și data nașterii." };
  const me = await currentUser();
  if (!me) return { error: "Intră în cont." };
  const res = await askToJoin(db, me, { ...v.data, note: v.data.note ?? null });
  if (res.found) {
    revalidatePath("/");
    revalidatePath("/mesaje");
  }
  return { ...res, at: Date.now() };
}

/** Proprietarul confirmă (sau nu) că cel care cere e chiar omul din fișă. */
export async function answerJoinRequest(id: string, accept: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me || !z.string().uuid().safeParse(id).success) return { error: "Intră în cont." };
  const res = await answerJoin(db, me.id, id, !!accept);
  revalidatePath("/mesaje");
  return res;
}

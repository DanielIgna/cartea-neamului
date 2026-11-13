"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { joinRequest } from "@/db/schema";
import { canInviteWriters } from "@/lib/plata";
import { currentUser } from "@/lib/access";
import { answerJoin, askToJoin, type JoinResult } from "@/lib/join";
import { getT } from "@/i18n/server";

// Mesajele sunt chei din Errors: le scriem în limba omului.
const Find = z.object({
  given: z.string().trim().min(1, "findGiven").max(80),
  surname: z.string().trim().min(1, "findSurname").max(80),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "birth"),
  note: z.string().max(500, "findNote").optional(),
});
const FIND_ERRORS = ["findGiven", "findSurname", "findNote"] as const;

/** „Ești deja într-un arbore?”: caută fișa după nume și data nașterii și trimite cererea proprietarului. */
export async function findMe(_: unknown, form: FormData): Promise<Omit<JoinResult, "error"> & { error?: string; at?: number }> {
  const t = await getT("Errors");
  const v = Find.safeParse(Object.fromEntries(form));
  if (!v.success) {
    const code = v.error.issues[0]?.message;
    const known = FIND_ERRORS.find((k) => k === code);
    return { error: known ? t(known) : code === "birth" ? t("join.birth") : t("findIncomplete") };
  }
  const me = await currentUser();
  if (!me) return { error: t("signIn") };
  const res = await askToJoin(db, me, { ...v.data, note: v.data.note ?? null });
  if (res.found) {
    revalidatePath("/");
    revalidatePath("/mesaje");
  }
  return { ...res, error: res.error && t(`join.${res.error}`), at: Date.now() };
}

/** Proprietarul confirmă (sau nu) că cel care cere e chiar omul din fișă. */
export async function answerJoinRequest(id: string, accept: boolean): Promise<{ ok?: boolean; error?: string }> {
  const t = await getT("Errors");
  const me = await currentUser();
  if (!me || !z.string().uuid().safeParse(id).success) return { error: t("signIn") };
  // În zilele gratuite, proprietarul primește rudele doar să vadă; cu anul plătit, să și adauge (src/lib/plans.ts).
  // Peste plafonul de scriitori al planului, la fel: rudele intră doar să vadă.
  const [jr] = await db.select({ treeId: joinRequest.treeId }).from(joinRequest).where(eq(joinRequest.id, id));
  const role = jr && (await canInviteWriters(db, me.id, jr.treeId)) ? "contributor" : "viewer";
  const res = await answerJoin(db, me.id, id, !!accept, new Date(), role);
  revalidatePath("/mesaje");
  return res.error ? { error: t(`join.${res.error}`) } : { ok: true };
}

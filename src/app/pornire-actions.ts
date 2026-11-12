"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { ensureSchema } from "@/lib/bootstrap";
import { treeStart } from "@/lib/plata";
import { createFamilyTree, StartInput } from "@/lib/family-start";
import { normalizeTypedDate } from "@/lib/dates";
import { getLocale, getT } from "@/i18n/server";

/** „Pornește arborele pas cu pas”: face arborele cu omul, părinții și bunicii lui, apoi îl duce la pagina de bun venit. */
export async function startFamilyTree(input: StartInput): Promise<{ error?: string }> {
  await ensureSchema();
  const me = await currentUser();
  const t = await getT("Errors");
  if (!me) return { error: t("startSignIn") };
  const parsed = StartInput.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues[0].message;
    return { error: code === "treeName" || code === "given" || code === "sex" ? t(code) : t("failed") };
  }
  // Datele scrise cu luna întâi (engleza americană) se păstrează an-lună-zi, ca toată familia să le citească la fel.
  const locale = await getLocale();
  const v = parsed.data;
  const fix = <W extends { birth: string }>(w: W | undefined) => (w ? { ...w, birth: normalizeTypedDate(w.birth, locale) } : w);
  if (!(await treeStart(db, me.id)).ok) return { error: t("trialOneTree") };
  const r = await createFamilyTree(db, me.id, { ...v, me: fix(v.me)!, father: fix(v.father), mother: fix(v.mother), ff: fix(v.ff), fm: fix(v.fm), mf: fix(v.mf), mm: fix(v.mm) });
  revalidatePath("/");
  redirect(`/arbore/${r.treeId}/bun-venit`);
}

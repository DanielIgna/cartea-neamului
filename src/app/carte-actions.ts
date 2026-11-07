"use server";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookExport } from "@/db/schema";
import { currentUser, roleIn, can } from "@/lib/access";
import { cleanText, type BookText } from "@/lib/book";
import { getT } from "@/i18n/server";

/**
 * Titlul, subtitlul, autorul și cuvântul înainte ale cărții. Le scriu proprietarul și editorii; se păstrează
 * în ciorna cărții arborelui (un rând în book_export, cu starea „draft”), ca la următoarea deschidere să fie acolo.
 */
export async function saveBookText(treeId: string, text: BookText): Promise<{ ok?: true; error?: string }> {
  const t = await getT("Book");
  if (!z.string().uuid().safeParse(treeId).success) return { error: t("errors.noTree") };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "editor")) return { error: t("errors.notEditor") };
  const clean = cleanText(text);
  const [draft] = await db.select({ id: bookExport.id, options: bookExport.options }).from(bookExport)
    .where(and(eq(bookExport.treeId, treeId), eq(bookExport.status, "draft"))).orderBy(desc(bookExport.createdAt)).limit(1);
  if (draft) await db.update(bookExport).set({ options: { ...(draft.options as Record<string, unknown>), text: clean } }).where(eq(bookExport.id, draft.id));
  else await db.insert(bookExport).values({ treeId, orderedBy: me.id, options: { text: clean } });
  revalidatePath(`/arbore/${treeId}/carte`);
  return { ok: true };
}

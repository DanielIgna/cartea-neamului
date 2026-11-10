"use server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { document, oldHouse, person } from "@/db/schema";
import { can, currentUser, roleIn } from "@/lib/access";
import { HOUSE_VISIBILITY, MAX_HOUSE_PHOTOS, dropHouses, dropUnusedPhotos } from "@/lib/old-house";
import { deleteObjects } from "@/lib/storage";
import { getT } from "@/i18n/server";

type Result = { ok?: boolean; id?: string; error?: string };
const uuid = z.string().uuid();
const blank = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

const HouseInput = z.object({
  treeId: uuid, personId: uuid, id: uuid.optional(),
  place: z.string().max(300).nullish(), builtBy: z.string().max(300).nullish(),
  builtYear: z.number().int().min(1000).max(2100).nullish(),
  story: z.string().max(20000).nullish(),
  photoIds: z.array(uuid).max(MAX_HOUSE_PHOTOS),
  visibility: z.enum(HOUSE_VISIBILITY), maxDegree: z.number().int().min(1).max(10).nullish(),
});

/**
 * Scrie (sau schimbă) casa bătrânească a unui om. O pune oricine poate adăuga în arbore (contributor sau mai mult), cel mult
 * una de fiecare autor pentru un om; o schimbă doar autorul (sau editorii, dacă autorul și-a șters contul). Pozele trebuie să
 * fie din acest arbore și încărcate de el (sau deja la casă).
 */
export async function saveHouse(input: z.input<typeof HouseInput>): Promise<Result> {
  const t = await getT("OldHouse.errors");
  const parsed = HouseInput.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0], at = i.path[0];
    return { error: at === "builtYear" ? t("badYear") : at === "photoIds" && i.code === "too_big" ? t("tooManyPhotos", { max: String(MAX_HOUSE_PHOTOS) })
      : i.code === "too_big" ? t("tooLong") : t("badData") };
  }
  const v = parsed.data;
  const place = blank(v.place), builtBy = blank(v.builtBy), story = blank(v.story);
  if (!place && !story) return { error: t("empty") };
  const me = await currentUser();
  if (!me) return { error: t("notMember") };
  const role = await roleIn(db, v.treeId, me.id);
  if (!role) return { error: t("notMember") };
  if (!can(role, "contributor")) return { error: t("noRight") };
  const [p] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, v.personId), eq(person.treeId, v.treeId)));
  if (!p) return { error: t("personGone") };

  let existing: typeof oldHouse.$inferSelect | undefined;
  if (v.id) {
    [existing] = await db.select().from(oldHouse).where(and(eq(oldHouse.id, v.id), eq(oldHouse.treeId, v.treeId), eq(oldHouse.personId, v.personId)));
    if (!existing) return { error: t("gone") };
    if (existing.authorId !== me.id && !(existing.authorId === null && can(role, "editor"))) return { error: t("onlyAuthor") };
  } else {
    const [dup] = await db.select({ id: oldHouse.id }).from(oldHouse).where(and(eq(oldHouse.personId, v.personId), eq(oldHouse.authorId, me.id))).limit(1);
    if (dup) return { error: t("already") };
  }
  const photoIds = [...new Set(v.photoIds)];
  const had = new Set(existing?.photoIds ?? []);
  const fresh = photoIds.filter((x) => !had.has(x));
  if (fresh.length) {
    const ok = await db.select({ id: document.id }).from(document)
      .where(and(inArray(document.id, fresh), eq(document.treeId, v.treeId), eq(document.uploadedBy, me.id), eq(document.kind, "photo")));
    if (ok.length !== fresh.length) return { error: t("badPhoto") };
  }
  const values = { place, builtBy, builtYear: v.builtYear ?? null, story, photoIds, visibility: v.visibility,
    maxDegree: v.visibility === "close" ? v.maxDegree ?? null : null, updatedAt: new Date() };
  let id = existing?.id;
  if (existing) await db.update(oldHouse).set(values).where(eq(oldHouse.id, existing.id));
  else id = (await db.insert(oldHouse).values({ ...values, treeId: v.treeId, personId: v.personId, authorId: me.id }).returning({ id: oldHouse.id }))[0].id;
  // Pozele scoase de la casă și nefolosite în altă parte se șterg.
  const removed = [...had].filter((x) => !photoIds.includes(x));
  const keys = removed.length ? await db.transaction((tx) => dropUnusedPhotos(tx, removed)) : [];
  if (keys.length) await deleteObjects(keys).catch((e) => console.error("casa: poze", e));
  revalidatePath(`/arbore/${v.treeId}/persoana/${v.personId}`);
  return { ok: true, id };
}

/** Șterge casa, cu pozele puse doar la ea. Doar autorul (sau editorii, dacă autorul și-a șters contul). */
export async function deleteHouse(input: { treeId: string; id: string }): Promise<Result> {
  const t = await getT("OldHouse.errors");
  if (!uuid.safeParse(input.treeId).success || !uuid.safeParse(input.id).success) return { error: t("badData") };
  const me = await currentUser();
  if (!me) return { error: t("notMember") };
  const role = await roleIn(db, input.treeId, me.id);
  if (!role) return { error: t("notMember") };
  const [h] = await db.select().from(oldHouse).where(and(eq(oldHouse.id, input.id), eq(oldHouse.treeId, input.treeId)));
  if (!h) return { error: t("gone") };
  if (h.authorId !== me.id && !(h.authorId === null && can(role, "editor"))) return { error: t("onlyAuthor") };
  const keys = await db.transaction((tx) => dropHouses(tx, [h.id]));
  if (keys.length) await deleteObjects(keys).catch((e) => console.error("casa: poze", e));
  revalidatePath(`/arbore/${input.treeId}/persoana/${h.personId}`);
  return { ok: true };
}

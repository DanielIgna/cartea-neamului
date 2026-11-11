"use server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { document, homeSubmission } from "@/db/schema";
import { currentUser, roleIn } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { isDemo } from "@/lib/demo";
import { canOpenDocument, memoryMediaIds } from "@/lib/lada-db";
import { deleteObjects, getObjectBytes, putObject, storageConfigured } from "@/lib/storage";
import { homeImagesState, saveHomeImagesState } from "@/lib/home-images";
import { MAX_CAPTION, MAX_PENDING, SUBMISSION_CONSENT_VERSION, submissionKey, withSubmission, withoutSubmission } from "@/lib/home-submissions";
import { getLocale, getT } from "@/i18n/server";

type Result = { ok?: boolean; error?: string };
const UUID = /^[0-9a-f-]{36}$/i;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Omul propune o poză din albumul arborelui pentru bannerul de pe prima pagină. Trebuie să bifeze acordul; poza e copiată
 * deoparte (site/propuneri/) și așteaptă aprobarea adminului. Nu apare nicăieri până atunci.
 */
export async function proposeHomePhoto(input: { treeId: string; docId: string; caption: string; consent: boolean }): Promise<Result> {
  const me = await currentUser();
  if (!me) return { error: (await getT("Errors"))("signIn") };
  const t = await getT("Film");
  if (isDemo(me.email)) return { error: t("errors.demo") };
  if (!input.consent) return { error: t("errors.consent") };
  if (!UUID.test(input.treeId) || !UUID.test(input.docId)) return { error: t("errors.photo") };
  if (!storageConfigured()) return { error: t("errors.storage") };
  if (!(await roleIn(db, input.treeId, me.id))) return { error: t("errors.photo") };
  const [d] = await db.select({ treeId: document.treeId, fileKey: document.fileKey, mime: document.mimeType, kind: document.kind, uploadedBy: document.uploadedBy })
    .from(document).where(eq(document.id, input.docId));
  if (!d || d.treeId !== input.treeId || !d.fileKey) return { error: t("errors.photo") };
  const mime = d.mime && IMAGE_TYPES.includes(d.mime) ? d.mime : d.kind === "photo" && !d.mime ? "image/jpeg" : null;
  if (!mime) return { error: t("errors.photo") };
  // Pozele din lada cu amintiri rămân în arbore: se propun doar cele din album.
  if ((await memoryMediaIds(db, input.treeId)).has(input.docId)) return { error: t("errors.photo") };
  if (!(await canOpenDocument(db, input.docId, d.treeId, d.uploadedBy, me.id))) return { error: t("errors.photo") };
  const live = await db.select({ doc: homeSubmission.documentId, status: homeSubmission.status }).from(homeSubmission)
    .where(and(eq(homeSubmission.userId, me.id), inArray(homeSubmission.status, ["pending", "approved"])));
  if (live.some((s) => s.doc === input.docId)) return { error: t("errors.already") };
  if (live.filter((s) => s.status === "pending").length >= MAX_PENDING) return { error: t("errors.tooMany", { count: String(MAX_PENDING) }) };
  const caption = (input.caption ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION) || null;
  const id = crypto.randomUUID();
  const key = submissionKey(id, mime);
  try {
    await putObject(key, await getObjectBytes(d.fileKey), mime);
  } catch (err) {
    console.error("propunere-acasa", err);
    return { error: (await getT("Errors"))("failed") };
  }
  const now = new Date();
  await db.insert(homeSubmission).values({ id, userId: me.id, treeId: input.treeId, documentId: input.docId, fileKey: key, mimeType: mime, caption,
    consentTextVersion: SUBMISSION_CONSENT_VERSION, consentAt: now, locale: await getLocale(), createdAt: now });
  revalidatePath(`/arbore/${input.treeId}`, "layout");
  revalidatePath("/admin/propuneri");
  return { ok: true };
}

/** Omul își retrage poza: iese de pe prima pagină (dacă era acolo) și fișierul se șterge. */
export async function withdrawHomePhoto(id: string): Promise<Result> {
  const me = await currentUser();
  if (!me) return { error: (await getT("Errors"))("signIn") };
  if (!UUID.test(id)) return { error: (await getT("Errors"))("failed") };
  const [s] = await db.select().from(homeSubmission).where(and(eq(homeSubmission.id, id), eq(homeSubmission.userId, me.id)));
  if (!s) return { error: (await getT("Errors"))("failed") };
  if (s.status === "approved") await saveHomeImagesState(db, withoutSubmission(await homeImagesState(db), id), me.id);
  await db.update(homeSubmission).set({ status: "withdrawn", decidedAt: new Date() }).where(eq(homeSubmission.id, id));
  await deleteObjects([s.fileKey]);
  revalidatePath("/");
  if (s.treeId) revalidatePath(`/arbore/${s.treeId}`, "layout");
  revalidatePath("/admin/propuneri");
  return { ok: true };
}

/** Admin → Propuneri: aprobă (intră prima în rotația bannerului), nu aprobă, sau scoate de pe pagină o poză aprobată. */
export async function decideHomePhoto(id: string, decision: "approve" | "reject" | "remove"): Promise<{ ok?: string; error?: string }> {
  const me = await currentUser();
  if (!isAdminUser(me) || !me) return { error: "Nu ai voie aici." };
  if (!UUID.test(id) || !["approve", "reject", "remove"].includes(decision)) return { error: "Propunerea nu există." };
  const [s] = await db.select().from(homeSubmission).where(eq(homeSubmission.id, id));
  if (!s) return { error: "Propunerea nu există." };
  const now = new Date();
  if (decision === "approve") {
    if (s.status !== "pending" && s.status !== "rejected") return { error: "Propunerea nu mai așteaptă." };
    const r = withSubmission(await homeImagesState(db), s, me.id, now);
    if (r.error) return { error: r.error };
    await saveHomeImagesState(db, r.state, me.id, now);
    await db.update(homeSubmission).set({ status: "approved", decidedBy: me.id, decidedAt: now }).where(eq(homeSubmission.id, id));
  } else {
    if (s.status === "approved") await saveHomeImagesState(db, withoutSubmission(await homeImagesState(db), id), me.id, now);
    // Respinsă rămâne în listă (poate fi aprobată mai târziu); scoasă de pe pagină, fișierul se șterge.
    await db.update(homeSubmission).set({ status: decision === "reject" ? "rejected" : "removed", decidedBy: me.id, decidedAt: now }).where(eq(homeSubmission.id, id));
    if (decision === "remove") await deleteObjects([s.fileKey]);
  }
  revalidatePath("/");
  revalidatePath("/admin/propuneri");
  revalidatePath("/admin/poze");
  if (s.treeId) revalidatePath(`/arbore/${s.treeId}`, "layout");
  return { ok: decision === "approve" ? "Gata, poza e pe prima pagină, prima în banner." : decision === "reject" ? "Am lăsat poza deoparte. Omul vede că n-a fost aleasă." : "Am scos poza de pe prima pagină." };
}

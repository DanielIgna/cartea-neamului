import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { homeSubmission } from "@/db/schema";
import { activeImages, homeImagesState, MAX_UPLOADS, saveHomeImagesState, withActive, withoutUpload, withUpload, type HomeImagesState } from "./home-images";

/**
 * Pozele de familie pe care oamenii le propun pentru bannerul de pe prima pagină. Nimic nu apare singur:
 * omul bifează acordul (textul de mai jos, cu versiunea lui), adminul aprobă în Admin → Propuneri. Aprobată, poza intră
 * în rotația bannerului ca o poză încărcată cu id-ul `p-<id>`, servită de /api/poza-acasa/p-<id>. Omul o poate retrage
 * oricând, și atunci iese de pe pagină și fișierul se șterge.
 */
export const SUBMISSION_CONSENT_VERSION = "propunere-acasa-2026-11-11";
export const MAX_PENDING = 3;
export const MAX_CAPTION = 120;

export type SubmissionStatus = "pending" | "approved" | "rejected" | "withdrawn" | "removed";
/** Ce mai contează pentru om: cele scoase sau retrase nu mai apar în lista lui. */
export const LIVE_STATUSES: SubmissionStatus[] = ["pending", "approved", "rejected"];

export const uploadIdOf = (submissionId: string) => `p-${submissionId}`;
export const submissionKey = (submissionId: string, mime: string) => `site/propuneri/${submissionId}.${mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"}`;

/** Pune poza aprobată în banner, prima în rotație. Bannerul are cel mult 8 poze active, deci ultima poate ieși din rotație. */
export function withSubmission(state: HomeImagesState, sub: { id: string; fileKey: string; mimeType: string }, by: string, now = new Date()):
  { state: HomeImagesState; error?: string } {
  const st = state.banner ?? { uploads: [], active: [] };
  const upId = uploadIdOf(sub.id);
  if (st.uploads.some((u) => u.id === upId)) return { state };
  if (st.uploads.length >= MAX_UPLOADS) return { state, error: `Bannerul are deja ${MAX_UPLOADS} poze încărcate. Șterge una din Poze prima pagină, apoi aprobă.` };
  const current = activeImages("banner", st).map((i) => i.id);
  const next = withUpload(state, "banner", { id: upId, key: sub.fileKey, type: sub.mimeType, at: now.toISOString(), by });
  return { state: withActive(next, "banner", [`u:${upId}`, ...current]) };
}

/** Scoate poza propusă din banner (dacă era acolo). */
export const withoutSubmission = (state: HomeImagesState, submissionId: string) => withoutUpload(state, "banner", uploadIdOf(submissionId)).state;

export async function mySubmissions(db: Pick<Db, "select">, userId: string) {
  return db.select({ id: homeSubmission.id, documentId: homeSubmission.documentId, caption: homeSubmission.caption, status: homeSubmission.status, createdAt: homeSubmission.createdAt })
    .from(homeSubmission).where(and(eq(homeSubmission.userId, userId), inArray(homeSubmission.status, LIVE_STATUSES)))
    .orderBy(desc(homeSubmission.createdAt));
}

/** Când adminul șterge din galerie o poză venită de la cineva, propunerea trece la „scoasă”, ca omul să nu creadă că e încă pe pagină. */
export async function markRemovedByUpload(db: Pick<Db, "update">, uploadId: string, by: string, now = new Date()) {
  const m = /^p-([0-9a-f-]{36})$/i.exec(uploadId);
  if (!m) return;
  await db.update(homeSubmission).set({ status: "removed", decidedBy: by, decidedAt: now }).where(eq(homeSubmission.id, m[1]));
}

/** La ștergerea contului: pozele lui ies de pe prima pagină și fișierele lor se șterg. Întoarce cheile fișierelor. */
export async function dropUserSubmissions(db: Pick<Db, "select" | "insert">, userId: string): Promise<string[]> {
  const rows = await db.select({ id: homeSubmission.id, key: homeSubmission.fileKey }).from(homeSubmission).where(eq(homeSubmission.userId, userId));
  if (!rows.length) return [];
  let state = await homeImagesState(db);
  for (const r of rows) state = withoutSubmission(state, r.id);
  await saveHomeImagesState(db, state, userId);
  return rows.map((r) => r.key);
}

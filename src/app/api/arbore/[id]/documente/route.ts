import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { document, documentLink, person } from "@/db/schema";
import { currentUser, roleIn, can } from "@/lib/access";
import { documentKey, putObject, storageConfigured } from "@/lib/storage";
import { fileType } from "@/lib/file-type";
import { getT } from "@/i18n/server";

// Sub limita de 4,5 MB a corpului unei cereri pe Vercel.
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const ALLOWED = /^(image\/(jpeg|png|webp|gif|tiff)|application\/pdf|audio\/(mpeg|mp4|ogg|wav|webm|aac|x-m4a|opus|x-wav))$/;

const Meta = z.object({
  personId: z.string().uuid(),
  title: z.string().trim().min(1, "Dă un titlu documentului.").max(200),
  kind: z.enum(["act", "photo", "audio", "letter", "other"]),
  dateText: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional(),
  asProfile: z.boolean().optional(),
});

/** Încarcă un document (act, fotografie, scrisoare) în bucket-ul „assets” și îl leagă de o persoană din arbore. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: treeId } = await params;
  const te = await getT("TreeErrors");
  const me = await currentUser();
  if (!me) return Response.json({ error: te("signIn") }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(treeId) || !can(await roleIn(db, treeId, me.id), "contributor")) {
    return Response.json({ error: te("noUploadRight") }, { status: 403 });
  }
  if (!storageConfigured()) return Response.json({ error: te("storageOff") }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  const parsed = Meta.safeParse({ personId: form.get("personId"), title: form.get("title"), kind: form.get("kind"), dateText: form.get("dateText") || undefined,
    description: form.get("description") || undefined, asProfile: form.get("asProfile") === "on" });
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return Response.json({ error: i?.path[0] === "title" && i.code === "too_small" ? te("titleMissing") : i?.code === "too_big" ? te("tooLong") : te("badData") }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: te("fileMissing") }, { status: 400 });
  if (file.size > MAX_DOCUMENT_BYTES) return Response.json({ error: te("fileTooBig") }, { status: 413 });
  const type = fileType(file);
  if (!ALLOWED.test(type)) return Response.json({ error: te("fileType") }, { status: 415 });

  const v = parsed.data;
  const [p] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, v.personId), eq(person.treeId, treeId)));
  if (!p) return Response.json({ error: te("personGone") }, { status: 404 });

  const key = documentKey(treeId, file.name);
  await putObject(key, new Uint8Array(await file.arrayBuffer()), type);
  const [d] = await db.insert(document).values({
    treeId, kind: v.kind, title: v.title, dateText: v.dateText ?? null, description: v.description ?? null, fileKey: key, mimeType: type, uploadedBy: me.id,
  }).returning();
  // Poza sau glasul unei amintiri nu intră în album: le vede doar cine vede amintirea (vezi /api/document).
  const forMemory = form.get("forMemory") === "on";
  if (!forMemory) await db.insert(documentLink).values({ documentId: d.id, personId: p.id });
  // O fotografie poate deveni poza de profil; prima fotografie a unei persoane devine automat poza ei
  // (nu și poza pusă la o amintire, care poate fi casa, satul sau nunta).
  if (v.kind === "photo" && !forMemory) {
    const [cur] = await db.select({ photo: person.photoDocumentId }).from(person).where(eq(person.id, p.id));
    if (v.asProfile || !cur?.photo) await db.update(person).set({ photoDocumentId: d.id, updatedAt: new Date() }).where(eq(person.id, p.id));
  }
  return Response.json({ id: d.id, title: d.title, kind: d.kind, dateText: d.dateText, hasFile: true }, { status: 201 });
}

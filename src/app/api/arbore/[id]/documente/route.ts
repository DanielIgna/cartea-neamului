import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { document, documentLink, person } from "@/db/schema";
import { currentUser, roleIn, can } from "@/lib/access";
import { documentKey, putObject, storageConfigured } from "@/lib/storage";

// Sub limita de 4,5 MB a corpului unei cereri pe Vercel.
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const ALLOWED = /^(image\/(jpeg|png|webp|gif|tiff)|application\/pdf|audio\/(mpeg|mp4|ogg|wav))$/;

const Meta = z.object({
  personId: z.string().uuid(),
  title: z.string().trim().min(1, "Dă un titlu documentului.").max(200),
  kind: z.enum(["act", "photo", "audio", "letter", "other"]),
  dateText: z.string().trim().max(60).optional(),
});

/** Încarcă un document (act, fotografie, scrisoare) în bucket-ul „assets” și îl leagă de o persoană din arbore. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: treeId } = await params;
  const me = await currentUser();
  if (!me) return Response.json({ error: "Intră în cont." }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(treeId) || !can(await roleIn(db, treeId, me.id), "contributor")) {
    return Response.json({ error: "Nu ai drept să adaugi documente în acest arbore." }, { status: 403 });
  }
  if (!storageConfigured()) return Response.json({ error: "Stocarea de fișiere nu e configurată (lipsesc variabilele AWS_* de la Neon)." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  const parsed = Meta.safeParse({ personId: form.get("personId"), title: form.get("title"), kind: form.get("kind"), dateText: form.get("dateText") || undefined });
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Alege un fișier." }, { status: 400 });
  if (file.size > MAX_DOCUMENT_BYTES) return Response.json({ error: "Fișierul e mai mare de 4 MB." }, { status: 413 });
  if (!ALLOWED.test(file.type)) return Response.json({ error: "Acceptăm poze (JPG, PNG, WEBP, TIFF), PDF și audio." }, { status: 415 });

  const v = parsed.data;
  const [p] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, v.personId), eq(person.treeId, treeId)));
  if (!p) return Response.json({ error: "Persoana nu există în acest arbore." }, { status: 404 });

  const key = documentKey(treeId, file.name);
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  const [d] = await db.insert(document).values({
    treeId, kind: v.kind, title: v.title, dateText: v.dateText ?? null, fileKey: key, mimeType: file.type, uploadedBy: me.id,
  }).returning();
  await db.insert(documentLink).values({ documentId: d.id, personId: p.id });
  return Response.json({ id: d.id, title: d.title, kind: d.kind, dateText: d.dateText, hasFile: true }, { status: 201 });
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { document } from "@/db/schema";
import { currentUser, roleIn } from "@/lib/access";
import { canOpenDocument } from "@/lib/lada-db";
import { presignedGetUrl, storageConfigured, localStorageMode, getObjectBytes } from "@/lib/storage";
import { getT } from "@/i18n/server";
import { mediaFullIn } from "@/lib/plata";
import { bookPaid } from "@/lib/plati";

/** Poza în mic, pentru un arbore fără an plătit și fără „Păstrare” (vezi `fullMedia` din src/lib/plans.ts). */
async function preview(key: string) {
  const sharp = (await import("sharp")).default;
  const small = await sharp(Buffer.from(await getObjectBytes(key))).rotate().resize(320, 320, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 60 }).toBuffer();
  return new Response(new Uint8Array(small), { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=600", "x-content-type-options": "nosniff" } });
}

/** Deschide fișierul unui document: verificăm că e membru al arborelui, apoi redirecționăm spre un URL presemnat, valabil 10 minute. */
export async function GET(_: Request, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const me = await currentUser();
  if (!me) return new Response((await getT("Errors"))("signIn"), { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(docId)) return new Response((await getT("ApiErrors"))("noDocument"), { status: 404 });
  const [d] = await db.select({ treeId: document.treeId, fileKey: document.fileKey, mimeType: document.mimeType, uploadedBy: document.uploadedBy }).from(document).where(eq(document.id, docId));
  if (!d || !(await roleIn(db, d.treeId, me.id))) return new Response((await getT("ApiErrors"))("noDocument"), { status: 404 });
  if (!(await canOpenDocument(db, docId, d.treeId, d.uploadedBy, me.id))) return new Response((await getT("ApiErrors"))("noDocument"), { status: 404 });
  if (!d.fileKey) return new Response((await getT("ApiErrors"))("noFile"), { status: 404 });
  if (!storageConfigured()) return new Response((await getT("ApiErrors"))("noStorage"), { status: 503 });
  // După anul plătit, fără „Păstrare”: pozele altora doar în mic, glasurile și actele altora nu se deschid online. Ce a încărcat
  // omul însuși se deschide mereu întreg (sunt datele lui); la fel pentru cine are cartea PDF a arborelui plătită.
  if (d.uploadedBy !== me.id && !(await mediaFullIn(db, d.treeId, me.id)) && !(await bookPaid(db, me.id, d.treeId))) {
    if (d.mimeType?.startsWith("image/")) {
      try { return await preview(d.fileKey); } catch (e) { console.error("preview", e); }
    }
    return new Response((await getT("ApiErrors"))("mediaKept"), { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (localStorageMode()) return new Response(Buffer.from(await getObjectBytes(d.fileKey)), { headers: { "content-type": d.mimeType ?? "application/octet-stream", "cache-control": "private, max-age=600" } });
  return Response.redirect(await presignedGetUrl(d.fileKey), 302);
}

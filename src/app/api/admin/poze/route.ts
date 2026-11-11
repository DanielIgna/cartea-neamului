import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { homeImagesState, isHomeSlot, MAX_UPLOADS, saveHomeImagesState, withUpload } from "@/lib/home-images";
import { putObject, storageConfigured } from "@/lib/storage";
import { fileType } from "@/lib/file-type";

// Sub limita de 4,5 MB a corpului unei cereri pe Vercel; pagina micșorează poza în browser înainte s-o trimită.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = /^image\/(jpeg|png|webp)$/;
/** Primii octeți ai fișierului, ca să nu primim altceva botezat „.jpg”. */
function looksLikeImage(b: Uint8Array) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return jpeg || png || webp;
}

/** Admin → Poze prima pagină: adaugă o poză la un loc și o pune pe pagină (la banner, alături de celelalte). */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!isAdminUser(me) || !me) return Response.json({ error: "Nu ai voie aici." }, { status: 403 });
  if (!storageConfigured()) return Response.json({ error: "Locul pentru fișiere (Neon Storage) nu e pornit." }, { status: 503 });
  const form = await req.formData();
  const slot = form.get("slot"), file = form.get("file");
  if (!isHomeSlot(slot)) return Response.json({ error: "Locul pozei nu există." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Alege o poză." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Poza e prea mare (cel mult 4 MB)." }, { status: 413 });
  const type = fileType(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!ALLOWED.test(type) || !looksLikeImage(bytes)) return Response.json({ error: "Merg doar poze JPG, PNG sau WebP." }, { status: 415 });
  const state = await homeImagesState(db);
  if ((state[slot]?.uploads.length ?? 0) >= MAX_UPLOADS) return Response.json({ error: `Locul are deja ${MAX_UPLOADS} poze încărcate; șterge una înainte.` }, { status: 409 });
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const id = randomUUID();
  const key = `site/acasa/${slot}-${id}.${ext}`;
  await putObject(key, bytes, type);
  await saveHomeImagesState(db, withUpload(state, slot, { id, key, type, at: new Date().toISOString(), by: me.id }), me.id);
  revalidatePath("/");
  revalidatePath("/admin/poze");
  return Response.json({ ok: true });
}

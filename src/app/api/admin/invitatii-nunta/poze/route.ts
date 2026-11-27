import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { addProductPhoto, storageStore } from "@/lib/invitatii-nunta-incarcare";
import { storageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Admin → Invitații de nuntă: o poză de prezentare nouă pentru un model (micșorată în browser), pusă la sfârșitul listei. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) return Response.json({ error: "Nu ai voie aici." }, { status: 403 });
  if (!storageConfigured()) return Response.json({ error: "Locul pentru fișiere (Neon Storage) nu e pornit." }, { status: 503 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Alege o poză." }, { status: 400 });
  const id = String(form.get("id") ?? "");
  const r = await addProductPhoto(db, storageStore, { productId: id, body: new Uint8Array(await file.arrayBuffer()), width: Number(form.get("width")), height: Number(form.get("height")) });
  if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
  revalidatePath(`/admin/invitatii-nunta/${id}`);
  return Response.json(r);
}

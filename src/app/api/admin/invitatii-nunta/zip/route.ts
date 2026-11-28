import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { finishZipUpload, putZipChunk, storageStore } from "@/lib/invitatii-nunta-incarcare";
import { storageConfigured } from "@/lib/storage";
import { productById } from "@/lib/invitatii-nunta-produse";
import { SHOP_CATEGORIES } from "@/lib/invitatii-nunta";

export const dynamic = "force-dynamic";
// Lipirea și verificarea unui ZIP de 50–60 MB durează câteva secunde.
export const maxDuration = 60;

const no = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/**
 * Admin → Invitații de nuntă / Accesorii nuntă / Jurnale → fișierul unui produs (ZIP; la jurnale și PDF), urcat pe bucăți de 4 MB (src/lib/invitatii-nunta-incarcare.ts):
 * - ?pas=bucata&id=<model>&upload=<uuid>&n=<0…>: corpul e bucata, ca octeți;
 * - ?pas=gata, cu JSON { id, upload, parts, size }: lipește bucățile, verifică ZIP-ul și îl pune în locul celui vechi.
 * Doar pentru admin (verificat aici, pe server).
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) return no("Nu ai voie aici.", 403);
  if (!storageConfigured()) return no("Locul pentru fișiere (Neon Storage) nu e pornit.", 503);
  const url = new URL(req.url);
  if (url.searchParams.get("pas") === "bucata") {
    const id = url.searchParams.get("id") ?? "";
    if (!(await productById(db, id))) return no("Modelul nu există.", 404);
    const r = await putZipChunk(storageStore, id, url.searchParams.get("upload") ?? "", Number(url.searchParams.get("n")), new Uint8Array(await req.arrayBuffer()));
    return r.ok ? Response.json({ ok: true }) : no(r.error, 400);
  }
  if (url.searchParams.get("pas") === "gata") {
    const b = (await req.json().catch(() => ({}))) as { id?: unknown; upload?: unknown; parts?: unknown; size?: unknown };
    const r = await finishZipUpload(db, storageStore, { productId: String(b.id ?? ""), uploadId: String(b.upload ?? ""), parts: Number(b.parts), size: Number(b.size) });
    if (!r.ok) return no(r.error, 400);
    const admin = SHOP_CATEGORIES[(await productById(db, String(b.id)))?.category ?? "invitatie"].admin;
    revalidatePath(`${admin}/${String(b.id)}`);
    revalidatePath(admin);
    return Response.json(r);
  }
  return no("Cerere necunoscută.", 400);
}

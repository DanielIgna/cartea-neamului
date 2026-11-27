import { db } from "@/db";
import { modelBySlug } from "@/lib/invitatii-nunta";
import { countDownload, orderByToken } from "@/lib/invitatii-nunta-server";
import { getObjectBytes, localStorageMode, presignedGetUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Descărcarea ZIP-ului unei invitații: doar cu tokenul din email (sau de pe pagina de după plată), cel mult 30 de zile.
 * Fișierul stă privat în storage; aici se dă un link semnat de 10 minute spre el (pe calculatorul de dezvoltare, fișierul direct).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" };
  const found = await orderByToken(db, token).catch(() => null);
  if (!found) return new Response("Linkul nu este bun.", { status: 404, headers });
  if (found.expired) return new Response("Linkul a expirat. Scrie-ne la contact@carteaneamului.ro și îți trimitem unul nou.", { status: 410, headers });
  const model = modelBySlug(found.order.slug);
  if (!model) return new Response("Modelul nu mai există. Scrie-ne la contact@carteaneamului.ro.", { status: 404, headers });
  await countDownload(db, found.order.id).catch(() => {});
  try {
    if (localStorageMode()) {
      const bytes = await getObjectBytes(model.zipKey);
      return new Response(Buffer.from(bytes), { headers: { ...headers, "content-type": "application/zip", "content-disposition": `attachment; filename="${model.zipName}"` } });
    }
    return Response.redirect(await presignedGetUrl(model.zipKey, 600, model.zipName), 302);
  } catch (e) {
    console.error("invitatii-nunta descarca", e instanceof Error ? e.name : "Error");
    return new Response("Fișierul nu poate fi descărcat acum. Încearcă din nou peste câteva minute.", { status: 503, headers });
  }
}

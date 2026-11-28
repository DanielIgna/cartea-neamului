import { db } from "@/db";
import { modelBySlug } from "@/lib/invitatii-nunta-produse";
import { categoryOf } from "@/lib/invitatii-nunta";
import { countDownload, orderByToken } from "@/lib/invitatii-nunta-server";
import { getObjectBytes, localStorageMode, presignedGetUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Descărcarea unui produs din magazin (accesorii nuntă, jurnale de familie; merge și pentru invitații): doar cu tokenul din
 * email sau de pe pagina de după plată, cel mult 30 de zile. Fișierul (ZIP sau, la jurnale, PDF) stă privat în storage; aici se
 * dă un link semnat de 10 minute spre el. Produsul se caută în categoria comenzii.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" };
  const found = await orderByToken(db, token).catch(() => null);
  if (!found) return new Response("Linkul nu este bun.", { status: 404, headers });
  if (found.expired) return new Response("Linkul a expirat. Scrie-ne la contact@carteaneamului.ro și îți trimitem unul nou.", { status: 410, headers });
  const model = await modelBySlug(db, found.order.slug, { category: categoryOf(found.order.category) }).catch(() => null);
  if (!model?.zipKey) return new Response("Produsul nu mai există. Scrie-ne la contact@carteaneamului.ro.", { status: 404, headers });
  await countDownload(db, found.order.id).catch(() => {});
  const pdf = model.zipKey.endsWith(".pdf");
  const name = model.zipName ?? `${model.slug}.${pdf ? "pdf" : "zip"}`;
  try {
    if (localStorageMode()) {
      const bytes = await getObjectBytes(model.zipKey);
      return new Response(Buffer.from(bytes), { headers: { ...headers, "content-type": pdf ? "application/pdf" : "application/zip", "content-disposition": `attachment; filename="${name}"` } });
    }
    return Response.redirect(await presignedGetUrl(model.zipKey, 600, name), 302);
  } catch (e) {
    console.error("magazin descarca", e instanceof Error ? e.name : "Error");
    return new Response("Fișierul nu poate fi descărcat acum. Încearcă din nou peste câteva minute.", { status: 503, headers });
  }
}

import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { isPartner, partnerCsv, partnerExport } from "@/lib/partners";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Cheia pentru descărcarea din afara site-ului (de pildă un script): PARTNER_EXPORT_TOKEN, pusă pe Vercel. Fără ea, doar adminul. */
function tokenOk(req: Request) {
  const want = process.env.PARTNER_EXPORT_TOKEN?.trim();
  const got = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1]?.trim();
  if (!want || !got || want.length < 24) return false;
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Lista pentru partener, descărcată manual de admin din panou (Manager control) sau cu cheia PARTNER_EXPORT_TOKEN: DOAR
 * adresele de email ale conturilor cu acordul dat acum, cu data acordului și legătura de dezabonare. Cine își retrage acordul
 * nu mai apare de la următoarea descărcare. Fiecare descărcare se trece în jurnal (cine, când, câte adrese).
 */
export async function GET(req: Request, { params }: { params: Promise<{ partner: string }> }) {
  const { partner } = await params;
  const me = await currentUser().catch(() => null);
  const admin = await adminReady(me);
  if (!isPartner(partner) || (!admin && !tokenOk(req))) return new Response("Pagina nu există.", { status: 404 });
  const rows = await partnerExport(db, await siteOrigin(), partner);
  await db.insert(auditLog).values({ entity: "parteneri", entityId: partner, action: "export", actorId: admin ? me!.id : null, diff: { adrese: rows.length } })
    .catch((e) => console.error("jurnal export parteneri", e));
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex" };
  if (new URL(req.url).searchParams.get("format") === "json") return Response.json(rows, { headers });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(partnerCsv(rows), {
    headers: { ...headers, "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${partner}-${day}.csv"` },
  });
}

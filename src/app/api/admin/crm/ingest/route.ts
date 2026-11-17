import { db } from "@/db";
import { ingest, ingestAuthorized } from "@/lib/crm-ingest";

export const dynamic = "force-dynamic";

/**
 * Ingestia CRM (src/lib/crm-ingest.ts): primește evenimente (email trimis, nelivrat, răspuns, organizație nouă) de la cel care
 * trimite emailurile de prospectare. Cere `Authorization: Bearer <CRM_INGEST_TOKEN>`; fără cheia pusă în Vercel, e închisă.
 * Nu întoarce niciodată date din CRM, doar ce s-a întâmplat cu fiecare eveniment trimis.
 */
export async function POST(req: Request) {
  if (!ingestAuthorized(req.headers.get("authorization"))) return Response.json({ ok: false, error: "neautorizat" }, { status: 401 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 1_000_000) return Response.json({ ok: false, error: "prea mare" }, { status: 413 });
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "JSON stricat" }, { status: 400 }); }
  const r = await ingest(db, body);
  return Response.json(r, { status: r.error ? 400 : 200 });
}

export function GET() {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}

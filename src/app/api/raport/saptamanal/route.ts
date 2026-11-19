import { db } from "@/db";
import { reportAuthorized, weeklyReport } from "@/lib/raport-saptamanal";

export const dynamic = "force-dynamic";

/**
 * Cifrele pentru analiza de luni (src/lib/raport-saptamanal.ts): vizite, conturi, plăți reale și Search Console, doar adunate.
 * Cere `Authorization: Bearer <RAPORT_TOKEN>`; fără cheia pusă în Vercel, e închisă. `?zile=7` (implicit) sau 14, 28, 30.
 */
export async function GET(req: Request) {
  if (!reportAuthorized(req.headers.get("authorization"))) return Response.json({ ok: false, error: "neautorizat" }, { status: 401 });
  const z = Number(new URL(req.url).searchParams.get("zile") ?? 7);
  const days = [7, 14, 28, 30].includes(z) ? z : 7;
  const r = await weeklyReport(db, days);
  return Response.json({ ok: true, ...r }, { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

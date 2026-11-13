import { db } from "@/db";
import { runLoop } from "@/lib/autonomie";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ceasul zilnic al automatizărilor (vercel.json → crons). Vercel trimite singur „Authorization: Bearer CRON_SECRET” când cheia
 * e pusă în proiect; fără ea nu rulează nimic de aici, iar automatizările se pornesc doar din Admin → Autonomie.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  const { stats, ran } = await runLoop(db, "ceas");
  return Response.json({ ok: true, stats, ran: ran.map((r) => ({ key: r.key, status: r.status })) });
}

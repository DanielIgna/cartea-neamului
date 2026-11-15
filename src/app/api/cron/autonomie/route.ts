import { db } from "@/db";
import { runLoop } from "@/lib/autonomie";
import { sweepRewards } from "@/lib/invitatii";

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
  // Invitațiile care încă așteaptă dovada (email confirmat + o rudă în arbore): dacă au primit-o între timp, se dau zilele.
  const invites = await sweepRewards(db).catch((e) => { console.error("invitatii: verificarea zilnică", e); return null; });
  return Response.json({ ok: true, stats, invites, ran: ran.map((r) => ({ key: r.key, status: r.status })) });
}

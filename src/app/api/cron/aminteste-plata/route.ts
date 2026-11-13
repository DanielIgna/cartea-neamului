import { db } from "@/db";
import { reminderMailReady } from "@/lib/extra";
import { sendYearReminders } from "@/lib/autonomie";

/**
 * Aducerea aminte înainte de expirarea anului. Acum rulează din Admin → Autonomie („Email: anul plătit se termină”, prin
 * /api/cron/autonomie); adresa asta rămâne pentru cine o cheamă deja, cu aceeași cheie CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  if (!reminderMailReady()) return Response.json({ ok: false, reason: "fără serviciu de email" });
  const { sent } = await sendYearReminders(db);
  return Response.json({ ok: true, sent });
}

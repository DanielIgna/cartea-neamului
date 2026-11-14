import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

const startedAt = Date.now();
let served = 0;

/**
 * Semn de viață pentru un monitor extern (de ex. UptimeRobot): răspunde dacă site-ul și baza de date merg și cât a durat.
 * `warm: false` înseamnă că serverul tocmai a pornit („pornire la rece”). Nu arată nimic despre oameni sau chei.
 */
export async function GET() {
  served++;
  const t0 = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, dbMs: Date.now() - t0, warm: served > 1, upSeconds: Math.round((Date.now() - startedAt) / 1000), region: process.env.VERCEL_REGION ?? null },
      { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, dbMs: Date.now() - t0 }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

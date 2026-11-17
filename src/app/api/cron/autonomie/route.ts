import { db } from "@/db";
import { runLoop } from "@/lib/autonomie";
import { sweepRewards } from "@/lib/invitatii";
import { sql } from "drizzle-orm";
import { seoQueue } from "@/db/schema";
import { SITE_URL } from "@/lib/site-url";
import { gscSnapshot, seoSettings } from "@/lib/seo";
import { auditPages } from "@/lib/seo-audit";
import { publishedMap } from "@/lib/motor-seo/motor";
import { buildWeeklyReport, saveWeek } from "@/lib/seo-raport";

/** Lunea, cifrele săptămânii din Search Console intră în istoricul raportului SEO (Admin → SEO → Raport săptămânal). */
async function weeklySeo(now = new Date()) {
  if (now.getUTCDay() !== 1) return null;
  const gsc = await gscSnapshot(await seoSettings(db), SITE_URL, 7, true);
  if (gsc.state !== "legat") return gsc.state;
  const known = new Set(auditPages(await publishedMap(db)).map((p) => p.path));
  const [pub] = await db.select({ n: sql<number>`count(*)::int` }).from(seoQueue).where(sql`${seoQueue.status} = 'publicat' and ${seoQueue.publishedAt} > now() - interval '7 days'`);
  await saveWeek(db, buildWeeklyReport(gsc, known), Number(pub?.n ?? 0), now);
  return "salvat";
}

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
  const seo = await weeklySeo().catch((e) => { console.error("raport seo săptămânal", e); return null; });
  return Response.json({ ok: true, stats, invites, seo, ran: ran.map((r) => ({ key: r.key, status: r.status })) });
}

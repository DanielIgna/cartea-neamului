import { db } from "@/db";
import { automationSwitches, runAutomation } from "@/lib/autonomie";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ceasul de dimineață al CRM-ului (vercel.json → crons, 06:00 UTC = 08:00 în România iarna, 09:00 vara): rezumatul zilei pe email.
 * Rulează doar cu CRON_SECRET și doar dacă „CRM: rezumatul de dimineață” e pornită în Admin → Autonomie.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  const sw = await automationSwitches(db);
  const out: Record<string, string> = {};
  if (sw["crm-dimineata"] && !sw.paused?.["crm-dimineata"]) out["crm-dimineata"] = (await runAutomation(db, "crm-dimineata", "ceas")).status;
  return Response.json({ ok: true, ...out });
}

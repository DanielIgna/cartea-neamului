import { db } from "@/db";
import { automationSwitches, runAutomation } from "@/lib/autonomie";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ceasul CRM (vercel.json → crons, luni–vineri dimineața): lotul zilnic al campaniilor, în fereastra orară a fiecăreia.
 * Rulează doar cu CRON_SECRET și doar dacă „CRM: campanii către organizații” e pornită în Admin → Autonomie.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  const sw = await automationSwitches(db);
  const out: Record<string, string> = {};
  if (sw["crm-campanii"] && !sw.paused?.["crm-campanii"]) out["crm-campanii"] = (await runAutomation(db, "crm-campanii", "ceas")).status;
  // După lot: alertele CRM (eroare de 2 ori la rând, nelivrate peste 5%, „nu contacta”), dacă sunt pornite.
  if (sw["crm-alerte"] && !sw.paused?.["crm-alerte"]) out["crm-alerte"] = (await runAutomation(db, "crm-alerte", "ceas")).status;
  return Response.json({ ok: true, ...out });
}

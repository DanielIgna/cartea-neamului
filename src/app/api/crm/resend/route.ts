import { db } from "@/db";
import { appSetting } from "@/db/schema";
import { RESEND_LAST_KEY, resendEvent, sendByResendId, trackSend, verifyResendWebhook } from "@/lib/crm-campanii";

export const dynamic = "force-dynamic";

/**
 * Webhook-ul Resend pentru emailurile de campanie CRM: livrat, deschis, click, nelivrat, plângere (= dezabonare).
 * Semnătura se verifică cu RESEND_WEBHOOK_SECRET; fără ea nu se primește nimic. Emailurile care nu sunt de campanie se ignoră.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const ok = verifyResendWebhook(body, { id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature") }, process.env.RESEND_WEBHOOK_SECRET?.trim());
  if (!ok) return new Response("nu", { status: 401 });
  let p: unknown;
  try { p = JSON.parse(body); } catch { return new Response("json", { status: 400 }); }
  // Pentru Admin → CRM → Sănătate: ultimul eveniment semnat primit (doar tipul și ora, fără adresă).
  const type = String((p as { type?: unknown })?.type ?? "").slice(0, 40);
  const now = new Date();
  await db.insert(appSetting).values({ key: RESEND_LAST_KEY, value: { at: now.toISOString(), type }, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: { at: now.toISOString(), type }, updatedAt: now } }).catch(() => undefined);
  const e = resendEvent(p as Parameters<typeof resendEvent>[0]);
  if (!e) return Response.json({ ok: true, ignorat: true });
  const id = await sendByResendId(db, e.resendId);
  if (!id) return Response.json({ ok: true, ignorat: true });
  await trackSend(db, id, e.ev, new Date(), { soft: e.soft });
  return Response.json({ ok: true });
}

/** Verificare simplă: e pus secretul? (fără să-l arate). */
export async function GET() {
  return Response.json({ webhook: "resend", secret: !!process.env.RESEND_WEBHOOK_SECRET?.trim() });
}

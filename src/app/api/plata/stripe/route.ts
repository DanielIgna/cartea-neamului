import { db } from "@/db";
import { applyPayment, paidSession, verifyStripeSignature } from "@/lib/plati";
import { sendKeepMail } from "@/lib/pastrare";

/**
 * Confirmarea plăților trimisă de Stripe (în Stripe: Developers → Webhooks → adresa https://carteaneamului.ro/api/plata/stripe,
 * evenimentele „checkout.session.completed” și „checkout.session.async_payment_succeeded”). Fără semnătura bună, nu se ia în seamă.
 */
export async function POST(req: Request) {
  const body = await req.text();
  if (!verifyStripeSignature(body, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "")) {
    return new Response("semnătură greșită", { status: 400 });
  }
  let event: unknown;
  try { event = JSON.parse(body); } catch { return new Response("JSON greșit", { status: 400 }); }
  const paid = paidSession(event);
  if (paid && (await applyPayment(db, paid)) && paid.kind === "pastrare" && paid.userId) {
    // O dată pe an, cu fiecare „Păstrare” plătită: legătura spre arhiva completă, pe email. O greșeală aici nu strică plata.
    await sendKeepMail(db, paid.userId).catch((e) => console.error("sendKeepMail", e));
  }
  return Response.json({ ok: true });
}

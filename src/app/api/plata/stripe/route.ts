import { db } from "@/db";
import { applyPayment, paidSession, verifyStripeSignature } from "@/lib/plati";
import { sendKeepMail } from "@/lib/pastrare";
import { clientIp, logSecurity, stripeAlert } from "@/lib/securitate";
import { sendPaymentMail } from "@/lib/emailuri";

/**
 * Confirmarea plăților trimisă de Stripe (în Stripe: Developers → Webhooks → adresa https://carteaneamului.ro/api/plata/stripe,
 * evenimentele „checkout.session.completed” și „checkout.session.async_payment_succeeded”). Fără semnătura bună, nu se ia în seamă.
 */
export async function POST(req: Request) {
  const body = await req.text();
  if (!verifyStripeSignature(body, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "")) {
    // Cineva a trimis un mesaj fals la adresa plăților: îl scriem în jurnalul de securitate (Admin → Securitate).
    await logSecurity(db, { kind: "plata_semnatura", ip: clientIp(req.headers) }).catch(() => {});
    return new Response("semnătură greșită", { status: 400 });
  }
  let event: unknown;
  try { event = JSON.parse(body); } catch { return new Response("JSON greșit", { status: 400 }); }
  // Contestări la bancă și avertismente de fraudă de la Stripe Radar (dacă sunt bifate în Stripe → Webhooks): în Admin → Securitate.
  const alert = stripeAlert(event);
  if (alert) {
    await logSecurity(db, alert).catch((e) => console.error("stripe alert", e));
    return Response.json({ ok: true });
  }
  const paid = paidSession(event);
  // applyPayment întoarce true o singură dată pe sesiune Stripe: dacă Stripe trimite evenimentul din nou, emailurile nu pleacă a doua oară.
  if (paid && (await applyPayment(db, paid))) {
    // Confirmarea plății (planul, suma, data, legătura spre cont). O greșeală aici nu strică plata.
    await sendPaymentMail(db, paid).catch((e) => console.error("sendPaymentMail", e instanceof Error ? e.name : "Error"));
    if (paid.kind === "pastrare" && paid.userId) {
      // O dată pe an, cu fiecare „Păstrare” plătită: legătura spre arhiva completă, pe email.
      await sendKeepMail(db, paid.userId).catch((e) => console.error("sendKeepMail", e));
    }
  }
  return Response.json({ ok: true });
}

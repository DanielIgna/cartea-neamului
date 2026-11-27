import { db } from "@/db";
import { afterSchoolPayment } from "@/lib/scoli";
import { recordConversion } from "@/lib/conversii";
import { applyPayment, paidSession, verifyStripeSignature } from "@/lib/plati";
import { sendKeepMail } from "@/lib/pastrare";
import { clientIp, logSecurity, stripeAlert } from "@/lib/securitate";
import { sendPaymentMail } from "@/lib/emailuri";
import { afterPayment } from "@/lib/conversie";
import { afterCrmPayment } from "@/lib/crm-bani";
import { fixSubscription, linkSubscription, renewalPaid, subAfterUpgrade, subscriptionChanged } from "@/lib/abonament";
import { planSettings } from "@/lib/plans";
import { fulfilShopOrder, shopEvent } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/**
 * Confirmarea plăților trimisă de Stripe (în Stripe: Developers → Webhooks → adresa https://carteaneamului.ro/api/plata/stripe,
 * evenimentele „checkout.session.completed” și „checkout.session.async_payment_succeeded”; pentru abonamente, și „invoice.paid”,
 * „customer.subscription.updated” și „customer.subscription.deleted”). Fără semnătura bună, nu se ia în seamă.
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
  // Invitațiile de nuntă (src/lib/invitatii-nunta-server.ts): comenzi fără cont, cu tabelul lor; nu ajung la plățile contului.
  const shop = shopEvent(event);
  if (shop) {
    if (shop.paid) await fulfilShopOrder(db, shop.paid, await siteOrigin());
    return Response.json({ ok: true });
  }
  // Contestări la bancă și avertismente de fraudă de la Stripe Radar (dacă sunt bifate în Stripe → Webhooks): în Admin → Securitate.
  const alert = stripeAlert(event);
  if (alert) {
    await logSecurity(db, alert).catch((e) => console.error("stripe alert", e));
    return Response.json({ ok: true });
  }
  // Abonamentele (src/lib/abonament.ts): reînnoirea plătită adaugă perioada și trimite confirmarea; oprirea sau încheierea se ține minte.
  if (await subscriptionChanged(db, event).catch((e) => { console.error("abonament", e instanceof Error ? e.name : "Error"); return true; })) return Response.json({ ok: true });
  const renewed = await renewalPaid(db, event).catch((e) => { console.error("reinnoire", e instanceof Error ? e.name : "Error"); throw e; });
  if (renewed) {
    await sendPaymentMail(db, renewed).catch((e) => console.error("sendPaymentMail", e instanceof Error ? e.name : "Error"));
    return Response.json({ ok: true });
  }
  const paid = paidSession(event);
  if (paid?.sub) {
    // Abonamentul se leagă de cont (o dată sau de mai multe ori, la fel); la pornirea „de la sfârșitul anului” nu e plată acum.
    await linkSubscription(db, paid);
    if (paid.sub.start === "later") return Response.json({ ok: true });
  }
  // applyPayment întoarce true o singură dată pe sesiune Stripe: dacă Stripe trimite evenimentul din nou, emailurile nu pleacă a doua oară.
  if (paid && (await applyPayment(db, paid))) {
    // Plata încheiată, numărată la sursa vizitei în care s-a deschis (Admin → Analiză → Conversii). Plățile de probă ale adminilor nu au sursă și nu se numără.
    // Din gratuit în plătit: reducerea folosită și emailul căruia i se datorează plata (Admin → Analiză → Conversii).
    await afterPayment(db, paid).catch((e) => console.error("conversie", e instanceof Error ? e.name : "Error"));
    await afterSchoolPayment(db, paid).catch((e) => console.error("scoli", e instanceof Error ? e.name : "Error"));
    // CRM: plata contului adus de o organizație (codul ei NEAM-XXXX, linkul ei sau codul școlii) → venitul ei și „client”.
    await afterCrmPayment(db, paid).catch((e) => console.error("crm", e instanceof Error ? e.name : "Error"));
    if (paid.attr) await recordConversion(db, "plata", { attr: paid.attr, label: paid.kind, amount: paid.amount, currency: paid.currency });
    // Confirmarea plății (planul, suma, data, legătura spre cont). O greșeală aici nu strică plata.
    await sendPaymentMail(db, paid).catch((e) => console.error("sendPaymentMail", e instanceof Error ? e.name : "Error"));
    // Abonamentul trece pe prețul de reînnoire și fără cod; dacă Stripe nu răspunde acum, se reîncearcă zilnic.
    if (paid.sub && paid.userId) await fixSubscription(db, paid.userId).catch((e) => console.error("fixSubscription", e instanceof Error ? e.name : "Error"));
    if (paid.kind === "an" && paid.upgradeFrom && paid.tier && paid.userId) {
      await subAfterUpgrade(db, paid.userId, paid.tier, await planSettings(db)).catch((e) => console.error("subAfterUpgrade", e instanceof Error ? e.name : "Error"));
    }
    if (paid.kind === "pastrare" && paid.userId) {
      // O dată pe an, cu fiecare „Păstrare” plătită: legătura spre arhiva completă, pe email.
      await sendKeepMail(db, paid.userId).catch((e) => console.error("sendKeepMail", e));
    }
  }
  return Response.json({ ok: true });
}

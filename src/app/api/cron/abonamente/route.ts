import { db } from "@/db";
import { retrySubscriptions, sendRenewalReminders } from "@/lib/abonament";

/**
 * Zilnic (vercel.json): emailul cu 7 zile înainte de fiecare plată anuală sau trimestrială și reîncercarea opririlor și a
 * prețurilor de reînnoire care n-au ajuns la Stripe. Mereu pornit (nu e o automatizare de marketing): omul trebuie să afle
 * dinainte când i se ia bani. Cheia: CRON_SECRET, ca la celelalte.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  const mails = await sendRenewalReminders(db);
  const stripe = process.env.STRIPE_SECRET_KEY?.trim() ? await retrySubscriptions(db) : null;
  return Response.json({ ok: true, mails, stripe });
}

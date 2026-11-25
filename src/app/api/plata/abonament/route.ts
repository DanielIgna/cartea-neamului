import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { cardPortal, resumeRenewal, stopRenewal, subscriptionOf } from "@/lib/abonament";
import { siteOrigin } from "@/lib/site";

/**
 * Abonamentul omului, din /plata (25.11.2026): „Oprește reînnoirea” (un clic, fără întrebări), „Pornește din nou reînnoirea”
 * și „Schimbă cardul” (pagina Stripe pentru card și facturi). Oprirea se ține minte la noi chiar dacă Stripe nu răspunde pe loc.
 */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const back = (q: string) => Response.redirect(`${origin}/plata?${q}#abonament`, 303);
  const me = await currentUser();
  if (!me) return Response.redirect(`${origin}/intrare?next=/plata`, 303);
  const action = String((await req.formData()).get("action") ?? "");
  if (action === "opreste") {
    const r = await stopRenewal(db, me.id);
    return back(r === "nimic" ? "eroare=1" : "abonament=oprit");
  }
  if (action === "reporneste") return back((await resumeRenewal(db, me.id)) ? "abonament=pornit" : "eroare=abonament");
  if (action === "card") {
    const sub = await subscriptionOf(db, me.id);
    const url = sub?.stripeCustomer ? await cardPortal(sub.stripeCustomer, `${origin}/plata#abonament`) : null;
    return url ? Response.redirect(url, 303) : back("eroare=card");
  }
  return back("eroare=1");
}

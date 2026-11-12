import { db } from "@/db";
import { currentUser, roleInTree } from "@/lib/access";
import { recordConsent } from "@/lib/consent";
import { isAdminUser } from "@/lib/admin";
import { createCheckout, isPayKind, priceFor, stripeReady } from "@/lib/plati";
import { userAccess } from "@/lib/plata";
import { siteOrigin } from "@/lib/site";
import { getLocale, getT } from "@/i18n/server";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * „Plătește cu cardul” de pe /plata: ține minte acordul pentru începerea imediată (fără cele 14 zile de retragere, cum cere
 * legea pentru conținut digital) și trimite omul la pagina de plată din Stripe. Confirmarea vine separat, la /api/plata/stripe.
 */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const back = (q: string) => Response.redirect(`${origin}/plata?${q}`, 303);
  const me = await currentUser();
  if (!me) return Response.redirect(`${origin}/intrare?next=/plata`, 303);
  const form = await req.formData();
  const kind = form.get("kind");
  const treeId = String(form.get("treeId") ?? "");
  const tq = treeId ? `&carte=${treeId}` : "";
  if (!isPayKind(kind)) return back("eroare=1");
  if (!stripeReady()) return back(`eroare=curand${tq}`);
  if (form.get("acord") !== "on") return back(`eroare=acord${tq}`);
  const { settings, ownsTree } = await userAccess(db, me.id);
  if (!settings.on && !isAdminUser(me)) return back("eroare=1");
  if (kind === "carte" && (!UUID.test(treeId) || !(await roleInTree(db, treeId, me.id)))) return back("eroare=1");
  await recordConsent(db, me.id, "withdrawal", true);
  const locale = await getLocale();
  const t = await getT("Plata");
  const price = priceFor(kind, locale, ownsTree, settings);
  try {
    const url = await createCheckout({
      kind, userId: me.id, email: me.email, treeId: kind === "carte" ? treeId : null, name: t(kind === "carte" ? "bookName" : "yearName"),
      amount: price.amount, currency: price.currency, locale,
      successUrl: `${origin}/plata?gata=${kind}${tq}`, cancelUrl: `${origin}/plata?${tq.slice(1) || "renuntat=1"}`,
    });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error(e);
    return back(`eroare=1${tq}`);
  }
}

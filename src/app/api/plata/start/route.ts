import { db } from "@/db";
import { currentUser, roleInTree } from "@/lib/access";
import { recordConsent } from "@/lib/consent";
import { isAdminUser } from "@/lib/admin";
import { claimIncludedBook, createCheckout, isPayKind, money, priceFor, quoteYear, stripeReady } from "@/lib/plati";
import { testAccess, userAccess } from "@/lib/plata";
import { isTier, mayKeep, tierPrice, type Tier } from "@/lib/plans";
import { siteOrigin } from "@/lib/site";
import { getLocale, getT } from "@/i18n/server";
import { operator } from "@/lib/legal";
import { contactPhone } from "@/lib/contact";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * „Plătește cu cardul” de pe /plata: ține minte acordul pentru începerea imediată (fără cele 14 zile de retragere, cum cere
 * legea pentru conținut digital) și trimite omul la pagina de plată din Stripe. Confirmarea vine separat, la /api/plata/stripe.
 * Anul se plătește pe un plan (Basic, Familie, Premium); prețul (întreg sau diferența pe zilele rămase) se socotește aici,
 * din setări, nu din formular. Tot de aici se alege cartea PDF inclusă în plan (fără plată).
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
  const { access, settings, ownsTree } = await userAccess(db, me.id);
  if (kind === "carte" && (!UUID.test(treeId) || !(await roleInTree(db, treeId, me.id)))) return back("eroare=1");
  // Cartea inclusă în plan: se trece pe loc, fără Stripe.
  if (kind === "carte" && form.get("inclus") === "1") {
    return back((await claimIncludedBook(db, me.id, treeId, access, settings)) ? `gata=inclus${tq}` : `eroare=1${tq}`);
  }
  if (!stripeReady()) return back(`eroare=curand${tq}`);
  if (form.get("acord") !== "on") return back(`eroare=acord${tq}`);
  if (!settings.on && !isAdminUser(me)) return back("eroare=1");
  const locale = await getLocale();
  const t = await getT("Plata");
  let price = priceFor(kind, locale, ownsTree, settings);
  let year: { tier: Tier; upgradeFrom: Tier | null; paidUntil: Date | null; extra?: "carte" | null; forName?: string | null; note?: string | null } | null = null;
  if (kind === "an") {
    const tier = form.get("tier");
    if (!isTier(tier)) return back("eroare=1");
    // Cu plățile oprite, adminul încearcă plata ca un om obișnuit, după anul lui de probă (dacă a plătit deja unul).
    const a = settings.on ? access : await testAccess(db, me.id);
    const quote = quoteYear(tier, a, ownsTree, locale, settings);
    if (!quote.ok) return back(`eroare=${quote.reason === "downgrade" ? "jos" : "1"}`);
    // Pachetul Basic + cartea PDF: doar pentru un an Basic întreg (nu la o trecere pe alt plan), cu prețul din Admin.
    const bundle = form.get("pachet") === "1" && tier === "basic" && !quote.upgradeFrom && (locale === "ro" ? settings.bundleLei : settings.bundleEur) > 0;
    price = money(bundle ? (locale === "ro" ? settings.bundleLei : settings.bundleEur) : quote.value, locale);
    year = { tier, upgradeFrom: quote.upgradeFrom, paidUntil: quote.until, extra: bundle ? "carte" : null };
  }
  if (kind === "cadou") {
    // Un an dăruit: prețul întreg al planului ales; biletul și numele celui care îl primește ajung pe pagina darului.
    const tier = form.get("tier");
    if (!isTier(tier)) return back("eroare=1");
    const p = tierPrice(tier, true, settings);
    price = money(locale === "ro" ? p.lei : p.eur, locale);
    year = { tier, upgradeFrom: null, paidUntil: null, forName: String(form.get("forName") ?? "").trim().slice(0, 120) || null, note: String(form.get("note") ?? "").trim().slice(0, 400) || null };
  }
  let keepTree: string | null = null;
  if (kind === "pastrare") {
    // „Păstrarea”: doar după un an avut, cu anul terminat (adminul o poate încerca oricând). Cu pachetul, și cartea PDF a unui arbore.
    if (!isAdminUser(me) && !mayKeep(access)) return back("eroare=1");
    const lei = locale === "ro";
    const bundle = form.get("pachet") === "1" && UUID.test(treeId) && (lei ? settings.keepBookLei : settings.keepBookEur) > 0;
    if (bundle && !(await roleInTree(db, treeId, me.id))) return back("eroare=1");
    const value = bundle ? (lei ? settings.keepBookLei : settings.keepBookEur) : (lei ? settings.keepLei : settings.keepEur);
    if (value <= 0) return back("eroare=1");
    price = money(value, locale);
    keepTree = bundle ? treeId : null;
    year = { tier: "basic", upgradeFrom: null, paidUntil: null, extra: bundle ? "carte" : null };
  }
  await recordConsent(db, me.id, "withdrawal", true);
  try {
    const url = await createCheckout({
      kind, userId: me.id, email: me.email, treeId: kind === "carte" ? treeId : keepTree,
      name: kind === "pastrare" ? (await getT("Keep"))(keepTree ? "bundleName" : "name") : kind === "carte" ? t("bookName") : kind === "cadou" ? t("giftName", { plan: t(`tiers.${year!.tier}.name`) })
        : year?.extra ? t("bundleName") : t("yearName", { plan: t(`tiers.${year!.tier}.name`) }),
      amount: price.amount, currency: price.currency, locale,
      successUrl: `${origin}/plata?gata=${kind}${kind === "pastrare" ? "" : tq}`, cancelUrl: `${origin}/plata?renuntat=1${tq}`,
      ...(year ?? {}),
      // Confirmarea acordului de retragere pe suport durabil (OUG 34/2014, art. 12 alin. 7): pe pagina Stripe și pe factura trimisă pe email.
      waiver: t("waiverRecord", { url: `${origin}/termeni` }),
      seller: `${operator().name}, CUI ${operator().cui}, ${operator().regCom}, ${operator().address}. ${operator().email}, ${contactPhone()}`,
      ...(kind === "pastrare" ? { tier: undefined } : {}),
    });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error(e);
    return back(`eroare=1${tq}`);
  }
}

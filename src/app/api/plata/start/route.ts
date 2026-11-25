import { attributionOf, attributionToMetadata, recordConversion } from "@/lib/conversii";
import { db } from "@/db";
import { currentUser, roleInTree } from "@/lib/access";
import { recordConsent } from "@/lib/consent";
import { isAdminUser } from "@/lib/admin";
import { claimIncludedBook, createCheckout, currencyFor, isPayKind, money, priceFor, quoteYear, stripeReady } from "@/lib/plati";
import { testAccess, userAccess } from "@/lib/plata";
import { isPeriod, isTier, mayKeep, periodPrice, tierPrice, tierRank, type Period, type Tier } from "@/lib/plans";
import { amountIn, isLoyal, nextCharge, subscriptionOf } from "@/lib/abonament";
import { siteOrigin } from "@/lib/site";
import { getLocale, getT } from "@/i18n/server";
import { operator } from "@/lib/legal";
import { contactPhone } from "@/lib/contact";
import { activeOffer } from "@/lib/conversie";
import { activeSchoolOffer } from "@/lib/scoli";
import { cleanTypedCode, linkCodeOffer, typedCodeOffer } from "@/lib/cod-link";

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
  const tS = await getT("Sub");
  // Moneda: lei în română; altfel euro sau, cu moneda locală pornită în Admin, după țara de unde plătește (aceeași ca pe /plata).
  const cur = currencyFor(locale, req.headers.get("x-vercel-ip-country"), settings);
  let price = priceFor(kind, locale, ownsTree, settings, "basic", cur);
  let year: { tier: Tier; upgradeFrom: Tier | null; paidUntil: Date | null; extra?: "carte" | null; forName?: string | null; note?: string | null } | null = null;
  // Abonamentul (25.11.2026, src/lib/abonament.ts): perioada aleasă, suma reînnoirilor și dacă prima plată e acum sau la
  // sfârșitul anului deja plătit; cu pachetul, cartea PDF e o linie plătită o singură dată.
  let sub: { period: Period; renewAmount: number; start: "now" | "later"; trialEnd?: Date | null; customer?: string | null; description?: string } | null = null;
  let once: { name: string; amount: number } | null = null;
  if (kind === "an") {
    const tier = form.get("tier");
    if (!isTier(tier)) return back("eroare=1");
    const period: Period = isPeriod(form.get("period")) ? (form.get("period") as Period) : "an";
    // Cu plățile oprite, adminul încearcă plata ca un om obișnuit, după anul lui de probă (dacă a plătit deja unul).
    const a = settings.on ? access : await testAccess(db, me.id);
    const subsOn = settings.subs;
    const mine = subsOn ? await subscriptionOf(db, me.id) : null;
    const running = a.kind === "platit" && a.until && a.until > new Date() ? a : null;
    // Pornirea reînnoirii „de la sfârșitul perioadei plătite”: pe același plan sau pe unul mai mic (schimbarea se face la reînnoire).
    const laterWanted = subsOn && !!running && (form.get("start") === "later" || tier === running.tier) && tierRank(tier) <= tierRank(running.tier);
    if (subsOn && mine?.stripeSub && mine.renews && mine.tier === tier && mine.period === period) return back("eroare=1");
    if (laterWanted && running?.until) {
      const lei = locale === "ro";
      const renew = periodPrice(tier, period, ownsTree, settings, true);
      if (!renew) return back("eroare=1");
      const startAt = mine?.stripeSub ? nextCharge(running.until) : running.until;
      // Stripe cere ca prima plată să fie la cel puțin 48 de ore; mai aproape de atât, plata se face acum și perioada se adaugă după cea în curs.
      const later = startAt.getTime() > Date.now() + 49 * 3_600_000;
      price = money(lei ? renew.lei : renew.eur, locale, cur, settings);
      year = { tier, upgradeFrom: null, paidUntil: null, extra: null };
      sub = { period, renewAmount: amountIn(price.currency, renew, settings), start: later ? "later" : "now", trialEnd: later ? startAt : null, customer: mine?.stripeCustomer ?? null };
    } else {
      const quote = quoteYear(tier, a, ownsTree, locale, settings);
      if (!quote.ok) return back(`eroare=${quote.reason === "downgrade" ? "jos" : "1"}`);
      if (quote.upgradeFrom || !subsOn) {
        // Trecerea pe un plan mai mare în timpul perioadei: diferența pe zilele rămase, o singură plată (ca înainte). Abonamentul,
        // dacă e, se reînnoiește apoi pe planul nou (src/lib/abonament.ts, `subAfterUpgrade`). Fără abonamente: anul plătit o dată.
        const bundle = !quote.upgradeFrom && form.get("pachet") === "1" && tier === "basic" && (locale === "ro" ? settings.bundleLei : settings.bundleEur) > 0;
        price = money(bundle ? (locale === "ro" ? settings.bundleLei : settings.bundleEur) : quote.value, locale, cur, settings);
        year = { tier, upgradeFrom: quote.upgradeFrom, paidUntil: quote.until, extra: bundle ? "carte" : null };
      } else {
        // Abonament nou, cu prima plată acum. Cine a mai avut un an plătește anul la prețul de reînnoire.
        const lei = locale === "ro";
        const loyal = await isLoyal(db, me.id, settings);
        const first = periodPrice(tier, period, ownsTree, settings, loyal);
        const renew = periodPrice(tier, period, ownsTree, settings, true);
        if (!first || !renew) return back("eroare=1");
        // Pachetul Basic + cartea PDF (doar anual): anul Basic e abonamentul, iar diferența până la prețul pachetului e cartea, o dată.
        const bundleV = lei ? settings.bundleLei : settings.bundleEur;
        const bundle = form.get("pachet") === "1" && tier === "basic" && period === "an" && bundleV > (lei ? first.lei : first.eur);
        price = money(lei ? first.lei : first.eur, locale, cur, settings);
        if (bundle) once = { name: t("bookName"), amount: money(bundleV, locale, cur, settings).amount - price.amount };
        year = { tier, upgradeFrom: null, paidUntil: null, extra: bundle ? "carte" : null };
        sub = { period, renewAmount: amountIn(price.currency, renew, settings), start: "now", customer: mine?.stripeCustomer ?? null };
      }
    }
    if (sub) sub.description = tS("product", { plan: t(`tiers.${tier}.name`), period: tS(`periodsLow.${sub.period}`) });
  }
  if (kind === "cadou") {
    // Un an dăruit: prețul întreg al planului ales; biletul și numele celui care îl primește ajung pe pagina darului.
    const tier = form.get("tier");
    if (!isTier(tier)) return back("eroare=1");
    const p = tierPrice(tier, true, settings);
    price = money(locale === "ro" ? p.lei : p.eur, locale, cur, settings);
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
    price = money(value, locale, cur, settings);
    keepTree = bundle ? treeId : null;
    year = { tier: "basic", upgradeFrom: null, paidUntil: null, extra: bundle ? "carte" : null };
  }
  // Codurile de reducere (scrise sau din link) merg doar la planul Basic, la plata anuală făcută acum (NEAM90: Basic, un an, Daniel 25.11.2026).
  const yearly = !sub || (sub.period === "an" && sub.start === "now");
  const basicYear = kind === "an" && year?.tier === "basic" && yearly;
  // Reducerea de după zilele gratuite: pe anul întreg (nu pe o trecere la alt plan), cât e valabilă; codul se pune singur.
  const offer = kind === "an" && year && !year.upgradeFrom && yearly ? await activeOffer(db, me.id) : null;
  // Codul clasei (Admin → Școli), dacă omul a venit prin linkul lui și nu are reducerea de mai sus: se pune singur.
  const school = kind === "an" && year && !year.upgradeFrom && yearly && !offer?.stripePromoId ? await activeSchoolOffer(db, me.id).catch(() => null) : null;
  // NEAM90 sau codul unei organizații, venit prin linkul /cod/<COD>: doar pe primul an întreg (nu pe pachet), dacă n-are altă reducere.
  const linked = await linkCodeOffer(db, { userId: me.id, cookie: req.headers.get("cookie"),
    fullFirstYear: basicYear && !!year && !year.upgradeFrom && !year.extra, other: !!offer?.stripePromoId || !!school }).catch(() => null);
  // Codul scris de om în câmpul de pe /plata: dacă e bun, el e singura reducere; dacă nu, omul se întoarce cu mesajul potrivit.
  const typedRaw = cleanTypedCode(form.get("cod"));
  if (typedRaw && kind === "an" && !basicYear) return back(`eroare=codplan${tq}`);
  const typed = typedRaw ? await typedCodeOffer(db, { userId: me.id, code: typedRaw,
    fullFirstYear: kind === "an" && !!year && !year.upgradeFrom && !year.extra && yearly }) : null;
  if (typed && !typed.ok) return back(`eroare=${typed.reason === "year" ? "codan" : "cod"}${tq}`);
  await recordConsent(db, me.id, "withdrawal", true);
  // De unde venise vizita (Google, o campanie, o pagină de ghid…): numărăm deschiderea plății și trimitem sursa prin Stripe, ca plata
  // încheiată să se numere la aceeași sursă. Plățile de probă ale adminilor nu se numără.
  const counted = !isAdminUser(me);
  const attr = counted ? await attributionOf(db, req.headers) : null;
  if (attr) await recordConversion(db, "plata-start", { attr, label: kind });
  try {
    const url = await createCheckout({
      kind, userId: me.id, email: me.email, treeId: kind === "carte" ? treeId : keepTree,
      name: kind === "pastrare" ? (await getT("Keep"))(keepTree ? "bundleName" : "name") : kind === "carte" ? t("bookName") : kind === "cadou" ? t("giftName", { plan: t(`tiers.${year!.tier}.name`) })
        : sub ? tS("product", { plan: t(`tiers.${year!.tier}.name`), period: tS(`periodsLow.${sub.period}`) })
        : year?.extra ? t("bundleName") : t("yearName", { plan: t(`tiers.${year!.tier}.name`) }),
      amount: price.amount, currency: price.currency, locale,
      successUrl: `${origin}/plata?gata=${sub?.start === "later" ? "reinnoire" : kind}${kind === "pastrare" ? "" : tq}`, cancelUrl: `${origin}/plata?renuntat=1${tq}`,
      ...(year ?? {}),
      // Confirmarea acordului de retragere pe suport durabil (OUG 34/2014, art. 12 alin. 7): pe pagina Stripe și pe factura trimisă pe email.
      waiver: t("waiverRecord", { url: `${origin}/termeni` }) + (sub ? ` ${tS("consentRecord")}` : ""),
      seller: `${operator().name}, CUI ${operator().cui}, ${operator().regCom}, ${operator().address}. ${operator().email}, ${contactPhone()}`,
      ...(kind === "pastrare" ? { tier: undefined } : {}),
      // O singură reducere pe plată: codul scris de om, altfel cea de după zilele gratuite, altfel codul clasei, altfel codul din link.
      offer: typed?.ok ? { code: typed.code, promoId: typed.promoId } : offer?.stripePromoId ? { code: offer.code, promoId: offer.stripePromoId } : school ?? linked,
      promoField: isAdminUser(me),
      sub, once,
      attribution: attr ? { ...attributionToMetadata(attr), ...(attr.attributed ? {} : { "metadata[a_src]": "necunoscut" }) } : undefined,
    });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error(e);
    return back(`eroare=1${tq}`);
  }
}

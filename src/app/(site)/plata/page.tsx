import Link from "next/link";
import ConsentGuard from "@/components/ConsentGuard";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser, roleInTree } from "@/lib/access";
import { isAdminUser, isOwnerUser } from "@/lib/admin";
import { operator } from "@/lib/legal";
import { cookies, headers } from "next/headers";
import { LINK_CODE_COOKIE, cleanLinkCode } from "@/lib/cod-link";
import { bookAccess, bookIncluded, bookPaid, currencyFor, includedBooksLeft, money as moneyIn, priceFor, quoteYear } from "@/lib/plati";
import { testAccess, userAccess } from "@/lib/plata";
import { LIMIT_KEYS, TIERS, isKept, isPeriod, isTier, mayKeep, periodPrice, periodsFor, tierBook, tierLimits, tierPrice, tierRank, trialLimits, yearSaving, comparePrice, type Access, type Period, type Tier } from "@/lib/plans";
import { isLoyal, nextCharge, subscriptionOf } from "@/lib/abonament";
import { formatPaid } from "@/lib/emailuri";
import type { Locale } from "@/i18n/locales";
import { getLocale, getT } from "@/i18n/server";
import { activeOffer } from "@/lib/conversie";
import { giftsBy } from "@/lib/extra";
import { siteOrigin } from "@/lib/site";
import { contactPhone } from "@/lib/contact";
import { archiveAppliesTo } from "@/lib/arhivare";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("Plata"))("title"), robots: { index: false } };
}

const UUID = /^[0-9a-f-]{36}$/i;
const REMIND = 7;

/**
 * Plata: cele trei planuri pe un an (Basic, Familie, Premium) și, cu `?carte=<arbore>`, cartea PDF a acelui arbore.
 * Omul bifează că accesul începe imediat (fără cele 14 zile de retragere), apoi plătește pe pagina Stripe. Cât timp vânzarea
 * e oprită din Admin, doar adminul vede butoanele (ca să încerce plata); ceilalți află că nu trebuie să plătească nimic.
 * Prețurile și plafoanele vin din Admin → Manager control.
 */
export default async function PlataPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const str = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  // „Dăruiește acum” de pe /cadou-de-sarbatori: planul ales rămâne și după intrarea în cont, iar darul vine primul pe pagină.
  const dar = (TIERS as readonly string[]).includes(str("dar")) ? (str("dar") as Tier) : null;
  const me = await requireUser(dar ? `/plata?dar=${dar}` : "/plata");
  const [t, tk, tg, ts, tpr, locale] = await Promise.all([getT("Plata"), getT("Keep"), getT("GiftPage"), getT("Sub"), getT("Preturi"), getLocale()]);
  const { access, settings: s, ownsTree } = await userAccess(db, me.id);
  const admin = isAdminUser(me);
  const open = s.on || admin;
  // Cât timp vânzarea e oprită, adminul face plăți de probă ca un om obișnuit: îi arătăm anul lui de probă, dacă l-a plătit.
  const payAccess: Access = s.on ? access : admin ? await testAccess(db, me.id) : access;
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(d);
  const nf = new Intl.NumberFormat(locale);
  const op = operator();
  const lei = locale === "ro";
  // Moneda: lei în română; altfel euro sau moneda locală (dacă e pornită în Admin), aceeași ca la /api/plata/start.
  const cur = currencyFor(locale, (await headers()).get("x-vercel-ip-country"), s);
  const money = (v: number, l: string) => moneyIn(v, l, cur, s);
  const tierName = (x: Tier) => t(`tiers.${x}.name`);

  const treeId = UUID.test(str("carte")) ? str("carte") : null;
  const bookTree = treeId && (await roleInTree(db, treeId, me.id))
    ? (await db.select({ id: tree.id, name: tree.name, ownerId: tree.ownerId }).from(tree).where(eq(tree.id, treeId)))[0] ?? null : null;
  const book = bookTree ? {
    ...bookTree,
    paid: await bookPaid(db, me.id, bookTree.id),
    included: bookIncluded(payAccess, s, bookTree.ownerId === me.id),
    // „Acces gratuit” (Admin → Oameni), proprietarii site-ului, primul an din beta: cartea fără plată.
    free: ["gratuit", "beta"].includes((await bookAccess(db, { userId: me.id, treeId: bookTree.id, access: payAccess, settings: s, ownsThisTree: bookTree.ownerId === me.id, owner: isOwnerUser(me) })) ?? ""),
    canClaim: (await includedBooksLeft(db, me.id, payAccess, s)) === 1,
  } : null;

  // Arhiva sigilată: pentru conturile făcute după pornirea regulilor, textele spun termenele noi (src/lib/arhivare.ts).
  const [arch, tn] = await Promise.all([archiveAppliesTo(db, me.id), getT("ArchiveNote")]);

  const err = str("eroare");
  // Abonamentul (src/lib/abonament.ts): perioada aleasă sus (implicit anual), abonamentul omului și dacă a mai avut un an.
  const subsOn = s.subs;
  const period: Period = subsOn && isPeriod(str("perioada")) ? (str("perioada") as Period) : "an";
  // Planul ales pe prima pagină („Alege Familie”): cardul lui iese în evidență și pagina se oprește la el (#plan-familie).
  const chosen = isTier(str("plan")) ? str("plan") : null;
  const mine = subsOn ? await subscriptionOf(db, me.id) : null;
  const loyal = subsOn ? await isLoyal(db, me.id, s) : false;
  const subNotice = str("abonament") === "oprit" ? ts("stopped") : str("abonament") === "pornit" ? ts("resumed") : str("gata") === "reinnoire" ? ts("thanksLater")
    : err === "abonament" ? ts("errResume") : err === "card" ? ts("errCard") : null;
  const notice = subNotice ?? (str("gata") === "pastrare" ? tk("thanks") : str("gata") === "inclus" ? t("thanksIncluded") : str("gata") === "cadou" ? t("thanksGift") : str("gata") ? t("thanks") : str("renuntat") ? t("cancelled")
    : err === "acord" ? t("errAcord") : err === "curand" ? t("errSoon") : err === "jos" ? t("errDown") : err === "cod" ? t("errCode") : err === "codan" ? t("errCodeYear") : err === "codplan" ? t("errCodePlan") : err ? t("err") : null);

  const status = payAccess.kind === "mereu" ? t("freeForever")
    : payAccess.kind === "platit" ? (payAccess.until ? t("tierUntil", { plan: tierName(payAccess.tier), date: date(payAccess.until) }) : t("freeForever"))
    : payAccess.kind === "beta" ? `${t("beta", { date: date(payAccess.until) })} ${t("betaLimits")}`
    : payAccess.kind === "proba" ? (s.on ? t("trial", { days: payAccess.daysLeft }) : t("adminTest"))
    : payAccess.kind === "expirat" ? t("ended")
    : t("notNeeded");
  const currentTier = payAccess.kind === "platit" && payAccess.until && payAccess.until > new Date() ? payAccess.tier : null;
  const tl = trialLimits(s);
  const bundle = lei ? s.bundleLei : s.bundleEur;
  const gifts = await giftsBy(db, me.id);
  const origin = await siteOrigin();

  // „Păstrarea”: după un an avut (plătit sau beta), cu anul terminat; adminul o poate încerca oricând.
  const keepPrice = lei ? s.keepLei : s.keepEur;
  const keepBook = lei ? s.keepBookLei : s.keepBookEur;
  const showKeep = keepPrice > 0 && (mayKeep(payAccess) || (admin && !s.on));
  const myTrees = showKeep && keepBook > 0
    ? await db.select({ id: tree.id, name: tree.name }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id)).orderBy(tree.name)
    : [];

  // Din gratuit în plătit (src/lib/conversie.ts): reducerea valabilă acum.
  const tc = await getT("Conversion");
  const offer = await activeOffer(db, me.id);
  // NEAM90 sau codul unei organizații, venit prin linkul /cod/<COD> (src/lib/cod-link.ts): se pune singur la plata primului an.
  const linkCode = cleanLinkCode((await cookies()).get(LINK_CODE_COOKIE)?.value);
  const offerLine = offer ? tc("offerPlata", { percent: String(offer.percent), code: offer.code,
    until: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(offer.expiresAt) }) : null;

  // Căsuța acordului (Daniel, 24.11.2026: nimeni nu ajungea la Stripe): mare și ușor de atins pe telefon; dacă omul apasă pe plată
  // fără ea, sub căsuță apare pe loc „Bifează căsuța ca să poți plăti.” (CSS :user-invalid), nu doar bula mică a browserului.
  const consent = (
    <>
      <label className="check pay-consent"><input type="checkbox" name="acord" required /> <span>{t("consent")}</span></label>
      <p className="pay-consent-hint" role="alert">{t("errAcord")}</p>
    </>
  );
  // Câmpul pentru codul de reducere (fără să arate vreun cod: Daniel îl trimite fiecărui om), pus înaintea butonului de plată al primului an.
  const codeBox = (
    <div className="code-box">
      <label>{t("codeTitle")}
        <input type="text" name="cod" autoComplete="off" autoCapitalize="characters"
          spellCheck={false} maxLength={30} aria-label={t("codeLabel")} />
      </label>
      <p className="muted">{t("codeHint")}</p>
    </div>
  );
  const limitValue = (n: number | null) => (n === null ? t("unlimited") : nf.format(n));

  // Căsuța acordului la abonament: aceeași, cu fraza despre reînnoirea automată și oprirea dintr-un clic.
  const consentSub = (
    <>
      <label className="check pay-consent"><input type="checkbox" name="acord" required /> <span>{t("consent")} {ts("consentAuto")}</span></label>
      <p className="pay-consent-hint" role="alert">{t("errAcord")}</p>
    </>
  );
  const per = (p: Period) => ts(`per.${p}`);
  const running = payAccess.kind === "platit" && payAccess.until && payAccess.until > new Date() ? payAccess : null;

  const card = (x: Tier) => {
    const lim = tierLimits(x, s);
    const quote = quoteYear(x, payAccess, ownsTree, locale, s);
    const mode = tierBook(x, s);
    const paying = open && quote.ok;
    // Perioada arătată pe card: cea aleasă sus, dacă planul o are (Basic e doar anual).
    const pp: Period = subsOn && periodsFor(x, s).includes(period) ? period : "an";
    const first = periodPrice(x, pp, ownsTree, s, loyal)!;
    const renew = periodPrice(x, pp, ownsTree, s, true)!;
    const shown = money(lei ? first.lei : first.eur, locale).label;
    const renewLabel = money(lei ? renew.lei : renew.eur, locale).label;
    const saving = yearSaving(x, s, lei);
    // Prețul tăiat, spus ce e: prețul întreg (la cine are prețul de reînnoire) sau aceeași perioadă plătită lunar.
    const was = subsOn ? comparePrice(x, pp, ownsTree, s, loyal, lei) : null;
    // Abonamentul omului e chiar acesta (plan și perioadă), cu reînnoirea pornită.
    const thisSub = !!mine?.stripeSub && mine.renews && mine.tier === x && mine.period === pp;
    // Cu un an (sau o perioadă) în curs, pe același plan ori pe unul mai mic: reînnoirea pornește de la capătul ei, fără plată acum.
    const later = subsOn && !!running && tierRank(x) <= tierRank(running.tier) && !thisSub;
    const laterDate = running?.until ? (mine?.stripeSub ? nextCharge(running.until) : running.until) : null;
    return (
      <div key={x} id={`plan-${x}`} className={`plan-card${x === "familie" ? " recommended" : ""}${currentTier === x ? " current" : ""}${chosen === x ? " chosen" : ""}`}>
        {x === "familie" && <span className="plan-badge">{t("recommended")}</span>}
        <h3>{tierName(x)}</h3>
        {was && <p className="price-was"><s>{money(was.was, locale).label}</s> <span>{was.kind === "full" ? tpr("wasFull") : tpr("wasMonthly", { count: was.count, price: money(was.month, locale).label })}</span></p>}
        <p className="plan-price">{subsOn ? ts("price", { price: shown, per: per(pp) }) : t("perYear", { price: shown })}</p>
        {subsOn && pp === "an" && saving > 0 && <p className="plan-save">{ts("saveYear", { percent: saving })}</p>}
        {subsOn && pp !== period && <p className="muted plan-renew">{ts("onlyYearly")}</p>}
        {subsOn && pp === "an" && !loyal && renewLabel !== shown && <p className="muted plan-renew">{ts("renewFrom", { price: renewLabel })}</p>}
        {subsOn && pp === "an" && loyal && <p className="muted plan-renew">{ts("loyalNow")}</p>}
        <p className="muted plan-lead">{t(`tiers.${x}.lead`, { days: String(s.trialDays), price: money(lei ? s.invitePriceLei : s.invitePriceEur, locale).label, writers: String(lim.writers ?? "∞"), trees: lim.trees ?? 0 })}</p>
        <ul className="plan-limits">
          {LIMIT_KEYS.map((k) => <li key={k}><span>{t(`lim.${k}`)}</span><b>{limitValue(lim[k])}</b></li>)}
          <li><span>{t("lim.book")}</span><b>{mode === "toti" ? t("bookAll") : mode === "una" ? t("bookOne") : t("bookSeparate", { price: priceFor("carte", locale, ownsTree, s, "basic", cur).label })}</b></li>
        </ul>
        <p className="muted plan-writers">{x === "basic" ? t("writersPay") : t("writersFree")}</p>
        {currentTier === x && <p className="plan-now">{t("yourPlan")}</p>}
        {thisSub && <p className="muted">{ts("thisSub")}</p>}
        {open && !quote.ok && quote.reason === "downgrade" && payAccess.kind === "platit" && payAccess.until && !later &&
          <p className="muted">{t("noDowngrade", { date: date(payAccess.until) })}</p>}
        {paying && quote.ok && quote.upgradeFrom && quote.until &&
          <p>{t("upgrade", { plan: tierName(x), price: money(quote.value, locale).label, days: quote.daysLeft, date: date(quote.until) })}</p>}
        {paying && quote.ok && !quote.upgradeFrom && quote.until && !subsOn && <p className="muted">{t("extend", { date: date(quote.until) })}</p>}
        {open && later && laterDate && !thisSub && (
          <form action="/api/plata/start" method="post" className="form pay-form">
            <input type="hidden" name="kind" value="an" />
            <input type="hidden" name="tier" value={x} />
            <input type="hidden" name="period" value={pp} />
            <input type="hidden" name="start" value="later" />
            <p className="muted">{x === running?.tier ? ts("laterText", { date: date(laterDate), price: ts("price", { price: renewLabel, per: per(pp) }) }) : ts("laterSwitch", { plan: tierName(x), date: date(laterDate), price: ts("price", { price: renewLabel, per: per(pp) }) })}</p>
            {consentSub}
            <div className="actions"><button className={`btn${x === running?.tier ? " primary" : ""}`}>{ts("laterBtn")}</button></div>
          </form>
        )}
        {paying && quote.ok && !thisSub && !(later && !quote.upgradeFrom) && (
          <form action="/api/plata/start" method="post" className="form pay-form">
            <input type="hidden" name="kind" value="an" />
            <input type="hidden" name="tier" value={x} />
            <input type="hidden" name="period" value={pp} />
            {x === "basic" && !quote.upgradeFrom && pp === "an" && codeBox}
            {subsOn && !quote.upgradeFrom ? consentSub : consent}
            <div className="actions"><button className={`btn${x === "familie" || quote.upgradeFrom ? " primary" : ""}`}>{quote.upgradeFrom ? t("upgradeBtn", { plan: tierName(x), price: money(quote.value, locale).label })
              : subsOn ? ts("subscribeBtn", { price: shown, per: per(pp) }) : t("pay", { price: money(quote.value, locale).label })}</button></div>
            {/* Lângă plată (Daniel, 25.11.2026): planul începe azi, zilele gratuite nu se adaugă după plată (applyPayment pornește de la azi). */}
            {!running && !quote.upgradeFrom && <p className="muted pay-today">{tpr("payToday", { days: String(s.trialDays) })}</p>}
          </form>
        )}
        {paying && quote.ok && x === "basic" && !quote.upgradeFrom && !later && pp === "an" && bundle > 0 && (!subsOn || bundle > (lei ? first.lei : first.eur)) && (
          <form action="/api/plata/start" method="post" className="form pay-form plan-bundle">
            <input type="hidden" name="kind" value="an" />
            <input type="hidden" name="tier" value="basic" />
            <input type="hidden" name="period" value="an" />
            <input type="hidden" name="pachet" value="1" />
            <p><b>{t("bundleTitle")}</b> {t("bundleText", { price: money(bundle, locale).label, separate: money((subsOn ? (lei ? first.lei : first.eur) : quote.value) + (lei ? s.bookLei : s.bookEur), locale).label })}{subsOn ? ` ${ts("bundleRenew", { price: renewLabel })}` : ""}</p>
            {subsOn ? consentSub : consent}
            <div className="actions"><button className="btn">{t("pay", { price: money(bundle, locale).label })}</button></div>
          </form>
        )}
      </div>
    );
  };

  // Cardul abonamentului: perioada, următoarea plată și oprirea dintr-un clic (sau pornirea din nou).
  const subCard = mine?.stripeSub && mine.paidUntil && mine.paidUntil > new Date() ? (
    <div className="card sub-card" id="abonament">
      <h2 style={{ marginTop: 0 }}>{ts("title")}</h2>
      <p>{ts("status", { plan: mine.tier ? tierName(mine.tier) : "", period: ts(`periodsLow.${mine.period ?? "an"}`) })}</p>
      {mine.renews
        ? <p>{ts("next", { date: date(nextCharge(mine.paidUntil)), amount: mine.amount && mine.currency ? formatPaid(mine.amount, mine.currency, locale as Locale) : "" })}</p>
        : <p>{ts("off", { date: date(mine.paidUntil) })}</p>}
      <p className="muted">{mine.renews ? ts("stopHint") : ts("offHint")}</p>
      <div className="actions">
        {mine.renews ? (
          <form action="/api/plata/abonament" method="post"><input type="hidden" name="action" value="opreste" /><button className="btn">{ts("stopBtn")}</button></form>
        ) : (
          <form action="/api/plata/abonament" method="post"><input type="hidden" name="action" value="reporneste" /><button className="btn primary">{ts("resumeBtn")}</button></form>
        )}
        {mine.stripeCustomer && <form action="/api/plata/abonament" method="post"><input type="hidden" name="action" value="card" /><button className="btn">{ts("cardBtn")}</button></form>}
      </div>
    </div>
  ) : null;

  // Alegerea perioadei, deasupra planurilor (doar cu abonamentele pornite).
  const saves = TIERS.map((x) => yearSaving(x, s, lei)).filter((n) => n > 0);
  const bestSave = saves.length ? Math.max(...saves) : 0;
  // Aceeași reducere la toate planurile (anual = 20% sub lunar, Daniel 25.11.2026): „economisești 20%”, nu „până la”.
  const saveTag = saves.length && Math.min(...saves) === bestSave ? tpr("save", { percent: bestSave }) : ts("saveUpTo", { percent: bestSave });
  const periodTabs = subsOn && TIERS.some((x) => periodsFor(x, s).length > 1) ? (
    <nav className="period-tabs" aria-label={ts("periodLabel")}>
      {(["luna", "trimestru", "an"] as const).map((p) => (
        <Link key={p} href={p === "an" ? "/plata#planuri" : `/plata?perioada=${p}#planuri`} aria-current={p === period ? "page" : undefined} scroll={false}>
          {ts(`periods.${p}`)}{p === "an" && bestSave > 0 && <span className="save">{saveTag}</span>}
        </Link>
      ))}
    </nav>
  ) : null;

  const giftCard = open && (
    <div className="card" id="cadou">
      <h2 style={{ marginTop: 0 }}>{t("giftTitle")}</h2>
      <p className="muted">{t("giftText")}</p>
      <form action="/api/plata/start" method="post" className="form pay-form">
        <input type="hidden" name="kind" value="cadou" />
        <label>{t("giftPlan")}
          <select name="tier" defaultValue={dar ?? "familie"}>
            {TIERS.map((x) => <option key={x} value={x}>{tierName(x)} · {t("perYear", { price: money(lei ? tierPrice(x, true, s).lei : tierPrice(x, true, s).eur, locale).label })}</option>)}
          </select>
        </label>
        <label>{t("giftFor")}<input name="forName" maxLength={120} placeholder={t("giftForHint")} /></label>
        <label>{t("giftNote")}<textarea name="note" maxLength={400} rows={3} placeholder={t("giftNoteHint")} /></label>
        {consent}
        <div className="actions"><button className="btn">{t("giftPay")}</button></div>
      </form>
      {gifts.length > 0 && (
        <>
          <h3>{t("giftsTitle")}</h3>
          <ul className="gift-list">
            {gifts.map((g) => (
              <li key={g.id}>
                {tierName(g.tier as Tier)}{g.forName ? ` · ${g.forName}` : ""}: {g.redeemedAt
                  ? <span className="muted">{t("giftRedeemed", { date: date(g.redeemedAt) })}</span>
                  : <><code>{`${origin}/cadou/${g.id}`}</code> <span className="muted">{t("giftSend")}</span> <Link href={`/cadou/${g.id}/card`}>{tg("printCard")}</Link></>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <section className="stack plata">
      <ConsentGuard />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("title")}</h1>
        {offerLine && <p role="status" className="pay-ok"><b>{offerLine}</b></p>}
        {!offerLine && linkCode && <p role="status" className="pay-ok">{t("linkCode")}</p>}
        {notice && <p role="status" className={err ? "err" : "pay-ok"}>{notice}{str("gata") === "pastrare" && <> <Link href="/arhiva">{tk("archiveLink")}</Link></>}{err === "curand" && <> <Link href="/contact">{t("contact")}</Link></>}</p>}
        <h2>{subsOn ? ts("pageTitle") : t("yearTitle")}</h2>
        <p>{isKept(payAccess) && payAccess.kind === "expirat" && payAccess.keptUntil ? tk("keptUntil", { date: date(payAccess.keptUntil) }) : status}</p>
        <p className="muted">{subsOn ? ts("yearText") : t("yearText")}</p>
      </div>

      {subCard}

      {dar && giftCard}

      <div id="planuri" className="stack" style={{ gap: 10 }}>
        {periodTabs}
        <div className="plan-cards">{TIERS.map(card)}</div>
      </div>
      <p className="muted plan-book-note">{t("bookNote", { price: priceFor("carte", locale, ownsTree, s, "basic", cur).label })}</p>
      <p className="muted plan-book-note">{t("discountNote")}</p>

      {showKeep && (
        <div className="card" id="pastrare">
          <h2 style={{ marginTop: 0 }}>{tk("title")}</h2>
          <p>{tk("text", { price: money(keepPrice, locale).label })}</p>
          <p className="muted">{arch ? tk("freeArch", { years: arch.freeYears }) : tk("free")}</p>
          {isKept(payAccess) && payAccess.kind === "expirat" && payAccess.keptUntil && <p className="muted">{tk("extend", { date: date(payAccess.keptUntil) })}</p>}
          {open && (
            <form action="/api/plata/start" method="post" className="form pay-form">
              <input type="hidden" name="kind" value="pastrare" />
              {consent}
              <div className="actions"><button className="btn primary">{t("pay", { price: money(keepPrice, locale).label })}</button></div>
            </form>
          )}
          {open && myTrees.length > 0 && (
            <form action="/api/plata/start" method="post" className="form pay-form plan-bundle">
              <input type="hidden" name="kind" value="pastrare" />
              <input type="hidden" name="pachet" value="1" />
              <p><b>{tk("bundleTitle")}</b> {tk("bundleText", { price: money(keepBook, locale).label, separate: money(keepPrice + (lei ? s.bookLei : s.bookEur), locale).label })}</p>
              <label>{tk("bundleTree")}
                <select name="treeId" defaultValue={myTrees[0].id}>
                  {myTrees.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              {consent}
              <div className="actions"><button className="btn">{t("pay", { price: money(keepBook, locale).label })}</button></div>
            </form>
          )}
          <p className="muted" style={{ marginBottom: 0 }}><Link href="/arhiva">{tk("archiveLink")}</Link></p>
        </div>
      )}

      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          {t("trialLimits", { days: String(s.trialDays), persons: tl.persons ?? 0, photos: tl.photos ?? 0, audio: tl.audio ?? 0, docs: tl.docs ?? 0 })}
          {" "}{t("visitors")} {t("afterEnd")} {subsOn ? ts("autoNote", { days: REMIND }) : t("noAuto")}
        </p>
      </div>

      {!dar && giftCard}

      {book && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t("bookTitle")}</h2>
          {book.free ? <p>{t("bookFree")}</p> : book.paid ? <p>{t("bookPaid")}</p> : book.included ? <p>{t("bookIncludedAll")}</p> : <p className="muted">{t("bookText", { tree: book.name })}</p>}
          {arch && <p className="muted">{tn("bookSeal", { years: arch.sealYears })}</p>}
          {!book.free && !book.paid && !book.included && book.canClaim && (
            <form action="/api/plata/start" method="post" className="form pay-form">
              <input type="hidden" name="kind" value="carte" />
              <input type="hidden" name="inclus" value="1" />
              <input type="hidden" name="treeId" value={book.id} />
              <p>{t("bookIncludedText", { tree: book.name })}</p>
              <div className="actions"><button className="btn primary">{t("bookIncludedBtn")}</button></div>
            </form>
          )}
          {!book.free && !book.paid && !book.included && !book.canClaim && open && (
            <form action="/api/plata/start" method="post" className="form pay-form">
              <input type="hidden" name="kind" value="carte" />
              <input type="hidden" name="treeId" value={book.id} />
              {consent}
              <div className="actions"><button className="btn primary">{t("pay", { price: priceFor("carte", locale, ownsTree, s, "basic", cur).label })}</button></div>
            </form>
          )}
          <div className="actions"><Link className="btn" href={`/arbore/${book.id}/carte`}>{t("backToBook")}</Link></div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 14 }}>
        {t("secure")} {t("seller", { name: op.name, cui: op.cui, address: op.address, email: op.email, phone: contactPhone() })} <Link href="/termeni">{t("terms")}</Link>
      </p>
    </section>
  );
}

import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser, roleInTree } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { operator } from "@/lib/legal";
import { bookIncluded, bookPaid, includedBooksLeft, money, priceFor, quoteYear } from "@/lib/plati";
import { testAccess, userAccess } from "@/lib/plata";
import { LIMIT_KEYS, TIERS, isKept, mayKeep, tierBook, tierLimits, tierPrint, tierPrice, trialLimits, type Access, type Tier } from "@/lib/plans";
import { getLocale, getT } from "@/i18n/server";
import { giftsBy } from "@/lib/extra";
import { siteOrigin } from "@/lib/site";
import { contactPhone } from "@/lib/contact";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("Plata"))("title"), robots: { index: false } };
}

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Plata: cele trei planuri pe un an (Basic, Familie, Premium) și, cu `?carte=<arbore>`, cartea PDF a acelui arbore.
 * Omul bifează că accesul începe imediat (fără cele 14 zile de retragere), apoi plătește pe pagina Stripe. Cât timp vânzarea
 * e oprită din Admin, doar adminul vede butoanele (ca să încerce plata); ceilalți află că nu trebuie să plătească nimic.
 * Prețurile și plafoanele vin din Admin → Manager control.
 */
export default async function PlataPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireUser("/plata");
  const q = await searchParams;
  const str = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  const [t, tk, locale] = await Promise.all([getT("Plata"), getT("Keep"), getLocale()]);
  const { access, settings: s, ownsTree } = await userAccess(db, me.id);
  const admin = isAdminUser(me);
  const open = s.on || admin;
  // Cât timp vânzarea e oprită, adminul face plăți de probă ca un om obișnuit: îi arătăm anul lui de probă, dacă l-a plătit.
  const payAccess: Access = s.on ? access : admin ? await testAccess(db, me.id) : access;
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(d);
  const nf = new Intl.NumberFormat(locale);
  const op = operator();
  const lei = locale === "ro";
  const tierName = (x: Tier) => t(`tiers.${x}.name`);

  const treeId = UUID.test(str("carte")) ? str("carte") : null;
  const bookTree = treeId && (await roleInTree(db, treeId, me.id))
    ? (await db.select({ id: tree.id, name: tree.name, ownerId: tree.ownerId }).from(tree).where(eq(tree.id, treeId)))[0] ?? null : null;
  const book = bookTree ? {
    ...bookTree,
    paid: await bookPaid(db, me.id, bookTree.id),
    included: bookIncluded(payAccess, s, bookTree.ownerId === me.id),
    canClaim: (await includedBooksLeft(db, me.id, payAccess, s)) === 1,
  } : null;

  const err = str("eroare");
  const notice = str("gata") === "pastrare" ? tk("thanks") : str("gata") === "inclus" ? t("thanksIncluded") : str("gata") === "cadou" ? t("thanksGift") : str("gata") ? t("thanks") : str("renuntat") ? t("cancelled")
    : err === "acord" ? t("errAcord") : err === "curand" ? t("errSoon") : err === "jos" ? t("errDown") : err ? t("err") : null;

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

  const consent = <label className="check"><input type="checkbox" name="acord" required /> {t("consent")}</label>;
  const limitValue = (n: number | null) => (n === null ? t("unlimited") : nf.format(n));

  const card = (x: Tier) => {
    const lim = tierLimits(x, s);
    const p = tierPrice(x, ownsTree, s);
    const full = money(lei ? p.lei : p.eur, locale).label;
    const quote = quoteYear(x, payAccess, ownsTree, locale, s);
    const mode = tierBook(x, s), pct = tierPrint(x, s);
    const paying = open && quote.ok;
    return (
      <div key={x} className={`plan-card${x === "familie" ? " recommended" : ""}${currentTier === x ? " current" : ""}`}>
        {x === "familie" && <span className="plan-badge">{t("recommended")}</span>}
        <h3>{tierName(x)}</h3>
        <p className="plan-price">{t("perYear", { price: full })}</p>
        <p className="muted plan-lead">{t(`tiers.${x}.lead`)}</p>
        <ul className="plan-limits">
          {LIMIT_KEYS.map((k) => <li key={k}><span>{t(`lim.${k}`)}</span><b>{limitValue(lim[k])}</b></li>)}
          <li><span>{t("lim.book")}</span><b>{mode === "toti" ? t("bookAll") : mode === "una" ? t("bookOne") : t("bookSeparate", { price: priceFor("carte", locale, ownsTree, s).label })}</b></li>
          <li><span>{t("lim.print")}</span><b>{pct > 0 ? t("printOff", { pct: String(pct) }) : t("printFull")}</b></li>
        </ul>
        <p className="muted plan-writers">{x === "basic" ? t("writersPay") : t("writersFree")}</p>
        {currentTier === x && <p className="plan-now">{t("yourPlan")}</p>}
        {open && !quote.ok && quote.reason === "downgrade" && payAccess.kind === "platit" && payAccess.until &&
          <p className="muted">{t("noDowngrade", { date: date(payAccess.until) })}</p>}
        {paying && quote.ok && quote.upgradeFrom && quote.until &&
          <p>{t("upgrade", { plan: tierName(x), price: money(quote.value, locale).label, days: quote.daysLeft, date: date(quote.until) })}</p>}
        {paying && quote.ok && !quote.upgradeFrom && quote.until && <p className="muted">{t("extend", { date: date(quote.until) })}</p>}
        {paying && (
          <form action="/api/plata/start" method="post" className="form pay-form">
            <input type="hidden" name="kind" value="an" />
            <input type="hidden" name="tier" value={x} />
            {consent}
            <div className="actions"><button className={`btn${x === "familie" ? " primary" : ""}`}>{t("pay", { price: money(quote.value, locale).label })}</button></div>
          </form>
        )}
        {paying && quote.ok && x === "basic" && !quote.upgradeFrom && bundle > 0 && (
          <form action="/api/plata/start" method="post" className="form pay-form plan-bundle">
            <input type="hidden" name="kind" value="an" />
            <input type="hidden" name="tier" value="basic" />
            <input type="hidden" name="pachet" value="1" />
            <p><b>{t("bundleTitle")}</b> {t("bundleText", { price: money(bundle, locale).label, separate: money(quote.value + (lei ? s.bookLei : s.bookEur), locale).label })}</p>
            {consent}
            <div className="actions"><button className="btn">{t("pay", { price: money(bundle, locale).label })}</button></div>
          </form>
        )}
      </div>
    );
  };

  return (
    <section className="stack plata">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("title")}</h1>
        {notice && <p role="status" className={err ? "err" : "pay-ok"}>{notice}{str("gata") === "pastrare" && <> <Link href="/arhiva">{tk("archiveLink")}</Link></>}{err === "curand" && <> <Link href="/contact">{t("contact")}</Link></>}</p>}
        <h2>{t("yearTitle")}</h2>
        <p>{isKept(payAccess) && payAccess.kind === "expirat" && payAccess.keptUntil ? tk("keptUntil", { date: date(payAccess.keptUntil) }) : status}</p>
        <p className="muted">{t("yearText")}</p>
      </div>

      <div className="plan-cards">{TIERS.map(card)}</div>

      {showKeep && (
        <div className="card" id="pastrare">
          <h2 style={{ marginTop: 0 }}>{tk("title")}</h2>
          <p>{tk("text", { price: money(keepPrice, locale).label })}</p>
          <p className="muted">{tk("free")}</p>
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
          {" "}{t("visitors")} {t("afterEnd")} {t("noAuto")}
        </p>
      </div>

      {open && (
        <div className="card" id="cadou">
          <h2 style={{ marginTop: 0 }}>{t("giftTitle")}</h2>
          <p className="muted">{t("giftText")}</p>
          <form action="/api/plata/start" method="post" className="form pay-form">
            <input type="hidden" name="kind" value="cadou" />
            <label>{t("giftPlan")}
              <select name="tier" defaultValue="familie">
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
                      : <><code>{`${origin}/cadou/${g.id}`}</code> <span className="muted">{t("giftSend")}</span></>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {book && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t("bookTitle")}</h2>
          {book.paid ? <p>{t("bookPaid")}</p> : book.included ? <p>{t("bookIncludedAll")}</p> : <p className="muted">{t("bookText", { tree: book.name })}</p>}
          {!book.paid && !book.included && book.canClaim && (
            <form action="/api/plata/start" method="post" className="form pay-form">
              <input type="hidden" name="kind" value="carte" />
              <input type="hidden" name="inclus" value="1" />
              <input type="hidden" name="treeId" value={book.id} />
              <p>{t("bookIncludedText", { tree: book.name })}</p>
              <div className="actions"><button className="btn primary">{t("bookIncludedBtn")}</button></div>
            </form>
          )}
          {!book.paid && !book.included && !book.canClaim && open && (
            <form action="/api/plata/start" method="post" className="form pay-form">
              <input type="hidden" name="kind" value="carte" />
              <input type="hidden" name="treeId" value={book.id} />
              {consent}
              <div className="actions"><button className="btn primary">{t("pay", { price: priceFor("carte", locale, ownsTree, s).label })}</button></div>
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

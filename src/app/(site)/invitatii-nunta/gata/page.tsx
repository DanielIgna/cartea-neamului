import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { isLocale, type Locale } from "@/i18n/locales";
import { getLocale } from "@/i18n/server";
import { SHOP_PATH, fill, modelText, shopText } from "@/lib/invitatii-nunta";
import { modelBySlug } from "@/lib/invitatii-nunta-produse";
import { downloadToken, downloadUrl, fetchShopSession, fulfilShopOrder, orderBySession, MAX_EMAILS } from "@/lib/invitatii-nunta-server";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: shopText(await getLocale()).doneMetaTitle, robots: PRIVATE_ROBOTS };
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

/**
 * După plată (Stripe trimite aici cu ?session_id=…): linkul de descărcare, valabil 30 de zile, și „Retrimite emailul”. Dacă
 * confirmarea de la Stripe (webhook) n-a ajuns încă, sesiunea se citește direct din Stripe și comanda se trece de aici, o singură dată.
 */
export default async function ShopDonePage({ searchParams }: Props) {
  const q = await searchParams;
  const id = q.session_id ?? "";
  const cookieLocale = await getLocale();
  const valid = /^cs_[A-Za-z0-9_]{10,200}$/.test(id);
  let order = valid ? await orderBySession(db, id).catch(() => null) : null;
  let pending = false;
  if (valid && !order) {
    const paid = await fetchShopSession(id).catch(() => null);
    if (paid) order = (await fulfilShopOrder(db, paid, await siteOrigin())).order;
    else pending = true;
  }
  const locale: Locale = order && isLocale(order.locale) ? order.locale : cookieLocale;
  const t = shopText(locale);
  if (!order) {
    return (
      <section className="stack shop" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>{t.doneMetaTitle}</h1>
          <p>{pending ? t.pending : t.notFound}</p>
          <p style={{ marginBottom: 0 }}><Link href={pending ? `/invitatii-nunta/gata?session_id=${encodeURIComponent(id)}` : "/contact"}>{pending ? "↻" : "→"}</Link> <Link href={SHOP_PATH}>{t.label}</Link></p>
        </div>
      </section>
    );
  }
  const model = await modelBySlug(db, order.slug).catch(() => null);
  const tm = model ? modelText(model, locale) ?? modelText(model, "ro") : null;
  const expired = order.expiresAt.getTime() <= Date.now();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(order.expiresAt);
  const href = downloadUrl(await siteOrigin(), downloadToken(order.id));
  const sent = q.trimis === "ok" ? t.resent : q.trimis === "limit" ? t.resendLimit : q.trimis === "expired" ? t.expired : q.trimis ? t.errStart : null;
  return (
    <section className="stack shop" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="card shop-done">
        <div className="section-label" style={{ marginTop: 0 }}>{tm?.title ?? t.label}</div>
        <h1>{t.doneTitle}</h1>
        {expired ? <p>{t.expired} <Link href="/contact">→</Link></p> : (
          <>
            <p>{fill(t.doneLead, { email: order.email })}</p>
            <p><a className="btn primary" href={href} rel="nofollow">{t.download}</a></p>
            <p className="muted">{fill(t.validUntil, { date })}</p>
            <p className="muted">{t.mailHelp}</p>
            {sent && <p role="status">{sent}</p>}
            {order.emailsSent < MAX_EMAILS && (
              <form method="post" action="/api/invitatii-nunta/retrimite">
                <input type="hidden" name="session_id" value={order.id} />
                <button type="submit" className="btn">{t.resend}</button>
              </form>
            )}
          </>
        )}
        <p className="shop-blessing">{t.blessing}</p>
      </div>
    </section>
  );
}

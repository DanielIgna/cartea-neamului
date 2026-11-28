import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { isLocale, type Locale } from "@/i18n/locales";
import { getLocale } from "@/i18n/server";
import { CategoryHub, CategoryProductPage, doneLead } from "@/components/MagazinDigital";
import { SHOP_CATEGORIES, doneSlugPath, fill, modelText, type ShopCategory } from "@/lib/invitatii-nunta";
import { categoryText } from "@/lib/magazin-texte";
import { modelBySlug, publishedModel, publishedModels, sameRegion } from "@/lib/invitatii-nunta-produse";
import { MAX_EMAILS, downloadToken, downloadUrl, fetchShopSession, fulfilShopOrder, orderBySession, shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/**
 * Paginile categoriilor noi (accesorii nuntă, jurnale de familie), citite din bază, pentru rutele din app/(site) și
 * app/(public)/pub/[v]: lista, pagina produsului și pagina de după plată. Aceleași reguli ca la invitații.
 */
type NewCategory = Exclude<ShopCategory, "invitatie">;

export async function CategoryHubPage({ category }: { category: NewCategory }) {
  const [open, models] = await Promise.all([shopOpen(db, category), publishedModels(db, category)]);
  return <CategoryHub category={category} locale={await getLocale()} open={open} models={models} />;
}

/** Un produs publicat; ciornă, retras, arhivat sau slug necunoscut: 404. */
export async function CategoryProduct({ category, slug, error }: { category: NewCategory; slug: string; error?: string | null }) {
  const model = await publishedModel(db, slug, category);
  if (!model) notFound();
  const invitation = category === "accesorii" ? await sameRegion(db, model, "invitatie").catch(() => null) : null;
  return <CategoryProductPage category={category} model={model} locale={await getLocale()} open={await shopOpen(db, category)} payReady={shopPaymentsReady()} error={error ?? null} invitation={invitation} />;
}

/**
 * După plată (Stripe trimite aici cu ?session_id=…): linkul de descărcare, valabil 30 de zile, și „Retrimite emailul”. Dacă
 * webhook-ul n-a ajuns încă, sesiunea se citește din Stripe și comanda se trece de aici, o singură dată. O comandă din altă
 * categorie nu se arată aici.
 */
export async function CategoryDone({ category, q }: { category: NewCategory; q: Record<string, string | undefined> }) {
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
  if (order && order.category !== category) order = null;
  const locale: Locale = order && isLocale(order.locale) ? order.locale : cookieLocale;
  const t = categoryText(category, locale);
  const path = SHOP_CATEGORIES[category].path;
  if (!order) {
    return (
      <section className="stack shop" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>{t.doneMetaTitle}</h1>
          <p>{pending ? t.pending : t.notFound}</p>
          <p style={{ marginBottom: 0 }}><Link href={pending ? `${doneSlugPath(category)}?session_id=${encodeURIComponent(id)}` : "/contact"}>{pending ? "↻" : "→"}</Link> <Link href={path}>{t.label}</Link></p>
        </div>
      </section>
    );
  }
  const model = await modelBySlug(db, order.slug, { category }).catch(() => null);
  const tm = model ? modelText(model, locale) ?? modelText(model, "ro") : null;
  const expired = order.expiresAt.getTime() <= Date.now();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(order.expiresAt);
  const href = downloadUrl(await siteOrigin(), downloadToken(order.id), category);
  const sent = q.trimis === "ok" ? t.resent : q.trimis === "limit" ? t.resendLimit : q.trimis === "expired" ? t.expired : q.trimis ? t.errStart : null;
  return (
    <section className="stack shop" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="card shop-done">
        <div className="section-label" style={{ marginTop: 0 }}>{tm?.title ?? t.label}</div>
        <h1>{t.doneTitle}</h1>
        {expired ? <p>{t.expired} <Link href="/contact">→</Link></p> : (
          <>
            <p>{doneLead(t, order)}</p>
            <p><a className="btn primary" href={href} rel="nofollow">{t.download}</a></p>
            <p className="muted">{fill(t.validUntil, { date })}</p>
            <p className="muted">{t.mailHelp}</p>
            {sent && <p role="status">{sent}</p>}
            {order.emailsSent < MAX_EMAILS && (
              <form method="post" action="/api/magazin/retrimite">
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

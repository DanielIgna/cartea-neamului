import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { localizedPath, type Locale } from "@/i18n/locales";
import { SHOP_MODELS, SHOP_PATH, fill, modelPath, modelText, shopPrice, shopText, type ShopModel } from "@/lib/invitatii-nunta";
import { HOME_LABEL, canonicalUrl } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";

/**
 * Paginile publice ale rubricii „Invitații de nuntă”: lista modelelor și pagina unui model, cu pozele de prezentare (cu semnul
 * „MODEL”, în /public), ce primește clientul, prețul din catalog și butonul de cumpărare (fără cont). Aceleași pentru vizitatori
 * (variantele gata făcute din /pub) și pentru cine e în cont; doar mesajul de eroare vine din adresă, la pagina făcută pe loc.
 */

const homeLabel = (l: Locale) => HOME_LABEL[l];
const own = (path: string, l: Locale) => canonicalUrl(localizedPath(path, l));

function crumbsLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: homeLabel(locale), path: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: own(it.path, locale) })),
  };
}

function productLd(m: ShopModel, locale: Locale) {
  const tm = modelText(m, locale);
  const p = shopPrice(m, locale);
  return {
    "@type": "Product",
    "@id": `${own(modelPath(m), locale)}#product`,
    name: tm.title,
    description: tm.metaDescription,
    image: m.images.map((i) => `${SITE_URL}${i.src}`),
    sku: `invitatie-nunta-${m.slug}`,
    category: "Wedding invitations",
    brand: { "@type": "Brand", name: "Cartea Neamului" },
    offers: {
      "@type": "Offer", url: own(modelPath(m), locale), price: p.value.toFixed(2), priceCurrency: p.currency.toUpperCase(),
      availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
    },
  };
}

/** Lista modelelor (/invitatii-nunta). */
export function ShopHub({ locale, open }: { locale: Locale; open: boolean }) {
  const t = shopText(locale);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${own(SHOP_PATH, locale)}#page`, url: own(SHOP_PATH, locale), name: t.hubMetaTitle, description: t.hubMetaDescription, inLanguage: locale,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL } },
      crumbsLd(locale, [{ name: t.label, path: SHOP_PATH }]),
      { "@type": "ItemList", itemListElement: SHOP_MODELS.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: own(modelPath(m), locale), name: modelText(m, locale).title })) },
      ...SHOP_MODELS.map((m) => productLd(m, locale)),
    ],
  };
  return (
    <section className="stack shop" style={{ maxWidth: 960, margin: "0 auto" }}>
      {open && <JsonLd data={ld} />}
      <nav aria-label="breadcrumb" className="crumbs"><Link href="/">{homeLabel(locale)}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{t.label}</span></nav>
      <div className="card shop-hero">
        <div className="section-label" style={{ marginTop: 0 }}>{t.label}</div>
        <h1>{t.hubTitle}</h1>
        <p className="shop-lead">{t.hubLead}</p>
      </div>
      {!open ? <div className="card"><p style={{ margin: 0 }}>{t.closed}</p></div> : (
        <>
          <ul className="shop-grid">
            {SHOP_MODELS.map((m) => {
              const tm = modelText(m, locale);
              const img = m.images.find((i) => i.kind === "mockup") ?? m.images[0];
              return (
                <li key={m.slug} className="card shop-item">
                  <Link href={modelPath(m)} className="shop-item-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} width={img.width} height={img.height} alt={fill(t.imgMockup, { name: tm.name })} loading="lazy" decoding="async" />
                  </Link>
                  <h2><Link href={modelPath(m)}>{tm.title}</Link></h2>
                  <p className="muted">{tm.tagline}</p>
                  <p className="shop-price"><b>{shopPrice(m, locale).label}</b></p>
                  <Link className="btn primary" href={modelPath(m)}>{t.seeModel}</Link>
                </li>
              );
            })}
          </ul>
          <div className="card"><p className="muted" style={{ margin: 0 }}>{t.moreSoon}</p></div>
          <Details locale={locale} />
        </>
      )}
    </section>
  );
}

/** Ce primești, pașii și licența: aceleași pe listă și pe pagina modelului. */
function Details({ locale }: { locale: Locale }) {
  const t = shopText(locale);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.getTitle}</h2>
        <ul className="shop-gets">{[t.get1, t.get2, t.get3, t.get4].map((g) => <li key={g}>{g}</li>)}</ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.stepsTitle}</h2>
        <ol className="shop-steps">{[t.step1, t.step2, t.step3].map((s) => <li key={s}>{s}</li>)}</ol>
        <h3>{t.licenseTitle}</h3>
        <p className="muted" style={{ marginBottom: 0 }}>{t.license}</p>
      </div>
    </>
  );
}

/** Pagina unui model (/invitatii-nunta/<slug>), cu formularul de cumpărare. */
export function ShopModelPage({ model, locale, open, payReady, error }: { model: ShopModel; locale: Locale; open: boolean; payReady: boolean; error?: string | null }) {
  const t = shopText(locale);
  const tm = modelText(model, locale);
  const price = shopPrice(model, locale);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${own(modelPath(model), locale)}#page`, url: own(modelPath(model), locale), name: tm.metaTitle, description: tm.metaDescription, inLanguage: locale,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL }, mainEntity: { "@id": `${own(modelPath(model), locale)}#product` } },
      crumbsLd(locale, [{ name: t.label, path: SHOP_PATH }, { name: tm.name, path: modelPath(model) }]),
      productLd(model, locale),
    ],
  };
  const alt = (k: ShopModel["images"][number]["kind"]) => (k === "mockup" ? fill(t.imgMockup, { name: tm.name }) : k === "crem" ? `${tm.name}: ${t.imgCrem}` : `${tm.name}: ${t.imgDark}`);
  const [hero, ...cards] = model.images;
  const err = error === "acord" ? t.errConsent : error === "oprit" ? t.paused : error ? t.errStart : null;
  return (
    <section className="stack shop" style={{ maxWidth: 960, margin: "0 auto" }}>
      {open && <JsonLd data={ld} />}
      <nav aria-label="breadcrumb" className="crumbs">
        <Link href="/">{homeLabel(locale)}</Link> <span aria-hidden="true">›</span> <Link href={SHOP_PATH}>{t.label}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{tm.name}</span>
      </nav>
      {!open ? <div className="card"><h1 style={{ marginTop: 0 }}>{tm.title}</h1><p style={{ margin: 0 }}>{t.closed}</p></div> : (
        <>
          <div className="card shop-model">
            <figure className="shop-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.src} width={hero.width} height={hero.height} alt={alt(hero.kind)} fetchPriority="high" decoding="async" />
            </figure>
            <div className="shop-buy" id="cumpara">
              <div className="section-label" style={{ marginTop: 0 }}>{t.label}</div>
              <h1>{tm.title}</h1>
              <p className="shop-lead">{tm.tagline}</p>
              <p className="shop-price"><span className="muted">{t.priceLabel}:</span> <b>{price.label}</b></p>
              {err && <p className="err" role="alert">{err}</p>}
              {payReady ? (
                <form method="post" action="/api/invitatii-nunta/start" className="shop-form">
                  <input type="hidden" name="slug" value={model.slug} />
                  <input type="hidden" name="locale" value={locale} />
                  <label className="check pay-consent"><input type="checkbox" name="acord" required /> <span>{t.consent}</span></label>
                  <button type="submit" className="btn primary">{t.buy}</button>
                  <p className="muted shop-note">{t.payNote}</p>
                </form>
              ) : <p className="muted">{t.paused} <Link href="/contact">→</Link></p>}
            </div>
          </div>
          <div className="card">
            <p>{tm.description}</p>
            <div className="shop-cards">
              {cards.map((c) => (
                <figure key={c.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} width={c.width} height={c.height} alt={alt(c.kind)} loading="lazy" decoding="async" />
                  <figcaption className="muted">{c.kind === "crem" ? t.imgCrem : t.imgDark}</figcaption>
                </figure>
              ))}
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>{t.previewNote}</p>
          </div>
          <Details locale={locale} />
          <p className="shop-blessing">{t.blessing}</p>
        </>
      )}
    </section>
  );
}

import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PozeMari from "@/components/PozeMari";
import { zoomText } from "@/lib/poze-mari-texte";
import { localizedPath, type Locale } from "@/i18n/locales";
import { SHOP_CATEGORIES, fill, modelPath, modelText, shopPrice, type ShopCategory, type ShopModel } from "@/lib/invitatii-nunta";
import { categoryText } from "@/lib/magazin-texte";
import { HOME_LABEL, canonicalUrl } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";

/**
 * Paginile publice ale categoriilor noi din magazin (Daniel, 28.11.2026): „Accesorii nuntă” (/accesorii-nunta, un set pe
 * regiune) și „Jurnale de familie” (/jurnale). La fel ca la invitații: lista, pagina produsului cu pozele (semnul „MODEL”), ce
 * conține, prețul și cumpărarea fără cont (aceeași plată Stripe, același email și aceeași descărcare). În plus, blocul
 * „Completează setul”: pe pagina invitației, setul de accesorii din aceeași regiune; pe pagina setului, invitația potrivită.
 */
type NewCategory = Exclude<ShopCategory, "invitatie">;

const own = (path: string, l: Locale) => canonicalUrl(localizedPath(path, l));
const textOf = (m: ShopModel, locale: Locale) => modelText(m, locale) ?? modelText(m, "ro")!;

function crumbsLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: HOME_LABEL[locale], path: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: own(it.path, locale) })),
  };
}

/** Schema Product (Google): numele, descrierea, pozele, prețul din bază în moneda paginii. */
export function categoryProductLd(m: ShopModel, locale: Locale) {
  const tm = textOf(m, locale);
  const p = shopPrice(m, locale);
  const cat = SHOP_CATEGORIES[m.category ?? "invitatie"];
  return {
    "@type": "Product",
    "@id": `${own(modelPath(m), locale)}#product`,
    name: tm.title,
    description: tm.metaDescription,
    image: m.images.map((i) => `${SITE_URL}${i.src}`),
    sku: `${cat.kind}-${m.slug}`,
    category: cat.schemaCategory,
    brand: { "@type": "Brand", name: "Cartea Neamului" },
    offers: {
      "@type": "Offer", url: own(modelPath(m), locale), price: p.value.toFixed(2), priceCurrency: p.currency.toUpperCase(),
      availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
    },
  };
}

/** Limbile fișierelor, scrise în limba paginii. */
function langNames(codes: string[], locale: Locale) {
  let dn: Intl.DisplayNames | null = null;
  try { dn = new Intl.DisplayNames([locale], { type: "language" }); } catch { /* browser vechi */ }
  return codes.map((c) => dn?.of(c) ?? c).join(", ");
}

/** Ce conține produsul, scris în limba paginii („meniu, carduri de loc…”). */
export function partNames(category: NewCategory, parts: string[] | undefined, locale: Locale) {
  const t = categoryText(category, locale);
  return (parts ?? []).map((p) => t.parts[p]).filter(Boolean);
}

function Card({ m, locale, cta }: { m: ShopModel; locale: Locale; cta: string }) {
  const tm = textOf(m, locale);
  const img = m.images[0];
  return (
    <li className="card shop-item">
      {img && (
        <Link href={modelPath(m)} className="shop-item-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} width={img.width} height={img.height} alt={tm.title} loading="lazy" decoding="async" />
        </Link>
      )}
      <h2><Link href={modelPath(m)}>{tm.title}</Link></h2>
      <p className="muted">{tm.tagline}</p>
      <p className="shop-price"><b>{shopPrice(m, locale).label}</b></p>
      <Link className="btn primary" href={modelPath(m)}>{cta}</Link>
    </li>
  );
}

/** Lista unei categorii (/accesorii-nunta, /jurnale). */
export function CategoryHub({ category, locale, open, models }: { category: NewCategory; locale: Locale; open: boolean; models: ShopModel[] }) {
  const t = categoryText(category, locale);
  const path = SHOP_CATEGORIES[category].path;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${own(path, locale)}#page`, url: own(path, locale), name: t.hubMetaTitle, description: t.hubMetaDescription, inLanguage: locale,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL } },
      crumbsLd(locale, [{ name: t.label, path }]),
      { "@type": "ItemList", itemListElement: models.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: own(modelPath(m), locale), name: textOf(m, locale).title })) },
      ...models.map((m) => categoryProductLd(m, locale)),
    ],
  };
  return (
    <section className="stack shop" style={{ maxWidth: 960, margin: "0 auto" }}>
      {open && <JsonLd data={ld} />}
      <nav aria-label="breadcrumb" className="crumbs"><Link href="/">{HOME_LABEL[locale]}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{t.label}</span></nav>
      <div className="card shop-hero">
        <div className="section-label" style={{ marginTop: 0 }}>{t.label}</div>
        <h1>{t.hubTitle}</h1>
        <p className="shop-lead">{t.hubLead}</p>
      </div>
      {!open ? <div className="card"><p style={{ margin: 0 }}>{t.closed}</p></div> : (
        <>
          {models.length > 0 && <ul className="shop-grid">{models.map((m) => <Card key={m.slug} m={m} locale={locale} cta={t.seeModel} />)}</ul>}
          <div className="card"><p className="muted" style={{ margin: 0 }}>{t.moreSoon}</p></div>
          <Details category={category} locale={locale} />
        </>
      )}
    </section>
  );
}

function Details({ category, locale, model }: { category: NewCategory; locale: Locale; model?: ShopModel }) {
  const t = categoryText(category, locale);
  const formats = SHOP_CATEGORIES[category].formats;
  const tm = model ? textOf(model, locale) : null;
  const colors = tm?.colors?.split(";").map((c) => c.trim()).filter(Boolean) ?? [];
  const parts = model ? partNames(category, model.parts, locale) : [];
  const items = [
    t.get1,
    parts.length ? `${t.partsLabel}: ${parts.join(", ")}.` : null,
    model?.languages.length ? `${t.langsLabel}: ${langNames(model.languages, locale)}.` : null,
    model?.formats.length ? `${t.formatsLabel}: ${model.formats.map((f) => formats[f] ?? f).join(", ")}.` : null,
    colors.length ? `${t.colorsLabel}: ${colors.join("; ")}.` : null,
    category === "accesorii" ? t.get4 : null,
  ].filter((x): x is string => !!x);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t.getTitle}</h2>
        <ul className="shop-gets">{items.map((g) => <li key={g}>{g}</li>)}</ul>
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

/** Un card mic spre alt produs din același set (accesoriile, pe pagina invitației; invitația, pe pagina accesoriilor). */
function SetLink({ m, locale, title, lead, cta }: { m: ShopModel; locale: Locale; title: string; lead: string; cta: string }) {
  const tm = textOf(m, locale);
  const img = m.images[0];
  return (
    <aside className="card shop-set" aria-label={title}>
      {img && (
        <Link href={modelPath(m)} className="shop-set-img" tabIndex={-1} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} width={img.width} height={img.height} alt="" loading="lazy" decoding="async" />
        </Link>
      )}
      <div>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p className="muted">{lead}</p>
        <p><b>{tm.title}</b> · {shopPrice(m, locale).label}</p>
        <Link className="btn primary" href={modelPath(m)}>{cta} →</Link>
      </div>
    </aside>
  );
}

/** „Completează setul”, pe pagina unei invitații: setul de accesorii din aceeași regiune (dacă e publicat). */
export function CompleteSet({ accessory, locale }: { accessory: ShopModel; locale: Locale }) {
  const t = categoryText("accesorii", locale);
  const parts = partNames("accesorii", accessory.parts, locale);
  const lead = parts.length ? `${t.partsLabel}: ${parts.join(", ")}.` : t.completeLead;
  return <SetLink m={accessory} locale={locale} title={t.completeTitle} lead={lead} cta={t.completeCta} />;
}

/** Pagina unui produs (/accesorii-nunta/<regiune>, /jurnale/<slug>), cu formularul de cumpărare. */
export function CategoryProductPage({ category, model, locale, open, payReady, error, invitation }: {
  category: NewCategory; model: ShopModel; locale: Locale; open: boolean; payReady: boolean; error?: string | null;
  /** La accesorii: invitația din aceeași regiune, dacă e publicată. */
  invitation?: ShopModel | null;
}) {
  const t = categoryText(category, locale);
  const path = SHOP_CATEGORIES[category].path;
  const tm = textOf(model, locale);
  const price = shopPrice(model, locale);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${own(modelPath(model), locale)}#page`, url: own(modelPath(model), locale), name: tm.metaTitle, description: tm.metaDescription, inLanguage: locale,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL }, mainEntity: { "@id": `${own(modelPath(model), locale)}#product` } },
      crumbsLd(locale, [{ name: t.label, path }, { name: tm.name, path: modelPath(model) }]),
      categoryProductLd(model, locale),
    ],
  };
  const [hero, ...cards] = model.images;
  const err = error === "acord" ? t.errConsent : error === "email" ? t.errEmail : error === "cadou" ? t.errGiftEmail : error === "oprit" ? t.paused : error ? t.errStart : null;
  const parts = partNames(category, model.parts, locale);
  return (
    <section className="stack shop" style={{ maxWidth: 960, margin: "0 auto" }}>
      {open && <JsonLd data={ld} />}
      <nav aria-label="breadcrumb" className="crumbs">
        <Link href="/">{HOME_LABEL[locale]}</Link> <span aria-hidden="true">›</span> <Link href={path}>{t.label}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{tm.name}</span>
      </nav>
      {!open ? <div className="card"><h1 style={{ marginTop: 0 }}>{tm.title}</h1><p style={{ margin: 0 }}>{t.closed}</p></div> : (
        <>
          <div className="card shop-model">
            {hero && (
              <figure className="shop-figure">
                <button type="button" className="shop-zoom" data-zoom="0" aria-label={`${zoomText(locale).open}: ${tm.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={hero.src} width={hero.width} height={hero.height} alt={tm.title} fetchPriority="high" decoding="async" />
                </button>
              </figure>
            )}
            <div className="shop-buy" id="cumpara">
              <div className="section-label" style={{ marginTop: 0 }}>{t.label}</div>
              <h1>{tm.title}</h1>
              <p className="shop-lead">{tm.tagline}</p>
              {parts.length > 0 && <p className="muted">{t.partsLabel}: {parts.join(", ")}</p>}
              <p className="shop-price"><span className="muted">{t.priceLabel}:</span> <b>{price.label}</b></p>
              {err && <p className="err" role="alert">{err}</p>}
              {payReady ? (
                <form method="post" action="/api/magazin/start" className="shop-form">
                  <input type="hidden" name="category" value={category} />
                  <input type="hidden" name="slug" value={model.slug} />
                  <input type="hidden" name="locale" value={locale} />
                  <div className="field shop-email">
                    <label htmlFor="shop-email">{t.emailLabel}</label>
                    <input id="shop-email" type="email" name="email" required maxLength={254} autoComplete="email" inputMode="email" />
                    <small className="muted">{t.emailHint}</small>
                  </div>
                  <label className="check shop-gift-toggle"><input type="checkbox" name="cadou" /> <span>{t.giftToggle}</span></label>
                  <fieldset className="shop-gift">
                    <div className="field"><label htmlFor="gift-to">{t.giftToLabel}</label>
                      <input id="gift-to" type="email" name="cadou_email" maxLength={254} autoComplete="off" inputMode="email" /></div>
                    <div className="field"><label htmlFor="gift-name">{t.giftToNameLabel}</label>
                      <input id="gift-name" name="cadou_nume" maxLength={80} autoComplete="off" /></div>
                    <div className="field"><label htmlFor="gift-from">{t.giftFromLabel}</label>
                      <input id="gift-from" name="cadou_de_la" maxLength={80} autoComplete="name" /></div>
                    <div className="field"><label htmlFor="gift-note">{t.giftNoteLabel}</label>
                      <textarea id="gift-note" name="cadou_mesaj" maxLength={300} rows={3} /></div>
                  </fieldset>
                  <label className="check pay-consent"><input type="checkbox" name="acord" required /> <span>{t.consent}</span></label>
                  <button type="submit" className="btn primary">{t.buy}</button>
                  <p className="muted shop-note">{t.payNote}</p>
                </form>
              ) : <p className="muted">{t.paused} <Link href="/contact">→</Link></p>}
            </div>
          </div>
          <div className="card">
            {tm.description.split(/\n{2,}/).map((para) => <p key={para}>{para}</p>)}
            {cards.length > 0 && (
              <div className="shop-cards">
                {cards.map((c, i) => (
                  <figure key={c.src}>
                    <button type="button" className="shop-zoom" data-zoom={i + 1} aria-label={`${zoomText(locale).open}: ${tm.name} (${i + 2}/${model.images.length})`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.src} width={c.width} height={c.height} alt={`${tm.name} (${i + 2}/${model.images.length})`} loading="lazy" decoding="async" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
            <p className="muted" style={{ marginBottom: 0 }}>{t.previewNote}</p>
          </div>
          {invitation && <SetLink m={invitation} locale={locale} title={t.setInvitation} lead={t.setInvitationLead} cta={t.seeInvitation} />}
          <Details category={category} locale={locale} model={model} />
          {model.images.length > 0 && <PozeMari images={model.images.map(({ src, width, height }) => ({ src, width, height }))} alt={tm.title} locale={locale} />}
          <p className="shop-blessing">{t.blessing}</p>
        </>
      )}
    </section>
  );
}

/** Textul de pe pagina de după plată, cu numele produsului (fără date personale în afara emailului cumpărătorului). */
export const doneLead = (t: ReturnType<typeof categoryText>, o: { email: string; buyerEmail: string | null }) =>
  o.buyerEmail ? fill(t.doneGift, { email: o.email, buyer: o.buyerEmail }) : fill(t.doneLead, { email: o.email });

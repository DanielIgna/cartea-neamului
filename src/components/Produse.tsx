import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { localizedPath, type Locale } from "@/i18n/locales";
import { SHOP_CATEGORIES, SHOP_PATH, fill, modelPath, modelText, shopPrice, type ShopModel } from "@/lib/invitatii-nunta";
import { categoryText } from "@/lib/magazin-texte";
import { HOME_LABEL, canonicalUrl } from "@/lib/page-metadata";
import HomePlans from "@/components/HomePlans";
import { homePlanCards } from "@/lib/home-plans";
import { tierPrice, type PlanSettings } from "@/lib/plans";
import { money } from "@/lib/plati";
import { PRODUCTS_PATH, shopPageText } from "@/lib/produse-texte";
import { SITE_URL } from "@/lib/site-url";

type Item = { key: string; title: string; text: string; price?: string; extra?: string; href: string; cta: string; noAccount: boolean; img?: { src: string; width: number; height: number } };

/**
 * „Produse și servicii” (/produse, Daniel, 27.11.2026): tot ce se poate cumpăra pe site, pe carduri, cu prețul de acum (din Admin)
 * și cu semnul „Fără cont” / „Cu cont”. Invitațiile de nuntă (fără cont) vin din baza de date; restul ține de arbore și duce la
 * paginile care există deja (plata, darul). Planurile apar doar cât timp vânzările sunt pornite.
 */
export default async function Produse({ locale, models, s, more = {} }: {
  locale: Locale; models: ShopModel[]; s: PlanSettings;
  /** Categoriile noi (28.11.2026): accesoriile de nuntă și jurnalele publicate, câte un card fiecare. */
  more?: { accesorii?: ShopModel[]; jurnal?: ShopModel[] };
}) {
  const t = shopPageText(locale);
  const lei = locale === "ro";
  const fmt = (p: { lei: number; eur: number }) => money(lei ? p.lei : p.eur, locale).label;
  const items: Item[] = [];
  /** Pozele cardurilor fără poze proprii (public/produse/*.webp, 1280×640): capturi din platformă (copacul, cartea PDF generată, cardul cadou cu codul ascuns, Filmul vieții), nu imagini de stoc. */
  const art = (k: string) => ({ src: `/produse/${k}.webp`, width: 1280, height: 640 });
  if (models.length) {
    const cheapest = models.reduce((a, m) => (shopPrice(m, locale).value < shopPrice(a, locale).value ? m : a));
    const names = models.map((m) => (modelText(m, locale) ?? modelText(m, "ro"))?.name ?? m.slug).join(", ");
    items.push({
      key: "invitatii", title: t.invTitle, text: t.invText, price: fill(t.from, { price: shopPrice(cheapest, locale).label }),
      extra: fill(t.invModels, { names }), href: SHOP_PATH, cta: t.see, noAccount: true, img: models[0].images[0],
    });
  }
  for (const c of ["accesorii", "jurnal"] as const) {
    const list = more[c] ?? [];
    if (!list.length) continue;
    const ct = categoryText(c, locale);
    const cheapest = list.reduce((a, m) => (shopPrice(m, locale).value < shopPrice(a, locale).value ? m : a));
    const names = list.map((m) => (modelText(m, locale) ?? modelText(m, "ro"))?.name ?? m.slug).join(", ");
    items.push({
      key: c, title: ct.prodTitle, text: ct.prodText, price: fill(t.from, { price: shopPrice(cheapest, locale).label }),
      extra: names, href: SHOP_CATEGORIES[c].path, cta: t.see, noAccount: true, img: list[0].images[0],
    });
  }
  const all = [...models, ...(more.accesorii ?? []), ...(more.jurnal ?? [])];
  const cards = s.on ? await homePlanCards(s, locale) : null;
  if (s.on) {
    const year = (k: "basic" | "familie" | "premium") => fmt(tierPrice(k, true, s));
    // Darul se poate face pe oricare plan (Basic, Familie, Premium), pe un an.
    const tiers = fill(t.plansPrices, { basic: year("basic"), familie: year("familie"), premium: year("premium") });
    items.push(
      { key: "carte", title: t.bookTitle, text: t.bookText, price: fmt({ lei: s.bookLei, eur: s.bookEur }), href: "/plata", cta: t.see, noAccount: false, img: art("carte") },
      { key: "cadou", title: t.giftTitle, text: t.giftText, price: fill(t.from, { price: fmt(tierPrice("basic", true, s)) }), extra: tiers, href: "/cadou-de-sarbatori", cta: t.see, noAccount: false, img: art("cadou") },
    );
    if (s.keepLei > 0) items.push({ key: "pastrare", title: t.keepTitle, text: t.keepText, price: fill(t.perYear, { price: fmt({ lei: s.keepLei, eur: s.keepEur }) }), href: "/plata", cta: t.see, noAccount: false, img: art("pastrare") });
  }
  const own = canonicalUrl(localizedPath(PRODUCTS_PATH, locale));
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${own}#page`, url: own, name: t.metaTitle, description: t.metaDescription, inLanguage: locale, isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL } },
      { "@type": "BreadcrumbList", itemListElement: [{ name: HOME_LABEL[locale], path: "/" }, { name: t.title, path: PRODUCTS_PATH }].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: canonicalUrl(localizedPath(x.path, locale)) })) },
      ...(all.length ? [{ "@type": "ItemList", itemListElement: all.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: canonicalUrl(localizedPath(modelPath(m), locale)) })) }] : []),
    ],
  };
  return (
    <section className="stack prod" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <JsonLd data={ld} />
      <nav aria-label="breadcrumb" className="crumbs"><Link href="/">{HOME_LABEL[locale]}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{t.title}</span></nav>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t.title}</h1>
        <p className="shop-lead" style={{ marginBottom: 0 }}>{t.lead}</p>
      </div>
      <ul className="prod-grid">
        {items.map((it) => (
          <li key={it.key} className={`card prod-item prod-${it.key}`}>
            {it.img && (
              <Link href={it.href} className="prod-img" tabIndex={-1} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.img.src} width={it.img.width} height={it.img.height} alt="" loading="lazy" decoding="async" />
              </Link>
            )}
            <span className={it.noAccount ? "pill ok" : "pill"}>{it.noAccount ? t.noAccount : t.withAccount}</span>
            <h2><Link href={it.href}>{it.title}</Link></h2>
            <p className="muted">{it.text}</p>
            {it.extra && <p className="prod-extra">{it.extra}</p>}
            {it.price && <p className="prod-price"><b>{it.price}</b></p>}
            <p className="prod-cta"><Link className={it.noAccount ? "btn primary" : "btn"} href={it.href}>{it.cta} →</Link></p>
          </li>
        ))}
      </ul>
      {cards && (
        <section className="card prod-plans" aria-labelledby="prod-plans" id="planuri">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="prod-plans-img" src="/produse/arbore.webp" width={1600} height={800} alt="" loading="lazy" decoding="async" />
          <span className="pill">{t.withAccount}</span>
          <h2 id="prod-plans">{t.plansTitle}</h2>
          <p className="muted">{t.plansText}</p>
          <HomePlans plans={cards.plans} periods={cards.periods} {...cards.props} />
        </section>
      )}
    </section>
  );
}

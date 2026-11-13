import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getLocale, getT } from "@/i18n/server";
import { FAQ_KEYS, GIFT_PATH, giftJsonLd } from "@/lib/cadou-sarbatori";
import { publicPageMetadata } from "@/lib/page-metadata";
import { publicPlanSettings } from "@/lib/plan-cache";
import { tierLimits, tierPrice, type PlanSettings } from "@/lib/plans";
import { money } from "@/lib/plati";

export const dynamic = "force-dynamic";

/** Prețul anului Basic dăruit, din Admin → Manager control: în lei pe română, în euro în celelalte limbi. */
function giftPrice(s: PlanSettings, locale: string) {
  const p = tierPrice("basic", true, s);
  return money(locale === "ro" ? p.lei : p.eur, locale).label;
}

async function texts() {
  const [t, locale, s] = await Promise.all([getT("GiftPage"), getLocale(), publicPlanSettings()]);
  const price = giftPrice(s, locale);
  return { t, locale, s, price, title: t("metaTitle", { price }), description: t("metaDescription", { price }) };
}

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await texts();
  return publicPageMetadata({ path: GIFT_PATH, title, description });
}

/**
 * „Cadou de sărbători”: ce primește cel căruia îi dăruiești un an Basic, cum merge darul pas cu pas, butonul „Dăruiește acum”
 * (spre darul de pe pagina de plată, cu Basic ales) și întrebările frecvente. Prețul și plafoanele vin din Admin → Manager control.
 * Nu are nimic despre oamenii din arbori; e la fel pentru toți vizitatorii.
 */
export default async function GiftSeasonPage() {
  const [{ t, locale, s, price, title, description }, tp] = await Promise.all([texts(), getT("Plata")]);
  const lim = tierLimits("basic", s);
  const nf = new Intl.NumberFormat(locale);
  const n = (v: number | null) => (v === null ? "∞" : nf.format(v));
  const plan = tp("tiers.basic.name");
  const faq = FAQ_KEYS.map((k) => ({ q: t(`q${k}`), a: t(`a${k}`) }));
  const gets = [
    { h: t("get1Title", { plan }), p: t("get1") },
    { h: t("get2Title"), p: t("get2", { persons: n(lim.persons) }) },
    { h: t("get3Title"), p: t("get3", { photos: n(lim.photos) }) },
    { h: t("get4Title"), p: t("get4", { audio: n(lim.audio) }) },
  ];
  const steps = [1, 2, 3] as const;
  return (
    <section className="stack gift-season" style={{ maxWidth: 860, margin: "0 auto" }}>
      <JsonLd data={giftJsonLd({ title, description, home: t("home"), crumb: t("label"), faq, lang: locale })} />
      <nav aria-label="breadcrumb" className="crumbs"><Link href="/">{t("home")}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{t("label")}</span></nav>
      <div className="card gift-hero">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h1>{t("title", { price })}</h1>
        <p className="gift-lead">{t("lead")}</p>
        <GiftCta on={s.on} cta={t("cta")} note={t("ctaNote")} soon={t("soon")} soonLink={t("soonLink")} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("getTitle")}</h2>
        <ul className="gift-gets">
          {gets.map((g) => <li key={g.h}><h3>{g.h}</h3><p className="muted">{g.p}</p></li>)}
        </ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("stepsTitle")}</h2>
        <ol className="gift-steps">
          {steps.map((k) => <li key={k}><h3>{t(`step${k}Title`)}</h3><p className="muted">{t(`step${k}`)}</p></li>)}
        </ol>
        <GiftCta on={s.on} cta={t("cta")} note={null} soon={null} soonLink={t("soonLink")} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("faqTitle")}</h2>
        {faq.map((f) => <details key={f.q} className="gift-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </div>
    </section>
  );
}

/** „Dăruiește acum” duce la darul de pe pagina de plată, cu Basic ales; cât vânzarea e oprită din Admin, la Contact. */
function GiftCta({ on, cta, note, soon, soonLink }: { on: boolean; cta: string; note: string | null; soon: string | null; soonLink: string }) {
  if (!on) return soon ? <p className="muted">{soon} <Link href="/contact">{soonLink}</Link></p> : null;
  return (
    <div className="gift-cta">
      <div className="actions"><Link className="btn primary" href="/plata?dar=basic">{cta}</Link></div>
      {note && <p className="muted" style={{ marginBottom: 0 }}>{note}</p>}
    </div>
  );
}

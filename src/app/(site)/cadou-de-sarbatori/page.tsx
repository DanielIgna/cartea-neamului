import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getAppName, getLocale, getT } from "@/i18n/server";
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
  return publicPageMetadata({ path: GIFT_PATH, title, description, locale: await getLocale() });
}

/**
 * „Cadou de sărbători”: ce primește cel căruia îi dăruiești un an Basic, cum merge darul pas cu pas, butonul „Dăruiește acum”
 * (spre darul de pe pagina de plată, cu Basic ales) și întrebările frecvente. Prețul și plafoanele vin din Admin → Manager control.
 * Nu are nimic despre oamenii din arbori; e la fel pentru toți vizitatorii.
 */
export default async function GiftSeasonPage() {
  const [{ t, locale, s, price, title, description }, tp, appName] = await Promise.all([texts(), getT("Plata"), getAppName()]);
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
  // Toate cele trei planuri, cu prețul din Admin, ca darul să se poată face și pe Familie sau Premium.
  const tierLabel = (x: "familie" | "premium") => money(locale === "ro" ? tierPrice(x, true, s).lei : tierPrice(x, true, s).eur, locale).label;
  const note = t("ctaNote", { familie: tierLabel("familie"), premium: tierLabel("premium") });
  return (
    <section className="stack gift-season" style={{ maxWidth: 860, margin: "0 auto" }}>
      <JsonLd data={giftJsonLd({ title, description, home: t("home"), crumb: t("label"), faq, lang: locale })} />
      <nav aria-label="breadcrumb" className="crumbs"><Link href="/">{t("home")}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{t("label")}</span></nav>
      {/* Sus, dintr-o privire (19.11.2026: pagina pierdea pe toți cei care intrau): cum arată darul, prețul, butonul și ce urmează. */}
      <div className="card gift-hero gift-hero-split">
        <div>
          <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
          <h1>{t("title", { price })}</h1>
          <p className="gift-lead">{t("lead")}</p>
          <GiftCta on={s.on} cta={t("cta")} note={null} soon={t("soon")} soonLink={t("soonLink")} />
          {s.on && (
            <ul className="gift-quick">
              <li>{t("quick1")}</li><li>{t("quick2")}</li><li>{t("quick3")}</li>
            </ul>
          )}
          {s.on && <p className="muted gift-buy-note">{t("buyNote")} {note}</p>}
          <p className="gift-try">{t("tryFirst")} <Link href="/intrare?mod=cont-nou">{t("tryLink")} →</Link></p>
        </div>
        <figure className="gift-card-demo" aria-hidden="true">
          <div className="gift-card-face">
            <span className="gift-card-brand">{appName}</span>
            <b className="gift-card-title">{t("cardTitle")}</b>
            <span className="gift-card-for">{t("cardFor", { name: t("sampleName") })}</span>
            <span className="gift-card-plan">{plan} · {price}</span>
            <span className="gift-card-qr" />
          </div>
        </figure>
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
      {/* Celelalte idei de cadou (/cadouri) sunt doar în română (planul SEO, 18.11.2026). */}
      {locale === "ro" && (
        <nav className="card" aria-label="Alte idei de cadou">
          <h2 style={{ marginTop: 0 }}>Alte idei de cadou pentru familie</h2>
          <ul>
            <li><Link href="/cadouri/pentru-parinti">Cadou pentru părinți</Link></li>
            <li><Link href="/cadouri/pentru-bunici">Cadou pentru bunici care „au tot”</Link></li>
            <li><Link href="/cadouri/cadou-de-ultim-moment">Cadou de ultim moment, digital, primit imediat</Link></li>
            <li><Link href="/cadouri">Toate ideile: pe ocazii și pe persoane</Link></li>
          </ul>
          <h2>De făcut împreună, de Crăciun</h2>
          <ul>
            <li><Link href="/ghid/nasterea-lui-isus-in-evanghelii">Povestea Nașterii lui Isus, din toate Evangheliile, de citit în familie</Link></li>
            <li><Link href="/ghid/intrebari-pentru-bunici-de-craciun">Întrebări pentru bunici de Crăciun: cum era pe vremea lor</Link></li>
            <li><Link href="/ghid/arborele-familiei-la-masa-de-sarbatori">Arborele familiei la masa de sărbători: un joc pentru toți</Link></li>
            <li><Link href="/ghid/colindele-bunicilor">Colindele bunicilor: cum le înregistrezi și le păstrezi</Link></li>
            <li><Link href="/ghid/caietul-cu-retetele-bunicii">Caietul cu rețetele bunicii, cadou pentru familie</Link></li>
          </ul>
        </nav>
      )}
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

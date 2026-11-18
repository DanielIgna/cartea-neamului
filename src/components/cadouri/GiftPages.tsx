import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import { CHRISTMAS, GIFTS_DESCRIPTION as HUB_DESCRIPTION, GIFTS_TITLE as HUB_TITLE, GIFTS_HUB, GIFT_PAGES, giftPage, giftPath, type GiftPage, type GiftTier } from "@/lib/cadouri";
import { canonicalUrl } from "@/lib/page-metadata";
import { lastmodOf } from "@/lib/seo/versiuni";
import { inSeason, seasonalOrder } from "@/lib/seo/sezon";
import { publicPlanSettings } from "@/lib/plan-cache";
import { tierLimits, tierPrice, type PlanSettings } from "@/lib/plans";
import { money } from "@/lib/plati";
import { SITE_URL } from "@/lib/site-url";

/**
 * Secțiunea /cadouri (src/lib/cadouri.ts): hubul și paginile pe ocazii și destinatari. Prețurile și plafoanele vin din
 * Admin → Manager control; cât vânzarea e oprită, butonul de dar trimite la Contact. Doar în română.
 */
const TIER_NAME: Record<GiftTier, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };
const lei = (s: PlanSettings, t: GiftTier) => money(tierPrice(t, true, s).lei, "ro").label;
const nf = new Intl.NumberFormat("ro");
/** Numele paginii în liste: titlul de dinaintea celor două puncte („Cadou pentru bunici”). */
const shortTitle = (p: GiftPage) => p.title.split(":")[0];
const n = (v: number | null) => (v === null ? "fără limită" : nf.format(v));


function GiftButton({ s, tier, label = "Dăruiește acum" }: { s: PlanSettings; tier: GiftTier; label?: string }) {
  if (!s.on) return <p className="muted">Darurile se pot cumpăra în curând. Dacă vrei unul acum, <Link href="/contact">scrie-ne</Link>.</p>;
  return (
    <p className="cta-top">
      <Link className="btn primary" href={`/plata?dar=${tier}`}>{label} →</Link>
      <small className="muted">{TIER_NAME[tier]}, {lei(s, tier)} pe an, plătit o singură dată</small>
    </p>
  );
}

const STEPS = [
  { h: "Cumperi darul", p: "Alegi planul, îți faci cont gratuit dacă nu ai, scrii pentru cine este și un bilet scurt, apoi plătești cu cardul, prin Stripe." },
  { h: "Primești legătura pe loc", p: "O trimiți pe WhatsApp sau pe email, ori tipărești un card cu biletul tău și un cod de scanat cu telefonul. Nu așteptați nimic prin poștă." },
  { h: "Cel care îl primește apasă „Primește anul”", p: "Deschide legătura sau scanează codul, intră în cont și anul e al lui. Legătura nu expiră și se poate primi o singură dată." },
];

const COMMON_FAQ = [
  { q: "Se reînnoiește singur după un an?", a: "Nu. Darul se plătește o singură dată și nu se ia nimic de pe niciun card după un an. Arborele rămâne al celui care l-a primit; îl vede și îl poate descărca oricând." },
  { q: "Dacă cel căruia îi dăruiesc are deja un an plătit?", a: "Nu se pierde nimic: anul dăruit se adaugă după cel pe care îl are deja." },
];

function faqJsonLd(path: string, faq: { q: string; a: string }[]) {
  const url = canonicalUrl(path);
  return {
    "@context": "https://schema.org", "@type": "FAQPage", "@id": `${url}#faq`,
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

function webPageJsonLd(path: string, name: string, description: string) {
  const url = canonicalUrl(path);
  return {
    "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#page`, url, name, description, inLanguage: "ro",
    dateModified: lastmodOf(path, new Date("2026-11-18T00:00:00Z")).toISOString().slice(0, 10),
    isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
  };
}

/** Ce primește concret cel căruia îi dăruiești planul ales, cu plafoanele din Admin. */
function WhatTheyGet({ s, tier }: { s: PlanSettings; tier: GiftTier }) {
  const lim = tierLimits(tier, s);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Ce primește concret, pe planul {TIER_NAME[tier]}</h2>
      <ul>
        <li>Un an întreg pe planul {TIER_NAME[tier]}, plătit o singură dată, fără abonament.</li>
        <li>Arborele familiei: până la {n(lim.persons)} de persoane.</li>
        <li>Pozele vechi lângă oamenii din ele: până la {n(lim.photos)} de fotografii.</li>
        <li>Glasurile celor dragi: până la {n(lim.audio)} de înregistrări.</li>
        <li>Rude care pot scrie în arbore: {n(lim.writers)}. Cine doar vede arborele nu plătește nimic.</li>
      </ul>
      <p className="muted small" style={{ marginBottom: 0 }}>Cartea familiei în PDF se cumpără separat, {money(s.bookLei, "ro").label}, și se face din datele voastre.</p>
    </div>
  );
}

function Price({ s }: { s: PlanSettings }) {
  return (
    <p className="muted">
      Darul pe Basic costă {lei(s, "basic")}, pe Familie {lei(s, "familie")}, pe Premium {lei(s, "premium")}, pentru un an.
      {" "}Dacă vrei întâi să încerci singur, contul are 7 zile gratuite, fără card.
    </p>
  );
}

export async function GiftHub() {
  const s = await publicPlanSettings();
  const occasions = seasonalOrder([
    { ...CHRISTMAS, label: "Cadou de Crăciun pentru părinți și bunici" },
    ...GIFT_PAGES.filter((p) => p.kind === "ocazie").map((p) => ({ key: p.season ?? null, name: p.name, label: shortTitle(p), path: giftPath(p), text: p.description })),
  ]);
  const recipients = GIFT_PAGES.filter((p) => p.kind === "destinatar");
  const christmasNow = inSeason("craciun");
  return (
    <section className="stack content-page gifts-page" lang="ro">
      <JsonLd data={webPageJsonLd(GIFTS_HUB, HUB_TITLE, HUB_DESCRIPTION)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Cadouri pe ocazii și persoane",
        itemListElement: [...occasions.map((o) => o.path), ...recipients.map(giftPath)].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: canonicalUrl(p) })) }} />
      <JsonLd data={faqJsonLd(GIFTS_HUB, COMMON_FAQ)} />
      <Breadcrumbs items={[{ name: "Cadouri", path: GIFTS_HUB }]} />
      <article className="card prose">
        <h1>Cadouri pentru familie: povestea neamului, dăruită</h1>
        <p className="lead">Pentru părinți, bunici, socri sau nași, la o sărbătoare sau la o aniversare: un an în Cartea Neamului, în care cel care primește darul își pune la un loc familia, pozele vechi și glasurile celor dragi. Se dăruiește printr-o legătură sau printr-un card de tipărit.</p>
        <GiftButton s={s} tier="basic" />
      </article>

      {christmasNow && (
        <div className="card gift-hero">
          <div className="section-label" style={{ marginTop: 0 }}>Acum e sezonul</div>
          <h2 style={{ marginTop: 0 }}><Link href={CHRISTMAS.path}>Cadou de Crăciun pentru părinți și bunici</Link></h2>
          <p>{CHRISTMAS.text} Legătura nu expiră, așa că o poți cumpăra din timp.</p>
          <p className="cta-top"><Link className="btn primary" href={CHRISTMAS.path}>Vezi darul de Crăciun →</Link></p>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cadouri pe ocazii</h2>
        <div className="sheet-grid">
          {occasions.map((o) => (
            <div key={o.path} className="sheet-card">
              <b><Link href={o.path}>{o.label}</Link></b>
              <span className="muted">{o.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cadouri pentru cine</h2>
        <div className="sheet-grid">
          {recipients.map((p) => (
            <div key={p.slug} className="sheet-card">
              <b><Link href={giftPath(p)}>{shortTitle(p)}</Link></b>
              <span className="muted">{p.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cum funcționează darul</h2>
        <ol className="gift-steps">{STEPS.map((x) => <li key={x.h}><h3>{x.h}</h3><p className="muted">{x.p}</p></li>)}</ol>
        <Price s={s} />
      </div>

      <div className="card school-page">
        <h2 style={{ marginTop: 0 }}>Întrebări frecvente</h2>
        {COMMON_FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </div>

      <CtaArbore title="Sau începe tu arborele familiei" src="cadou-hub" />
    </section>
  );
}

export async function GiftPageView({ slug }: { slug: string }) {
  const p = giftPage(slug)!;
  const s = await publicPlanSettings();
  const faq = [...p.faq, ...COMMON_FAQ];
  const related = p.related.map(giftPage).filter((x): x is GiftPage => !!x);
  const path = giftPath(p);
  return (
    <section className="stack content-page gifts-page" lang="ro">
      <JsonLd data={webPageJsonLd(path, p.title, p.description)} />
      <JsonLd data={faqJsonLd(path, faq)} />
      <Breadcrumbs items={[{ name: "Cadouri", path: GIFTS_HUB }, { name: p.name, path }]} />
      <article className="card prose">
        <h1>{p.h1}</h1>
        <p className="lead">{p.lead}</p>
        <GiftButton s={s} tier={p.tier} />
        <h2>{p.why.h2}</h2>
        {p.why.p.map((x) => <p key={x}>{x}</p>)}
        {p.more && <><h2>{p.more.h2}</h2>{p.more.p.map((x) => <p key={x}>{x}</p>)}</>}
        <h2>{p.ideas.h2}</h2>
        <ul>{p.ideas.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <h2>Un bilet pentru card</h2>
        <blockquote>{p.note}</blockquote>
        <h2>Ce plan să alegi</h2>
        <p>{p.tierWhy}</p>
      </article>

      <WhatTheyGet s={s} tier={p.tier} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pașii, de la cumpărare la „Primește anul”</h2>
        <ol className="gift-steps">{STEPS.map((x) => <li key={x.h}><h3>{x.h}</h3><p className="muted">{x.p}</p></li>)}</ol>
        <Price s={s} />
        <GiftButton s={s} tier={p.tier} />
      </div>

      <div className="card school-page">
        <h2 style={{ marginTop: 0 }}>Întrebări frecvente</h2>
        {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </div>

      <nav className="card" aria-label="Vezi și">
        <h2 style={{ marginTop: 0 }}>Vezi și</h2>
        <ul>
          {related.map((r) => <li key={r.slug}><Link href={giftPath(r)}>{r.h1}</Link></li>)}
          <li><Link href={CHRISTMAS.path}>Cadou de Crăciun pentru părinți și bunici</Link></li>
          <li><Link href={GIFTS_HUB}>Toate ideile de cadouri pentru familie</Link></li>
          <li><Link href="/ghid/intrebari-pentru-bunici">Întrebări pentru bunici, pentru prima discuție</Link></li>
          <li><Link href="/ghid/cum-inregistrezi-glasul-bunicilor">Cum înregistrezi glasul bunicilor</Link></li>
        </ul>
      </nav>

      <CtaArbore title="Sau începe tu arborele familiei" src={`cadou-${p.slug}`} />
    </section>
  );
}

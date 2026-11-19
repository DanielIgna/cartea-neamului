import Link from "next/link";
import { notFound } from "next/navigation";
import { ORG, pageCardUrl } from "@/lib/seo/organizatie";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/components/continut/Breadcrumbs";
import { getLocale } from "@/i18n/server";
import { LANGUAGE_NAMES, REGIONAL_HREFLANG, localizedPath, type Locale } from "@/i18n/locales";
import { OG_LOCALE, canonicalUrl, fitTitle } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import {
  COUNTRIES, COUNTRY_OF, LOCALES_OF, THEMES, alternatesFor, draftEntries, resolveDraft, keyOfCountry, countryPath, descriptionOf, diasporaAlternates, entries, isRtl, nameOf, pickLang, regionPath, resolve, themePath, titleOf, tx,
  type Country, type Entry, type Lang, type Link as Src, type Region, type Theme,
} from "@/lib/diaspora";
import { ROMANIA_LINKS } from "@/lib/diaspora/tari";
import { regionsOf, regionIndexable } from "@/lib/diaspora/america";
import { UI, XUI } from "@/lib/diaspora/ui";
import { EXTRA, VERIFIED_ON } from "@/lib/diaspora/extins";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { DEFAULT_SETTINGS, PLANS_TAG, planSettings, yearPrice, type PlanSettings } from "@/lib/plans";
import { money, type Currency } from "@/lib/plati";
import { getEntry as getGuide } from "@/lib/continut/colectii";

/** Paginile /diaspora, /diaspora/<țară sau temă> și /diaspora/<statele-unite|canada>/<stat, provincie sau oraș>. */

const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Cartea Neamului" };

/** Legătura spre altă pagină a secțiunii: în limba omului dacă pagina e scrisă în ea, altfel în cea de rezervă. */
function hrefOf(e: Entry, locale: Locale) {
  const { lang, native } = pickLang(e.langs, locale);
  return localizedPath(e.path, native ? locale : LOCALES_OF[lang][0]);
}
/** Pagina după adresă; ciornele se găsesc și ele, pentru previzualizarea din Admin (pe site nu există legături spre ele). */
const entryOf = (path: string) => entries().find((e) => e.path === path) ?? draftEntries().find((e) => e.path === path)!;

/** Prețurile din Admin → Manager control: în cache 10 minute, golit la salvare (ca pe prima pagină). */
const cachedPlans = unstable_cache(() => planSettings(db), ["plan-settings"], { tags: [PLANS_TAG], revalidate: 600 });
/** Moneda țării, pentru echivalentul aproximativ al prețului (plata rămâne cum e setată în Admin). */
const LOCAL_CURRENCY: Record<string, Currency> = { US: "usd", CA: "cad", GB: "gbp", IL: "ils" };

/** Eticheta de sursă a paginii (?src=diaspora-<țară sau oraș>), ca să se vadă în Admin de unde vin conturile. */
export function diasporaSrc(e: Entry): string {
  const tail = e.kind === "hub" ? "" : e.path.split("/").pop()!;
  return tail ? `diaspora-${tail}` : "diaspora";
}
const countryOfEntry = (e: Entry): Country | null => (e.kind === "country" ? e.country : e.kind === "region" ? e.country : null);

export async function diasporaMetadata(a?: string, b?: string): Promise<Metadata> {
  const e = resolve(a, b);
  if (!e) return {};
  const locale = await getLocale();
  const { url, lang, ...alt } = diasporaAlternates(e, locale);
  const title = fitTitle(titleOf(e, lang));
  const description = descriptionOf(e, lang);
  const card = pageCardUrl(new URL(url).pathname);
  const img = card ? { url: card, width: 1200, height: 630, alt: title } : OG_IMAGE;
  return {
    title, description, ...alt,
    openGraph: { title, description, url, siteName: "Cartea Neamului", locale: OG_LOCALE[LOCALES_OF[lang][0]], type: "article", images: [img] },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

/**
 * `preview`: previzualizarea unei ciorne în Admin → SEO → Ciorne, în limba aleasă (pagina nu e publică și nu intră în Google).
 */
export async function DiasporaPage({ a, b, preview }: { a?: string; b?: string; preview?: { lang?: Lang } }) {
  const e = preview ? resolveDraft(a, b) ?? resolve(a, b) : resolve(a, b);
  if (!e) notFound();
  const locale = await getLocale();
  const picked = pickLang(e.langs, locale);
  const { lang, native } = preview?.lang && e.langs.includes(preview.lang) ? { lang: preview.lang, native: true } : picked;
  const u = UI[lang];
  const href = (x: Entry) => hrefOf(x, locale);
  const crumbs: Crumb[] = [{ name: u.home, path: localizedPath("/", locale) }, { name: u.diaspora, path: href(entries()[0]) }];
  if (e.kind === "region") crumbs.push({ name: tx(e.country.name, lang), path: href(entryOf(countryPath(e.country))) });
  if (e.kind !== "hub") crumbs.push({ name: nameOf(e, lang), path: href(e) });

  const otherLangs = Object.entries(alternatesFor(e.path, e.langs)).filter(([k]) => k !== "x-default" && k !== locale && !(k in REGIONAL_HREFLANG));
  return (
    <section className="stack content-page diaspora-page" lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}>
      {preview && <p className="untranslated-note" role="note" lang="ro" dir="ltr">Ciornă, nepublicată: o vezi doar tu, din Admin. Limbile ciornei: {e.langs.join(", ")}.</p>}
      {!native && <p className="untranslated-note" role="note">{UI[lang].fallback}</p>}
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {e.kind === "country" && faqOf(e.country, lang).length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang,
          mainEntity: faqOf(e.country, lang).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }} />
      )}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": e.kind === "hub" ? "CollectionPage" : "Article",
        [e.kind === "hub" ? "name" : "headline"]: nameOf(e, lang), description: descriptionOf(e, lang), url: canonicalUrl(href(e)), inLanguage: lang,
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        ...(e.kind === "hub" ? {} : { dateModified: "2026-11-15", author: ORG }),
      }} />
      <nav className="crumbs" aria-label="›">
        <ol>{crumbs.map((c, i) => <li key={c.path}>{i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}</li>)}</ol>
      </nav>
      {e.kind === "hub" && <Hub l={lang} href={href} />}
      {e.kind === "country" && <CountryBody c={e.country} l={lang} href={href} />}
      {e.kind === "region" && <RegionBody r={e.region} c={e.country} l={lang} href={href} />}
      {e.kind === "theme" && <ThemeBody t={e.theme} l={lang} href={href} />}
      {e.kind !== "hub" && <Steps l={lang} />}
      <Cta e={e} l={lang} plans={await cachedPlans().catch(() => DEFAULT_SETTINGS)} />
      {otherLangs.length > 0 && (
        <p className="muted" style={{ fontSize: 14 }}>
          {u.otherLangs}: {otherLangs.map(([loc, p], i) => <span key={loc}>{i > 0 && " · "}<Link href={p} hrefLang={loc} lang={loc}>{LANGUAGE_NAMES[loc as Locale] ?? loc}</Link></span>)}
        </p>
      )}
    </section>
  );
}

type Href = (e: Entry) => string;

function Cta({ e, l, plans }: { e: Entry; l: Lang; plans: PlanSettings }) {
  const u = UI[l], x = XUI[l];
  const src = diasporaSrc(e);
  const c = countryOfEntry(e);
  // Prețul se arată doar cât vânzarea e pornită (ca pe prima pagină): în lei, cu echivalentul aproximativ în moneda țării.
  let price: string | null = null;
  if (x && plans.on) {
    const p = yearPrice(true, plans);
    const lei = money(p.lei, "ro").label;
    const cur = c ? LOCAL_CURRENCY[c.code] ?? "eur" : null;
    price = x.price(lei, cur ? money(p.eur, "en-GB", cur, plans).label : null);
  }
  const share = `${SITE_URL}/?src=${src}-wa`;
  return (
    <div className="card cta-card">
      <h2 style={{ marginTop: 0 }}>{u.ctaTitle}</h2>
      <p>{u.ctaText}</p>
      {price && <p className="muted">{price}</p>}
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 0 }}>
        <Link className="btn primary" href={`/intrare?mod=cont-nou&src=${src}`}>{u.ctaButton}</Link>
        {x && <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(x.whatsappText(share))}`} target="_blank" rel="noopener">{x.whatsapp}</a>}
      </p>
    </div>
  );
}

/** Întrebările frecvente ale unei țări, în limba paginii (și pentru FAQPage). */
export const faqOf = (c: Country, l: Lang) => EXTRA[c.slug]?.faq[l] ?? [];

function Extra({ c, l, where, part }: { c: Country; l: Lang; where: string; part: "guide" | "after" }) {
  const ex = EXTRA[c.slug], x = XUI[l];
  if (!ex || !x) return null;
  if (part === "guide") {
    const g = ex.guide[l];
    return g?.length ? (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{x.guide(where)}</h2>
        {g.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
      </div>
    ) : null;
  }
  const sp = ex.specifics[l], faq = faqOf(c, l);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{x.missions}</h2>
        <ul className="hub-list">
          {ex.missions.map((m) => (
            <li key={m.kind + m.city}>
              <strong>{x.kind[m.kind]} · {m.city}</strong>
              {m.address && <><br /><span>{m.address}</span></>}
              {m.url && <><br /><a href={m.url} rel="noopener" target="_blank">{m.url.replace(/^https:\/\//, "")}</a></>}
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          {x.missionsNote(VERIFIED_ON)} <a href={ex.missionsSource.url} rel="noopener" target="_blank">{ex.missionsSource.name}</a>.
          {ex.stats && <> {x.statsNote} <a href={ex.stats.url} rel="noopener" target="_blank">{ex.stats.name}</a>.</>}
        </p>
      </div>
      {sp?.length ? (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{x.specifics}</h2>
          {sp.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>
      ) : null}
      {faq.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{x.faq}</h2>
          {faq.map((f) => <details key={f.q}><summary><strong>{f.q}</strong></summary><p>{f.a}</p></details>)}
        </div>
      )}
    </>
  );
}

function Hub({ l, href }: { l: Lang; href: Href }) {
  const u = UI[l];
  const country = (c: Country) => entryOf(countryPath(c));
  const region = (r: Region) => entryOf(regionPath(r));
  const europe = COUNTRIES.filter((c) => c.code !== "US" && c.code !== "CA");
  const us = COUNTRIES.find((c) => c.code === "US")!, ca = COUNTRIES.find((c) => c.code === "CA")!;
  const list = (rs: Region[]) => (
    <ul className="hub-list hub-cols">
      {rs.map((r) => <li key={r.slug}><Link href={href(region(r))} style={regionIndexable(r) ? undefined : { fontWeight: 400 }}>{tx(r.name, l)}</Link></li>)}
    </ul>
  );
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{u.hubTitle}</h1>
        <p style={{ marginBottom: 0 }}>{u.hubLead}</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.countries}</h2>
        <ul className="hub-list hub-cols">
          {europe.map((c) => <li key={c.slug}><span aria-hidden>{c.flag} </span><Link href={href(country(c))}>{tx(c.name, l)}</Link></li>)}
        </ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.cities}</h2>
        {(["it", "es", "de", "gb", "fr", "at", "be", "ie", "pt", "gr", "cy", "il", "nl", "ua"] as const).map((k) => {
          const c = COUNTRIES.find((x) => x.slug === COUNTRY_OF[k]);
          if (!c || !regionsOf(k).length) return null;
          return (
            <div key={k}>
              <h3><span aria-hidden>{c.flag} </span><Link href={href(country(c))}>{tx(c.name, l)}</Link></h3>
              {list(regionsOf(k, "city"))}
              {regionsOf(k, "region").length > 0 && <><h4>{u.regions}</h4>{list(regionsOf(k, "region"))}</>}
            </div>
          );
        })}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{us.flag} <Link href={href(country(us))}>{u.america}</Link></h2>
        <h3>{u.cities}</h3>
        {list(regionsOf("us", "city"))}
        <h3>{u.states}</h3>
        {list(regionsOf("us", "state"))}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{ca.flag} <Link href={href(country(ca))}>{u.canada}</Link></h2>
        <h3>{u.cities}</h3>
        {list(regionsOf("ca", "city"))}
        <h3>{u.provinces}</h3>
        {list(regionsOf("ca", "province"))}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.themes}</h2>
        <ul className="hub-list">
          {THEMES.map((t) => <li key={t.slug}><Link href={href(entryOf(themePath(t)))}>{tx(t.name, l)}</Link><br /><span className="muted">{tx(t.description, l)}</span></li>)}
        </ul>
      </div>
    </>
  );
}

/** Ghidurile din /ghid legate de pagină (titlul lor e în română; legătura e spre ghid, nu îl repetăm aici). */
function Guides({ slugs, l }: { slugs?: string[]; l: Lang }) {
  const gs = (slugs ?? []).map((s) => getGuide("ghid", s)).filter((g) => !!g);
  if (!gs.length) return null;
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{UI[l].guides}</h2>
      <ul className="hub-list">{gs.map((g) => <li key={g!.slug}><Link href={`/ghid/${g!.slug}`} lang="ro">{g!.title}</Link></li>)}</ul>
    </div>
  );
}

function Sources({ l, links, title }: { l: Lang; links: Src[]; title: string }) {
  if (!links.length) return null;
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <ul className="hub-list">
        {links.map((s) => <li key={s.url}><a href={s.url} rel="noopener" target="_blank">{s.name}</a> <span className="muted">· {tx(s.note, l)}</span></li>)}
      </ul>
    </div>
  );
}

function Docs({ l, where, eu, icr }: { l: Lang; where: string; eu: boolean; icr: string | null }) {
  const u = UI[l];
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.docs}</h2>
        <ol>{u.docsSteps({ where, eu, icr }).map((s) => <li key={s.slice(0, 40)}>{s}</li>)}</ol>
      </div>
      <Sources l={l} links={ROMANIA_LINKS} title={u.sources} />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.community}</h2>
        {u.communityText({ where, eu, icr }).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
      </div>
    </>
  );
}

function Steps({ l }: { l: Lang }) {
  const u = UI[l];
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{u.steps}</h2>
      <ol>{u.genealogySteps.map((s) => <li key={s.slice(0, 40)}>{s}</li>)}</ol>
      <p className="muted" style={{ marginBottom: 0 }}>
        <Link href="/localitati">{u.localities}</Link> · <Link href="/nume">{u.names}</Link> · <Link href="/ghid">{u.guides}</Link>
      </p>
    </div>
  );
}

function CountryBody({ c, l, href }: { c: Country; l: Lang; href: Href }) {
  const u = UI[l];
  const where = tx(c.where, l);
  const cities = l === "he" && c.citiesHe ? c.citiesHe : c.cities;
  const key = keyOfCountry(c);
  const regions = key ? regionsOf(key) : [];
  const themes = THEMES.filter((t) => t.related.includes(c.slug));
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{c.flag} {u.titleCountry(where).replace(/ \| Cartea Neamului$/, "")}</h1>
        {c.size && <p><strong>{cap(tx(c.size, l))}</strong>.</p>}
        <p style={{ marginBottom: 0 }}>{u.citiesLine(cities.join(", "))}</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.history}</h2>
        {(c.history[l] ?? c.history.en ?? []).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
      </div>
      <Extra c={c} l={l} where={where} part="guide" />
      <Docs l={l} where={where} eu={c.eu} icr={c.icr ? tx(c.icr, l) : null} />
      <Extra c={c} l={l} where={where} part="after" />
      <Sources l={l} links={c.records} title={u.records} />
      {(regions.length > 0 || themes.length > 0) && (
        <div className="card" id="regiuni">
          <h2 style={{ marginTop: 0 }}>{u.related}</h2>
          {regions.length > 0 && <ul className="hub-list hub-cols">{regions.filter(regionIndexable).map((r) => <li key={r.slug}><Link href={href(entryOf(regionPath(r)))}>{tx(r.name, l)}</Link></li>)}</ul>}
          {themes.length > 0 && <ul className="hub-list">{themes.map((t) => <li key={t.slug}><Link href={href(entryOf(themePath(t)))}>{tx(t.name, l)}</Link></li>)}</ul>}
        </div>
      )}
    </>
  );
}

function RegionBody({ r, c, l, href }: { r: Region; c: Country; l: Lang; href: Href }) {
  const u = UI[l];
  const where = tx(r.where, l);
  // Propozițiile scurte de la sfârșit (sub 25 de cuvinte) se lipesc de paragraful dinainte, ca textul să curgă.
  const notes = (r.notes[l] ?? r.notes.en ?? []).reduce<string[]>((a, p) => {
    if (a.length && p.split(/\s+/).length < 25) a[a.length - 1] += ` ${p}`; else a.push(p);
    return a;
  }, []);
  const ex = EXTRA[c.slug], x = XUI[l];
  const missions = r.mission && ex && x ? ex.missions.filter((m) => r.mission!.includes(m.city)) : [];
  const parent = r.parent ? regionsOf(r.country).find((x) => x.slug === r.parent) : null;
  const siblings = regionsOf(r.country).filter((x) => x !== r && regionIndexable(x) && (x.kind === r.kind || x.slug === r.parent || x.parent === r.slug)).slice(0, 12);
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{c.flag} {titleOf(entryOf(regionPath(r)), l).replace(/ \| Cartea Neamului$/, "")}</h1>
        {r.cities?.length ? <p>{u.citiesLine(r.cities.join(", "))}</p> : null}
        {notes.length ? notes.map((p) => <p key={p.slice(0, 40)}>{p}</p>) : <p>{u.regionThin}</p>}
        <p className="muted" style={{ marginBottom: 0 }}>
          <Link href={href(entryOf(countryPath(c)))}>{tx(c.name, l)}</Link>
          {parent && <> · <Link href={href(entryOf(regionPath(parent)))}>{tx(parent.name, l)}</Link></>}
        </p>
      </div>
      {missions.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{x!.missions}</h2>
          <ul className="hub-list">
            {missions.map((m) => (
              <li key={m.kind + m.city}>
                <strong>{x!.kind[m.kind]} · {m.city}</strong>
                {m.address && <><br /><span>{m.address}</span></>}
                {m.url && <><br /><a href={m.url} rel="noopener" target="_blank">{m.url.replace(/^https:\/\//, "")}</a></>}
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginBottom: 0 }}>{x!.missionsNote(VERIFIED_ON)} <a href={ex!.missionsSource.url} rel="noopener" target="_blank">{ex!.missionsSource.name}</a>.</p>
        </div>
      )}
      <Guides slugs={r.guides} l={l} />
      <Docs l={l} where={where} eu={c.eu} icr={null} />
      <Sources l={l} links={c.records} title={u.records} />
      {siblings.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{u.related}</h2>
          <ul className="hub-list hub-cols">{siblings.map((x) => <li key={x.slug}><Link href={href(entryOf(regionPath(x)))}>{tx(x.name, l)}</Link></li>)}</ul>
        </div>
      )}
    </>
  );
}

function ThemeBody({ t, l, href }: { t: Theme; l: Lang; href: Href }) {
  const u = UI[l];
  const body = t.body[l] ?? t.body.en ?? [];
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{tx(t.name, l)}</h1>
        <p style={{ marginBottom: 0 }}>{tx(t.description, l)}</p>
      </div>
      {body.map((s) => (
        <div className="card" key={s.h}>
          <h2 style={{ marginTop: 0 }}>{s.h}</h2>
          {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>
      ))}
      <Guides slugs={t.guides} l={l} />
      <Sources l={l} links={[...t.records, ...ROMANIA_LINKS.slice(0, 2)]} title={u.sources} />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{u.related}</h2>
        <ul className="hub-list">
          {t.related.map((slug) => COUNTRIES.find((c) => c.slug === slug)).filter(Boolean).map((c) => <li key={c!.slug}><Link href={href(entryOf(countryPath(c!)))}>{c!.flag} {tx(c!.name, l)}</Link></li>)}
          {THEMES.filter((x) => x !== t).map((x) => <li key={x.slug}><Link href={href(entryOf(themePath(x)))}>{tx(x.name, l)}</Link></li>)}
        </ul>
      </div>
    </>
  );
}

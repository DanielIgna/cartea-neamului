import Link from "next/link";
import SiteSearch from "@/components/continut/SiteSearch";
import { BYLINE, ORG, pageCardUrl } from "@/lib/seo/organizatie";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { images } from "@/lib/continut/markdown";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import HubSearch from "@/components/continut/HubSearch";
import Pager from "@/components/continut/Pager";
import Prose from "@/components/continut/Prose";
import { backlinks, getEntry, loadCollection, type Collection, type Entry } from "@/lib/continut/colectii";
import { paginate, pageHref } from "@/lib/continut/paginare";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { GUIDE_FEED_PATH } from "@/lib/continut/rss";
import { SITE_URL } from "@/lib/site-url";
import ZonaSugestii from "@/components/ZonaSugestii";

/**
 * Paginile ghidurilor (/ghid) și ale glosarului (/glosar): hubul cu listă, căutare și paginare, și pagina fiecărui ghid sau
 * termen. Aceleași componente le folosesc și paginile gata făcute pentru vizitatori (app/(public)/pub/[v]/…).
 */
const HUB = {
  ghid: {
    path: "/ghid", name: "Ghiduri",
    title: "Ghiduri de genealogie: cum îți cauți strămoșii | Cartea Neamului",
    h1: "Ghiduri de genealogie",
    description: "Ghiduri pas cu pas: registre parohiale, acte de stare civilă, recensăminte, conscripții, poze vechi, GEDCOM și interviul cu bunicii.",
    intro: "Ghiduri scrise pe înțelesul tuturor, pentru cine își caută strămoșii în România: de unde începi, ce acte ceri și de unde, cum citești registrele vechi și cum păstrezi ce găsești. Fiecare ghid trimite la termenii din glosar și la alte ghiduri înrudite.",
    search: "Caută un ghid",
  },
  glosar: {
    path: "/glosar", name: "Glosar",
    title: "Glosar de genealogie și arhivă: termeni explicați | Cartea Neamului",
    h1: "Glosar de genealogie și arhivă",
    description: "Ce înseamnă conscripție, matricolă, protopopiat, urbariu, catagrafie, naș sau spiță: termenii din registre și arhive, explicați simplu.",
    intro: "Cuvintele pe care le întâlnești în registrele vechi, în arhive și în actele de familie, explicate pe scurt. De la fiecare termen ajungi la ghidurile în care apare și la termenii apropiați.",
    search: "Caută un termen",
  },
} as const;

const DAY = (d: Date, lang: "ro" | "en" = "ro") => d.toLocaleDateString(lang === "en" ? "en-US" : "ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Etichetele paginii unui ghid în engleză (ghidurile pentru SUA și Canada, 19.11.2026); restul ghidurilor sunt în română. */
const EN = {
  label: (cat: string) => `Guide · ${cat === "Diaspora" ? "Romanian heritage" : cat}`,
  byline: (d: string, m: number) => `By the Cartea Neamului team · updated ${d} · about ${m} ${m === 1 ? "minute" : "minutes"} to read`,
  toc: "Contents", terms: "Romanian terms in this guide", related: "Related guides", all: "← All guides",
  ctaTitle: "Start your family tree", ctaText: "The first 7 days are free, no credit card required. Add your parents and grandparents, and relatives on both sides of the ocean can fill in what they know.",
};
const PUBLISHER = ORG;

export function hubMetadata(c: Collection, page: number): Metadata {
  const h = HUB[c];
  const pages = paginate(loadCollection(c), page).pages;
  // O pagină de listă care nu există dă 404 încă de aici, ca răspunsul să aibă codul corect (nu 200 cu „nu există”).
  if (page > pages) notFound();
  const base = page <= 1
    ? publicPageMetadata({ path: h.path, title: h.title, description: h.description })
    : publicPageMetadata({ path: pageHref(h.path, page), title: h.title.replace(" | ", ` – pagina ${page} | `), description: `${h.description} Pagina ${page} din ${pages}.` });
  // Ghidurile au flux RSS (/ghid/feed.xml), anunțat în <head> ca cititoarele de știri să-l găsească singure.
  if (c !== "ghid") return base;
  return { ...base, alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: GUIDE_FEED_PATH, title: "Ghiduri de genealogie – Cartea Neamului" }] } } };
}

export function HubPage({ c, page }: { c: Collection; page: number }) {
  const h = HUB[c];
  const all = loadCollection(c);
  const p = paginate(all, page);
  if (p.outOfRange) notFound();
  const groups = c === "ghid" ? [...new Set(p.items.map((e) => e.category))] : [null];
  const jsonLd = {
    "@context": "https://schema.org", "@type": c === "glosar" ? "DefinedTermSet" : "CollectionPage",
    name: h.h1, description: h.description, url: canonicalUrl(pageHref(h.path, p.page)), inLanguage: "ro",
    isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
    ...(c === "glosar"
      ? { hasDefinedTerm: p.items.map((e) => ({ "@type": "DefinedTerm", name: e.title, url: canonicalUrl(e.path) })) }
      : { mainEntity: { "@type": "ItemList", numberOfItems: all.length, itemListElement: p.items.map((e, i) => ({ "@type": "ListItem", position: (p.page - 1) * 60 + i + 1, url: canonicalUrl(e.path), name: e.title })) } }),
  };
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: h.name, path: h.path }]} />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{h.h1}</h1>
        <p>{h.intro}</p>
        <p className="muted" style={{ marginBottom: 0 }}>{all.length} {c === "ghid" ? "ghiduri" : "termeni"} · vezi și {c === "ghid" ? <Link href="/glosar">glosarul</Link> : <Link href="/ghid">ghidurile</Link>}, <Link href="/resurse-genealogie">resursele gratuite</Link></p>
        <SiteSearch />
      </div>
      <HubSearch items={all.map((e) => ({ href: e.path, title: e.title, text: c === "glosar" ? e.alt.join(", ") : undefined }))} label={h.search} placeholder={`${h.search}…`}>
        {groups.map((g) => (
          <div className="card" key={g ?? "toate"}>
            {g && <h2 style={{ marginTop: 0 }}>{g}</h2>}
            <ul className={c === "glosar" ? "hub-list hub-cols" : "hub-list"}>
              {p.items.filter((e) => !g || e.category === g).map((e) => (
                <li key={e.slug} lang={e.lang === "en" ? "en" : undefined}><Link href={e.path}>{e.title}</Link>{c === "ghid" && <span className="muted"> {e.description}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
        <Pager base={h.path} page={p.page} pages={p.pages} />
      </HubSearch>
      <CtaArbore src={c} />
    </section>
  );
}

export function entryMetadata(c: Collection, slug: string): Metadata {
  const e = getEntry(c, slug);
  if (!e) notFound();
  const m = publicPageMetadata({ path: e.path, title: e.seoTitle, description: e.description });
  // Ghidurile în engleză: previzualizarea linkului spune engleza americană (pentru SUA și Canada).
  return e.lang === "en" ? { ...m, openGraph: { ...m.openGraph, locale: "en_US" } } : m;
}

function entryJsonLd(e: Entry) {
  const url = canonicalUrl(e.path);
  if (e.collection === "glosar") {
    return {
      "@context": "https://schema.org", "@type": "DefinedTerm", name: e.title, description: e.description, url, inLanguage: "ro",
      ...(e.alt.length ? { alternateName: e.alt } : {}),
      inDefinedTermSet: { "@type": "DefinedTermSet", name: HUB.glosar.h1, url: canonicalUrl(HUB.glosar.path) },
    };
  }
  return {
    "@context": "https://schema.org", "@type": "Article", headline: e.title, description: e.description, url, inLanguage: e.lang === "en" ? "en-US" : "ro",
    mainEntityOfPage: url, datePublished: e.published.toISOString().slice(0, 10), dateModified: e.updated.toISOString().slice(0, 10),
    wordCount: e.words, image: [`${SITE_URL}${pageCardUrl(e.path) ?? "/opengraph-image.png"}`, ...images(e.blocks).map((x) => `${SITE_URL}${x.src}`)], author: PUBLISHER, publisher: PUBLISHER,
    isPartOf: { "@type": "CollectionPage", name: HUB.ghid.h1, url: canonicalUrl(HUB.ghid.path) },
  };
}

export function EntryPage({ c, slug }: { c: Collection; slug: string }) {
  const e = getEntry(c, slug);
  if (!e) notFound();
  const h = HUB[c];
  const guides = loadCollection("ghid");
  const terms = loadCollection("glosar");
  const back = backlinks(e.path);
  // Ghidurile înrudite: cele alese în fișier, apoi cele care trimit aici, apoi din aceeași grupă (cel mult 6).
  const relGuides = [...new Map([
    ...e.related.map((s) => guides.find((g) => g.slug === s)),
    ...back.filter((b) => b.collection === "ghid"),
    ...(c === "ghid" ? guides.filter((g) => g.category === e.category) : []),
  ].filter((g): g is Entry => !!g && g.path !== e.path).map((g) => [g.path, g])).values()].slice(0, 6);
  const relTerms = [...new Map([
    ...e.terms.map((s) => terms.find((t) => t.slug === s)),
    ...back.filter((b) => b.collection === "glosar"),
  ].filter((t): t is Entry => !!t && t.path !== e.path).map((t) => [t.path, t])).values()].slice(0, 12);
  const toc = e.blocks.filter((b) => b.t === "h2");
  const minutes = Math.max(1, Math.round(e.words / 200));
  const en = e.lang === "en";
  return (
    <section className="stack content-page" lang={en ? "en" : "ro"}>
      <JsonLd data={entryJsonLd(e)} />
      <Breadcrumbs items={[{ name: h.name, path: h.path }, { name: e.title, path: e.path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{c === "ghid" ? (en ? EN.label(e.category) : `Ghid · ${e.category}`) : "Glosar"}</div>
        <h1>{e.title}</h1>
        {c === "glosar" && e.alt.length > 0 && <p className="muted">Se mai spune: {e.alt.join(", ")}</p>}
        <p className="lead">{e.description}</p>
        {c === "ghid" && <p className="muted small">{en ? EN.byline(DAY(e.updated, "en"), minutes) : <>De {BYLINE} · actualizat la {DAY(e.updated)} · cam {minutes} {minutes === 1 ? "minut" : "minute"} de citit</>}</p>}
        {c === "ghid" && toc.length >= 3 && (
          <nav className="toc" aria-label={en ? EN.toc : "Cuprins"}>
            <b>{en ? EN.toc : "Cuprins"}</b>
            <ol>{toc.map((b) => "id" in b && <li key={b.id}><a href={`#${b.id}`}>{b.v}</a></li>)}</ol>
          </nav>
        )}
        <Prose blocks={e.blocks} />
      </article>
      {relTerms.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{c === "ghid" ? (en ? EN.terms : "Termeni din acest ghid") : "Termeni apropiați"}</h2>
          <div className="chips">{relTerms.map((t) => <Link key={t.path} className="chip" href={t.path}>{t.title}</Link>)}</div>
        </div>
      )}
      {relGuides.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{c === "ghid" ? (en ? EN.related : "Ghiduri înrudite") : "Ghiduri în care apare"}</h2>
          <ul className="hub-list">{relGuides.map((g) => <li key={g.path}><Link href={g.path}>{g.title}</Link> <span className="muted">{g.description}</span></li>)}</ul>
        </div>
      )}
      {/* Pentru cine citește din SUA sau Canada (și, curând, din Europa): pagina zonei lui și ghiduri potrivite. */}
      {c === "ghid" && <ZonaSugestii locale={en ? "en-US" : "ro"} />}
      {en ? <CtaArbore src={`${c}-${e.slug}`} title={EN.ctaTitle} text={EN.ctaText} /> : <CtaArbore src={`${c}-${e.slug}`} />}
      <p className="muted small" style={{ textAlign: "center" }}><Link href={h.path}>{en ? EN.all : `← Toate ${c === "ghid" ? "ghidurile" : "termenii din glosar"}`}</Link></p>
    </section>
  );
}

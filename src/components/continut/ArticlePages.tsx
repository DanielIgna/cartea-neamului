import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import HubSearch from "@/components/continut/HubSearch";
import Pager from "@/components/continut/Pager";
import Prose from "@/components/continut/Prose";
import { backlinks, getEntry, loadCollection, type Collection, type Entry } from "@/lib/continut/colectii";
import { paginate, pageHref } from "@/lib/continut/paginare";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";

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

const DAY = (d: Date) => d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const PUBLISHER = { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` } };

export function hubMetadata(c: Collection, page: number): Metadata {
  const h = HUB[c];
  const pages = paginate(loadCollection(c), page).pages;
  // O pagină de listă care nu există dă 404 încă de aici, ca răspunsul să aibă codul corect (nu 200 cu „nu există”).
  if (page > pages) notFound();
  if (page <= 1) return publicPageMetadata({ path: h.path, title: h.title, description: h.description });
  return publicPageMetadata({ path: pageHref(h.path, page), title: h.title.replace(" | ", ` – pagina ${page} | `), description: `${h.description} Pagina ${page} din ${pages}.` });
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
      </div>
      <HubSearch items={all.map((e) => ({ href: e.path, title: e.title, text: c === "glosar" ? e.alt.join(", ") : undefined }))} label={h.search} placeholder={`${h.search}…`}>
        {groups.map((g) => (
          <div className="card" key={g ?? "toate"}>
            {g && <h2 style={{ marginTop: 0 }}>{g}</h2>}
            <ul className={c === "glosar" ? "hub-list hub-cols" : "hub-list"}>
              {p.items.filter((e) => !g || e.category === g).map((e) => (
                <li key={e.slug}><Link href={e.path}>{e.title}</Link>{c === "ghid" && <span className="muted"> {e.description}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
        <Pager base={h.path} page={p.page} pages={p.pages} />
      </HubSearch>
      <CtaArbore />
    </section>
  );
}

export function entryMetadata(c: Collection, slug: string): Metadata {
  const e = getEntry(c, slug);
  if (!e) notFound();
  return publicPageMetadata({ path: e.path, title: e.seoTitle, description: e.description });
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
    "@context": "https://schema.org", "@type": "Article", headline: e.title, description: e.description, url, inLanguage: "ro",
    mainEntityOfPage: url, datePublished: e.published.toISOString().slice(0, 10), dateModified: e.updated.toISOString().slice(0, 10),
    wordCount: e.words, image: `${SITE_URL}/opengraph-image.png`, author: PUBLISHER, publisher: PUBLISHER,
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
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={entryJsonLd(e)} />
      <Breadcrumbs items={[{ name: h.name, path: h.path }, { name: e.title, path: e.path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>{c === "ghid" ? `Ghid · ${e.category}` : "Glosar"}</div>
        <h1>{e.title}</h1>
        {c === "glosar" && e.alt.length > 0 && <p className="muted">Se mai spune: {e.alt.join(", ")}</p>}
        <p className="lead">{e.description}</p>
        {c === "ghid" && <p className="muted small">Actualizat la {DAY(e.updated)} · cam {minutes} {minutes === 1 ? "minut" : "minute"} de citit</p>}
        {c === "ghid" && toc.length >= 3 && (
          <nav className="toc" aria-label="Cuprins">
            <b>Cuprins</b>
            <ol>{toc.map((b) => "id" in b && <li key={b.id}><a href={`#${b.id}`}>{b.v}</a></li>)}</ol>
          </nav>
        )}
        <Prose blocks={e.blocks} />
      </article>
      {relTerms.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{c === "ghid" ? "Termeni din acest ghid" : "Termeni apropiați"}</h2>
          <div className="chips">{relTerms.map((t) => <Link key={t.path} className="chip" href={t.path}>{t.title}</Link>)}</div>
        </div>
      )}
      {relGuides.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{c === "ghid" ? "Ghiduri înrudite" : "Ghiduri în care apare"}</h2>
          <ul className="hub-list">{relGuides.map((g) => <li key={g.path}><Link href={g.path}>{g.title}</Link> <span className="muted">{g.description}</span></li>)}</ul>
        </div>
      )}
      <CtaArbore />
      <p className="muted small" style={{ textAlign: "center" }}><Link href={h.path}>← Toate {c === "ghid" ? "ghidurile" : "termenii din glosar"}</Link></p>
    </section>
  );
}

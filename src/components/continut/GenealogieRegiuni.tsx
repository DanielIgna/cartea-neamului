import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore, { CtaSus } from "@/components/continut/CtaArbore";
import { getEntry } from "@/lib/continut/colectii";
import { countyPath, getCounty, isCapital } from "@/lib/continut/localitati";
import { namesInRegion } from "@/lib/continut/nume";
import { GEN_CITIES, GEN_HUB, genCityPath } from "@/lib/genealogie-orase";
import { GEN_REGIONS, genRegionPath, getGenRegion } from "@/lib/genealogie-regiuni";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";

/** /genealogie/regiune/<slug>: cum îți cauți strămoșii într-o regiune istorică (text în src/lib/genealogie-regiuni.ts). */
export function genealogieRegionMetadata(slug: string): Metadata {
  const r = getGenRegion(slug);
  if (!r) notFound();
  return publicPageMetadata({ path: genRegionPath(r), title: `${r.title} | Cartea Neamului`, description: r.description });
}

export function GenealogieRegion({ slug }: { slug: string }) {
  const r = getGenRegion(slug);
  if (!r) notFound();
  const path = genRegionPath(r);
  const counties = r.counties.map((c) => getCounty(c)).filter((c) => !!c);
  const cities = GEN_CITIES.filter((c) => c.region === r.slug || r.counties.includes(c.county));
  const names = r.nameRegion ? namesInRegion(r.nameRegion).slice(0, 18) : [];
  // FamilySearch e util în toate regiunile (planul SEO, etapa 4): ghidul lui apare pe fiecare pagină regională.
  const guides = [...new Set([...r.guides, "familysearch-pentru-romania"])].map((g) => getEntry("ghid", g)).filter((g) => !!g);
  const others = GEN_REGIONS.filter((x) => x.slug !== r.slug);
  const src = `regiune-${r.slug}`;
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: r.title, description: r.description,
        url: canonicalUrl(path), inLanguage: "ro", dateModified: "2026-11-17",
        author: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL }, publisher: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
        about: { "@type": "Place", name: r.name, alternateName: r.oldNames.map((n) => n.replace(/\s*\(.*\)$/, "")) },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: r.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <Breadcrumbs items={[{ name: "Genealogie", path: GEN_HUB }, { name: r.name, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>Regiune istorică</div>
        <h1>{r.h1}</h1>
        <p className="lead">{r.lead}</p>
        <div className="facts">
          <div><b>În actele vechi</b>{r.oldNames.join(" · ")}</div>
          {counties.length > 0 && <div><b>Județe de azi</b>{counties.map((c, i) => <span key={c.slug}>{i ? ", " : ""}<Link href={countyPath(c)}>{isCapital(c) ? "București" : c.name}</Link></span>)}</div>}
        </div>
        <CtaSus src={src} />
        {r.body.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </div>
        ))}
        {cities.length > 0 && (
          <>
            <h2>Orașe mari din regiune</h2>
            <ul className="hub-list hub-cols">{cities.map((c) => <li key={c.slug}><Link href={genCityPath(c)}>Genealogie în {c.name}</Link></li>)}</ul>
          </>
        )}
        {counties.length > 0 && (
          <>
            <h2>Arhivele județelor</h2>
            <p>Fiecare județ are pagina lui, cu serviciul Arhivelor Naționale care păstrează registrele vechi și cu comunele și orașele lui.</p>
            <ul className="hub-list hub-cols">{counties.map((c) => <li key={c.slug}><Link href={countyPath(c)}>{isCapital(c) ? "București" : `Județul ${c.name}`}</Link></li>)}</ul>
          </>
        )}
        {names.length > 0 && (
          <>
            <h2>Nume de familie des întâlnite</h2>
            <p>{r.slug === "basarabia" ? "Nume frecvente în Moldova de ambele părți ale Prutului." : `Nume care apar mai des ${r.name === "Banat" ? "în Banat" : `în ${r.name}`}.`} Fiecare are pagina lui, cu originea și variantele de scriere.</p>
            <div className="chips">{names.map((n) => <Link key={n.slug} className="chip" href={`/nume/${n.slug}`}>{n.name}</Link>)}</div>
          </>
        )}
        {guides.length > 0 && (
          <>
            <h2>Ghiduri utile pentru {r.name}</h2>
            <ul>{guides.map((g) => <li key={g.slug}><Link href={g.path}>{g.title}</Link></li>)}</ul>
          </>
        )}
        <h2>Întrebări frecvente</h2>
        {r.faq.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </article>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Alte regiuni</h2>
        <div className="chips">{others.map((x) => <Link key={x.slug} className="chip" href={genRegionPath(x)}>{x.name}</Link>)}</div>
      </div>
      <CtaArbore title="Fă-ți arborele familiei gratuit 7 zile, fără card" text="Adaugi părinții și bunicii, iar rudele pot completa ce știu ele." src={src} />
      <p className="muted small" style={{ textAlign: "center" }}><Link href={GEN_HUB}>← Genealogie pe orașe și regiuni</Link></p>
    </section>
  );
}

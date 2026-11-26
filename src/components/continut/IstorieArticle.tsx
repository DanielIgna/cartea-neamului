import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/continut/Prose";
import type { Block } from "@/lib/continut/markdown";
import { ARTICOLE, articolBlocks, articolPath, getArticol } from "@/lib/istorie/articole";
import { canonicalUrl, publicPageMetadata } from "@/lib/page-metadata";
import { BYLINE, ORG } from "@/lib/seo/organizatie";

const day = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function istorieMetadata(slug: string): Metadata {
  const a = getArticol(slug);
  return publicPageMetadata({ path: articolPath(slug), title: a.title, description: a.description });
}

/**
 * Un articol din seria „Vremuri grele” (/istoria-umanitatii/<slug>). `fila` = fila pentru cei cu cont, pusă printre rânduri
 * (src/lib/istorie/file.ts); paginile publice gata făcute pentru vizitatori și roboți o primesc goală.
 */
export default function IstorieArticle({ slug, fila }: { slug: string; fila: Block[] | null }) {
  const a = getArticol(slug);
  const { before, after } = articolBlocks(a);
  const toc = [...before, ...(fila ?? []), ...after].filter((b) => b.t === "h2");
  const path = articolPath(slug);
  const url = canonicalUrl(path);
  const hasFila = a.text.includes("\n[[fila]]\n");
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: a.h1, description: a.description, url, mainEntityOfPage: url,
        inLanguage: "ro", datePublished: a.updated, dateModified: a.updated, author: ORG, publisher: ORG,
      }} />
      <Breadcrumbs items={[{ name: "Istoria umanității", path: "/istoria-umanitatii" }, { name: a.label, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>Istoria umanității · Vremuri grele</div>
        <h1>{a.h1}</h1>
        <p className="lead">{a.description}</p>
        <p className="muted small">De {BYLINE} · actualizat la {day(a.updated)}</p>
        {toc.length >= 3 && (
          <nav className="toc" aria-label="Cuprins">
            <b>Cuprins</b>
            <ol>{toc.map((b) => "id" in b && <li key={b.id}><a href={`#${b.id}`}>{b.v}</a></li>)}</ol>
          </nav>
        )}
        <Prose blocks={before} />
        {fila && <Prose blocks={fila} />}
        <Prose blocks={after} />
        {hasFila && !fila && <p className="muted small">Cine are cont pe Cartea Neamului găsește în această pagină și o filă în plus. <Link href={`/intrare?next=${encodeURIComponent(path)}`}>Intră în cont</Link></p>}
      </article>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vremuri grele: toată seria</h2>
        <ul className="hub-list">
          {ARTICOLE.map((x) => (
            <li key={x.slug}>{x.slug === slug ? <b>{x.label}</b> : <Link href={articolPath(x.slug)}>{x.label}</Link>} <span className="muted">{x.short}</span></li>
          ))}
        </ul>
      </div>
      <CtaArbore src={`istorie-${slug}`} />
      <p className="muted small" style={{ textAlign: "center" }}><Link href="/istoria-umanitatii">← Istoria umanității pe o axă</Link></p>
    </section>
  );
}

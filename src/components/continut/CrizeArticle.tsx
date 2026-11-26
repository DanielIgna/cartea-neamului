import Link from "next/link";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/continut/Prose";
import type { Block } from "@/lib/continut/markdown";
import { CRIZE, CRIZE_BLOCKS } from "@/lib/istorie/crize";
import { canonicalUrl } from "@/lib/page-metadata";
import { BYLINE, ORG } from "@/lib/seo/organizatie";

const DAY = new Date(`${CRIZE.updated}T00:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * „Crizele care au schimbat lumea” (/istoria-umanitatii/crize). `fila` = fila pentru cei cu cont, pusă printre rânduri; pagina
 * publică (gata făcută pentru vizitatori și roboți) o primește goală.
 */
export default function CrizeArticle({ fila }: { fila: Block[] | null }) {
  const { before, after } = CRIZE_BLOCKS;
  const toc = [...before, ...(fila ?? []), ...after].filter((b) => b.t === "h2");
  const url = canonicalUrl(CRIZE.path);
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: CRIZE.h1, description: CRIZE.description, url, mainEntityOfPage: url,
        inLanguage: "ro", datePublished: CRIZE.updated, dateModified: CRIZE.updated, author: ORG, publisher: ORG,
      }} />
      <Breadcrumbs items={[{ name: "Istoria umanității", path: "/istoria-umanitatii" }, { name: "Crizele care au schimbat lumea", path: CRIZE.path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>Istoria umanității · Vremuri grele</div>
        <h1>{CRIZE.h1}</h1>
        <p className="lead">{CRIZE.description}</p>
        <p className="muted small">De {BYLINE} · actualizat la {DAY}</p>
        <nav className="toc" aria-label="Cuprins">
          <b>Cuprins</b>
          <ol>{toc.map((b) => "id" in b && <li key={b.id}><a href={`#${b.id}`}>{b.v}</a></li>)}</ol>
        </nav>
        <Prose blocks={before} />
        {fila && <Prose blocks={fila} />}
        <Prose blocks={after} />
        {!fila && <p className="muted small">Cine are cont pe Cartea Neamului găsește în această pagină și o filă în plus. <Link href="/intrare?next=%2Fistoria-umanitatii%2Fcrize">Intră în cont</Link></p>}
      </article>
      <CtaArbore src="crize" />
      <p className="muted small" style={{ textAlign: "center" }}><Link href="/istoria-umanitatii">← Istoria umanității pe o axă</Link></p>
    </section>
  );
}

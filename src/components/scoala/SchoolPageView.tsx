import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import { CtaSus } from "@/components/continut/CtaArbore";
import SchoolRequestForm from "./SchoolRequestForm";
import { KIT, SCHOOL_PAGES, SHEETS, type SchoolPage } from "@/lib/scoala";
import { canonicalUrl } from "@/lib/page-metadata";

/** O pagină din secțiunea pentru școli: textul, fișele de descărcat, kitul și (pe /scoala) formularul pentru coduri. */
export default function SchoolPageView({ page }: { page: SchoolPage }) {
  const hub = page.slug === "";
  const sheets = page.sheets.map((s) => SHEETS.find((x) => x.slug === s)!);
  const others = SCHOOL_PAGES.filter((p) => p.slug !== page.slug);
  return (
    <section className="stack content-page school-page" lang="ro">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: page.h1, description: page.description, inLanguage: "ro", url: canonicalUrl(page.path),
        author: { "@type": "Organization", name: "Cartea Neamului" }, publisher: { "@type": "Organization", name: "Cartea Neamului" }, datePublished: "2026-11-17", dateModified: "2026-11-17" }} />
      <Breadcrumbs items={hub ? [{ name: "Pentru școală", path: "/scoala" }] : [{ name: "Pentru școală", path: "/scoala" }, { name: page.h1.split(" – ")[1] ?? page.h1, path: page.path }]} />
      <article className="card prose">
        <h1>{page.h1}</h1>
        <p className="lead">{page.lead}</p>
        <p className="cta-top"><a className="btn primary" href="#fise">Descarcă fișele gratuite ↓</a><small className="muted">PDF, fără cont</small></p>
        {page.blocks.map((b) => (
          <div key={b.h2}>
            <h2>{b.h2}</h2>
            {b.p?.map((x) => <p key={x}>{x}</p>)}
            {b.ul && <ul>{b.ul.map((x) => <li key={x}>{x}</li>)}</ul>}
            {b.ol && <ol>{b.ol.map((x) => <li key={x}>{x}</li>)}</ol>}
          </div>
        ))}
      </article>

      <div className="card" id="fise">
        <h2 style={{ marginTop: 0 }}>Fișe gratuite de descărcat</h2>
        <div className="sheet-grid">
          {sheets.map((s) => (
            <div key={s.slug} className="sheet-card">
              <b>{s.title}</b>
              <span className="muted">{s.what}</span>
              <small className="muted">Pentru {s.forWhom}</small>
              <div className="actions">
                <a className="btn primary" href={s.pdf} download>Descarcă PDF</a>
                <Link className="btn" href={`/scoala/fisa/${s.slug}`}>Completează online</Link>
              </div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>PDF-ul se descarcă fără cont. Completarea pe ecran, cu tipărire după, cere un cont (7 zile gratuite, fără card).</p>
      </div>

      {hub && (
        <div className="card" id="kit">
          <h2 style={{ marginTop: 0 }}>Kit pentru învățători</h2>
          <div className="sheet-grid">
            {[KIT.classSheet, KIT.parentLetter].map((k) => (
              <div key={k.pdf} className="sheet-card">
                <b>{k.title}</b><span className="muted">{k.what}</span>
                <div className="actions"><a className="btn primary" href={k.pdf} download>PDF</a><a className="btn" href={k.docx} download>Word</a></div>
              </div>
            ))}
          </div>
          <h3>Vreau coduri pentru clasa mea</h3>
          <p className="muted">Pentru clasele care își fac arborele și online, cu familia: după ce confirmăm cu conducerea școlii, primiți un cod de reducere pentru elevii clasei.</p>
          <SchoolRequestForm />
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Arborele făcut online, tipărit pentru școală</h2>
        <p>Familia completează arborele împreună, fiecare ce știe, iar copilul îl tipărește pe A4 sau A3, cu un desen curat, cu butonul „Printează pentru proiectul de la școală”.</p>
        <CtaSus label="Începe arborele familiei" />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Întrebări frecvente</h2>
        {page.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </div>

      <nav className="card" aria-label="Vezi și">
        <h2 style={{ marginTop: 0 }}>Vezi și</h2>
        <ul>
          {others.map((p) => <li key={p.path}><Link href={p.path}>{p.h1}</Link></li>)}
          <li><Link href="/ghid">Ghiduri de genealogie</Link></li>
          <li><Link href="/glosar">Glosarul cuvintelor de rudenie și de arhivă</Link></li>
        </ul>
      </nav>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CopyLink from "@/components/admin/CopyLink";
import { publicPageMetadata, canonicalUrl } from "@/lib/page-metadata";
import { LINK_KITS, LINK_PAGE as page, type LinkKit } from "@/lib/autoritate";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = publicPageMetadata({ path: page.path, title: page.title, description: page.description });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
/** Codul HTML al unui link: o ancoră simplă, fără nimic ascuns și fără „nofollow” impus (alege site-ul care îl pune). */
const snippet = (k: LinkKit) => `<a href="${SITE_URL}${k.path}" lang="${k.lang ?? "ro"}">${esc(k.ancora)}</a> – ${esc(k.descriere)}`;
const badge = (file: string, alt: string) => `<a href="${SITE_URL}/resurse-genealogie"><img src="${SITE_URL}/insigna/${file}" width="250" height="60" alt="${esc(alt)}"></a>`;
const YEAR = new Date().getFullYear();

const FAQ = [
  { q: "Costă ceva să puneți un link?", a: "Nu. Toate paginile de aici sunt gratuite și se citesc fără cont. Nu cerem nimic în schimb și nu facem schimb de linkuri." },
  { q: "Putem copia textele ghidurilor pe site-ul nostru?", a: "Vă rugăm să nu copiați ghidurile întregi; puneți un rezumat scurt, în cuvintele voastre, și linkul spre pagină. Fișele pentru școală se pot tipări și împărți liber elevilor." },
  { q: "Am găsit o greșeală într-o pagină despre satul nostru.", a: "Scrieți-ne la contact@carteaneamului.ro. Corectăm repede și, dacă vreți, vă trecem ca sursă." },
];

/** /link-spre-noi: textul și codul gata de lipit pentru cine vrea să trimită cititorii spre resursele gratuite (src/lib/autoritate.ts). */
export default function LinkPage() {
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: page.h1, description: page.description, url: canonicalUrl(page.path), inLanguage: "ro" }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <Breadcrumbs items={[{ name: "Link spre noi", path: page.path }]} />
      <article className="card prose">
        <h1>{page.h1}</h1>
        <p className="lead">Dacă aveți un site de școală, de bibliotecă, de primărie, de asociație sau un blog, aici găsiți linkurile cele mai utile pentru cititorii voștri, cu textul deja scris. Copiați codul și lipiți-l în pagina de resurse.</p>
        <p>Tot ce e mai jos e gratuit și se citește fără cont: <Link href="/ghid">ghidurile</Link>, <Link href="/surse-publice">sursele publice</Link>, <Link href="/scoala">fișele pentru școală</Link>, paginile de <Link href="/localitati">localități</Link>, de <Link href="/nume">nume de familie</Link> și de <Link href="/diaspora">diaspora</Link>.</p>

        <h2>Alegeți ce se potrivește site-ului vostru</h2>
        {LINK_KITS.map((k) => (
          <div key={k.id} id={k.id} style={{ marginBottom: 18 }}>
            <h3>{k.cui}</h3>
            <p>{k.deCe} Pagina: <a href={k.path} lang={k.lang}>{SITE_URL.replace(/^https?:\/\//, "")}{k.path}</a></p>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, userSelect: "all" }}>{snippet(k)}</pre>
            <CopyLink url={snippet(k)} label="Copiază codul" />
          </div>
        ))}

        <h2>Insigne</h2>
        <p>O insignă mică, pentru bara laterală sau subsolul site-ului. Duce spre <Link href="/resurse-genealogie">resursele gratuite de genealogie</Link>.</p>
        {[{ f: "cartea-neamului.svg", alt: "Cartea Neamului: resurse gratuite de genealogie" }, { f: "cartea-neamului-inchis.svg", alt: "Cartea Neamului: resurse gratuite de genealogie" }, { f: "family-book-en.svg", alt: "Cartea Neamului: free Romanian genealogy guides" }].map((b) => (
          <div key={b.f} style={{ marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/insigna/${b.f}`} width={250} height={60} alt={b.alt} />
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, userSelect: "all" }}>{badge(b.f, b.alt)}</pre>
            <CopyLink url={badge(b.f, b.alt)} label="Copiază codul" />
          </div>
        ))}

        <h2>Cum ne citați</h2>
        <p>Pentru lucrări școlare, monografii sau articole, puteți cita o pagină așa:</p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, userSelect: "all" }}>{`Cartea Neamului (${YEAR}). „Titlul paginii”. ${SITE_URL}/ghid/... Accesat la [data].`}</pre>
        <p>Pentru familiile care au un blog există și widgetul gratuit <Link href="/arborele-meu">„Arborele meu”</Link>, iar jurnaliștii găsesc date și sigle pe <Link href="/presa">pagina de presă</Link>.</p>

        <h2>Întrebări</h2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
        <p>V-ați pus un link spre noi? Spuneți-ne la <a href="mailto:contact@carteaneamului.ro">contact@carteaneamului.ro</a> și vă mulțumim cum se cuvine.</p>
      </article>
    </section>
  );
}

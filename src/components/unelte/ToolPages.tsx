import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import CtaArbore from "@/components/continut/CtaArbore";
import KinCalc from "@/components/unelte/KinCalc";
import GenCalc from "@/components/unelte/GenCalc";
import PrintableTree from "@/components/unelte/PrintableTree";
import PrintButton from "@/components/unelte/PrintButton";
import { getEntry } from "@/lib/continut/colectii";
import { canonicalUrl } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import { lastmodOf } from "@/lib/seo/versiuni";
import { grandparentQuestions } from "@/lib/unelte/intrebari";
import { KIN_CALC, KIN_PAGES, TOOLS_HUB, TOOLS_UPDATED, getKinPage, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { TOOLS, TOOLS_DESCRIPTION, TOOLS_TITLE, getTool, toolPath, type Tool } from "@/lib/unelte/unelte";

/** Secțiunea /unelte: hubul, cele 4 unelte și paginile despre relațiile de rudenie. Doar în română, fără cont. */
const day = (path: string) => lastmodOf(path, TOOLS_UPDATED).toISOString().slice(0, 10);
const org = { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL };
const faqLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

function Faq({ faq }: { faq: { q: string; a: string }[] }) {
  return (
    <div className="card no-print">
      <h2 style={{ marginTop: 0 }}>Întrebări frecvente</h2>
      {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
    </div>
  );
}

const GUIDES: Record<string, string[]> = {
  "calculator-grad-de-rudenie": ["grade-de-rudenie", "nasii-si-rudenia-spirituala", "ce-este-spita-neamului"],
  "arbore-printabil": ["cum-incepi-arborele-genealogic", "intrebari-pentru-bunici", "cum-implici-familia"],
  "intrebari-pentru-bunici-pdf": ["intrebari-pentru-bunici", "cum-intervievezi-bunicii", "cum-inregistrezi-glasul-bunicilor"],
  "calculator-generatii": ["registrele-de-stare-civila", "cum-organizezi-cercetarea", "recensamintele-vechi"],
};

function Guides({ slugs }: { slugs: string[] }) {
  const gs = slugs.map((s) => getEntry("ghid", s)).filter((g) => !!g);
  if (!gs.length) return null;
  return (
    <div className="card no-print">
      <h2 style={{ marginTop: 0 }}>Ghiduri potrivite</h2>
      <ul className="hub-list">{gs.map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link> <span className="muted">{g!.description}</span></li>)}</ul>
    </div>
  );
}

export function ToolsHub() {
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: TOOLS_TITLE, description: TOOLS_DESCRIPTION, url: canonicalUrl(TOOLS_HUB), inLanguage: "ro",
        isPartOf: { "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL },
        mainEntity: { "@type": "ItemList", itemListElement: [...TOOLS.map((t) => ({ url: canonicalUrl(toolPath(t)), name: t.name })), ...KIN_PAGES.map((p) => ({ url: canonicalUrl(kinPagePath(p)), name: p.name }))].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) },
      }} />
      <Breadcrumbs items={[{ name: "Unelte gratuite", path: TOOLS_HUB }]} />
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Unelte gratuite de genealogie</h1>
        <p>Unelte mici, care merg fără cont și fără să trimiți ceva: afli cum se numește o rudă și ce grad are, tipărești un arbore gol de completat cu bunicii, iei cu tine întrebările pentru ei și estimezi în ce ani s-au născut strămoșii.</p>
      </div>
      <div className="card">
        <ul className="hub-list">{TOOLS.map((t) => <li key={t.slug}><Link href={toolPath(t)}><b>{t.name}</b></Link> <span className="muted">{t.description}</span></li>)}</ul>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cum se numește ruda mea?</h2>
        <p>Relațiile despre care se întreabă cel mai des, explicate pe înțeles, cu gradul lor:</p>
        <div className="chips">{KIN_PAGES.map((p) => <Link key={p.slug} className="chip" href={kinPagePath(p)}>{p.name}</Link>)}</div>
      </div>
      <p className="muted small">Pentru proiectele de la școală, vezi și <Link href="/scoala">paginile pentru școli</Link>.</p>
      <CtaArbore src="unelte" />
    </section>
  );
}

function ToolBody({ t }: { t: Tool }) {
  switch (t.slug) {
    case "calculator-grad-de-rudenie": return <KinCalc />;
    case "calculator-generatii": return <GenCalc />;
    case "arbore-printabil": return <div className="card"><PrintableTree /></div>;
    case "intrebari-pentru-bunici-pdf": {
      const themes = grandparentQuestions();
      let n = 0;
      return (
        <div className="card qsheet">
          <p className="no-print"><PrintButton /></p>
          <h2 style={{ marginTop: 0 }}>Întrebări pentru bunici</h2>
          {themes.map((th) => (
            <div key={th.theme}>
              <h3>{th.theme}</h3>
              <ol start={n + 1}>{th.questions.map((q) => { n++; return <li key={q}>{q}<span className="q-lines" aria-hidden="true" /></li>; })}</ol>
            </div>
          ))}
          <p className="muted small">carteaneamului.ro</p>
        </div>
      );
    }
    default: return null;
  }
}

export function ToolPage({ slug }: { slug: string }) {
  const t = getTool(slug);
  if (!t) notFound();
  const path = toolPath(t);
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication", name: t.name, description: t.description, url: canonicalUrl(path), inLanguage: "ro",
        applicationCategory: "ReferenceApplication", operatingSystem: "Orice browser", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RON" },
        dateModified: day(path), publisher: org,
      }} />
      <JsonLd data={faqLd(t.faq)} />
      <Breadcrumbs items={[{ name: "Unelte gratuite", path: TOOLS_HUB }, { name: t.name, path }]} />
      <div className="card no-print">
        <h1 style={{ marginTop: 0 }}>{t.h1}</h1>
        <p style={{ marginBottom: 0 }}>{t.lead}</p>
      </div>
      <ToolBody t={t} />
      {t.slug === "calculator-grad-de-rudenie" && (
        <div className="card no-print">
          <h2 style={{ marginTop: 0 }}>Relațiile explicate</h2>
          <div className="chips">{KIN_PAGES.map((p) => <Link key={p.slug} className="chip" href={kinPagePath(p)}>{p.name}</Link>)}</div>
        </div>
      )}
      <Faq faq={t.faq} />
      <Guides slugs={GUIDES[t.slug] ?? []} />
      <div className="no-print"><CtaArbore src={`unealta-${t.slug}`} title="Salvează-l ca arbore" text="Arborele online se completează împreună cu rudele: primele 7 zile sunt gratuite, fără card." /></div>
      <p className="muted small no-print" style={{ textAlign: "center" }}><Link href={TOOLS_HUB}>← Toate uneltele</Link></p>
    </section>
  );
}

export function KinPageView({ slug }: { slug: string }) {
  const p = getKinPage(slug);
  if (!p) notFound();
  const path = kinPagePath(p);
  const related = p.related.map((s) => getKinPage(s)).filter((x) => !!x);
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, url: canonicalUrl(path), inLanguage: "ro",
        dateModified: day(path), author: org, publisher: org, about: { "@type": "DefinedTerm", name: p.name },
      }} />
      <JsonLd data={faqLd(p.faq)} />
      <Breadcrumbs items={[{ name: "Unelte gratuite", path: TOOLS_HUB }, { name: "Calculatorul de rudenie", path: KIN_CALC }, { name: p.name, path }]} />
      <article className="card prose">
        <div className="section-label" style={{ marginTop: 0 }}>Rudenie · {p.degree}</div>
        <h1>{p.h1}</h1>
        <p className="lead">{p.lead}</p>
        {p.body.map((b) => <div key={b.h}><h2>{b.h}</h2>{b.p.map((x) => <p key={x.slice(0, 40)}>{x}</p>)}</div>)}
        <h2>Întrebări frecvente</h2>
        {p.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        <p>Pe larg, cu tabel: <Link href="/ghid/grade-de-rudenie">gradele de rudenie</Link> și, în glosar, <Link href="/glosar/grad-de-rudenie">gradul de rudenie</Link>.</p>
      </article>
      <h2 className="sr-only">Încearcă în calculator</h2>
      <KinCalc initial={p.path} />
      {related.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Alte relații</h2>
          <div className="chips">{related.map((r) => <Link key={r!.slug} className="chip" href={kinPagePath(r!)}>{r!.name}</Link>)}</div>
        </div>
      )}
      <CtaArbore src={`unealta-rudenie-${p.slug}`} />
    </section>
  );
}

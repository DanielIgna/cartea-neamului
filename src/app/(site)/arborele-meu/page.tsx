import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import { CtaSus } from "@/components/continut/CtaArbore";
import { publicPageMetadata, canonicalUrl } from "@/lib/page-metadata";
import { WIDGET_PAGE as page } from "@/lib/autoritate";
import { DEMO_TOKEN, embedCode } from "@/lib/widget-arbore";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = publicPageMetadata({ path: page.path, title: page.title, description: page.description });

const FAQ = [
  { q: "Costă ceva widgetul?", a: "Nu. Widgetul e gratuit pentru orice arbore din Cartea Neamului, inclusiv în primele 7 zile de probă." },
  { q: "Ce date apar în widget?", a: "Doar titlul ales de voi și câteva cifre: numărul de persoane, numărul de generații, anul celui mai vechi strămoș și numărul de locuri de baștină. Nu apar nume, poze sau date despre cei în viață." },
  { q: "Pe ce site-uri îl pot pune?", a: "Pe orice blog sau site care permite cod HTML: blogul familiei, site-ul satului, pagina unei asociații sau a unei școli." },
  { q: "Pot să-l opresc?", a: "Da, oricând, din pagina widgetului din arbore. După oprire, fișa de pe celelalte site-uri arată doar că widgetul nu mai e pornit." },
  { q: "Cine îl poate porni?", a: "Proprietarul arborelui sau un editor. Ceilalți membri ai arborelui îl pot vedea, dar nu îl pot schimba." },
];

/** /arborele-meu: prezentarea widgetului gratuit (src/lib/widget-arbore.ts), cu o fișă de probă și codul de pus pe blog. */
export default function WidgetPage() {
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: page.h1, description: page.description, url: canonicalUrl(page.path), inLanguage: "ro" }} />
      <Breadcrumbs items={[{ name: "Arborele meu", path: page.path }]} />
      <article className="card prose">
        <h1>{page.h1}</h1>
        <p className="lead">O fișă mică a neamului vostru, pe care o puneți pe blogul familiei sau pe site-ul satului. Se actualizează singură pe măsură ce arborele crește.</p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <iframe src={`/widget/arbore/${DEMO_TOKEN}`} width={320} height={230} style={{ border: 0, maxWidth: "100%" }} title="Exemplu de widget „Arborele meu”" loading="lazy" />
          <div style={{ flex: "1 1 260px" }}>
            <h2 style={{ marginTop: 0 }}>Ce arată</h2>
            <ul>
              <li>titlul ales de voi, de pildă „Neamul Popescu din Vâlcea”;</li>
              <li>câte persoane și câte generații are arborele;</li>
              <li>anul celui mai vechi strămoș cunoscut;</li>
              <li>din câte sate și orașe vine familia.</li>
            </ul>
            <p>Fără nume, fără poze și fără nimic despre cei în viață.</p>
          </div>
        </div>

        <h2>Cum îl puneți pe blog</h2>
        <ol>
          <li>Intrați în arborele familiei și apăsați „Widget pentru blog sau site”.</li>
          <li>Alegeți titlul fișei și apăsați „Pornește widgetul”.</li>
          <li>Copiați codul primit și lipiți-l în pagina blogului, în modul HTML al editorului.</li>
        </ol>
        <p>Codul arată cam așa (al vostru are adresa arborelui vostru în loc de „demo”):</p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{embedCode(DEMO_TOKEN, "Neamul Popescu din Vâlcea", SITE_URL)}</pre>

        <h2>De ce merită</h2>
        <p>Rudele care citesc blogul văd dintr-o privire cât de mare e neamul și pot cere să intre în arbore. Fișa poate deveni și un mic proiect de familie: fiecare strămoș nou adăugat se vede în cifre. Pentru școli, widgetul poate sta pe pagina clasei, lângă proiectele despre familie; vezi și <Link href="/scoala">pagina pentru școli</Link>.</p>
      </article>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Nu aveți încă un arbore?</h2>
        <p>Începeți-l în câteva minute: primele 7 zile sunt gratuite, iar widgetul e gratuit oricând.</p>
        <CtaSus label="Începe arborele familiei" src="widget" />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Întrebări frecvente</h2>
        {FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </div>
    </section>
  );
}

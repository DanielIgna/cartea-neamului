import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import JsonLd from "@/components/JsonLd";
import { canonicalUrl, publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site-url";
import { GRUPURI, GRUP_TITLU, REGIUNE_TITLU, SURSE, TIP_TITLU, ghidulSursei, type Sursa } from "@/lib/surse-publice";
import { surse } from "@/lib/surse-publice-db";

export const dynamic = "force-dynamic";
const PATH = "/surse-publice";
const SEO = {
  path: PATH,
  title: "Unde îți cauți strămoșii gratuit: arhive și surse publice | Cartea Neamului",
  description: "Ghid simplu cu arhivele publice și gratuite unde îți poți căuta strămoșii: registre parohiale, stare civilă, recensăminte, liste de război și morminte, pe regiuni.",
};
const PUBLISHER = { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` } };
/** Ziua în care s-a scris ghidul; „dateModified” urmează schimbările din cod (lista din Admin nu schimbă textul ghidului). */
const PUBLISHED = "2026-11-18";

export const generateMetadata = (): Metadata => publicPageMetadata(SEO);

const intro = [
  "Mulți dintre noi știm numele bunicilor, dar ne oprim acolo. Vestea bună e că o mare parte din registrele vechi (botezuri, cununii, înmormântări, recensăminte) sunt astăzi online, gratuit, în arhive publice.",
  "Mai jos găsești unde să cauți, ce găsești acolo și pentru ce ani. Linkurile duc direct pe site-urile acelea și se deschid într-o filă nouă. Noi nu preluăm și nu păstrăm nimic de acolo: tu cauți, tu alegi ce treci în arbore.",
];

const PASI = [
  ["Pornește de la ce știi", "Scrie numele, prenumele, localitatea și anul aproximativ al nașterii. Un an „cam pe la 1890” e destul pentru început."],
  ["Află cum se numea satul atunci", "Multe localități au avut alt nume, mai ales în Transilvania și Banat (în maghiară sau germană). Caută și după numele vechi."],
  ["Încearcă mai multe forme ale numelui", "Preoții scriau după ureche. Ioan poate fi Ion, Iuon, Johannes sau Iános; caută doar începutul numelui („Io”, „Iu”)."],
  ["Notează de unde ai luat informația", "În arbore, la fiecare persoană, ai câmpul „Sursa informației”: scrie registrul și anul și pune linkul, ca familia să poată verifica."],
] as const;

function SourceItem({ s }: { s: Sursa }) {
  const g = ghidulSursei(s);
  return (
    <li id={s.id}>
      <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.nume}</a></h3>
      <div className="surse-meta">
        <span className="chip">{s.perioada}</span>
        <span className="chip">{s.regiuni.map((r) => REGIUNE_TITLU[r]).join(", ")}</span>
        <span className="chip">{s.gratuit ? (s.cont ? "gratuit, cu cont" : "gratuit") : "cu plată"}</span>
      </div>
      <p>{s.descriere}</p>
      <p className="muted" style={{ fontSize: 14 }}>Ce găsești: {s.tip.map((t) => TIP_TITLU[t]).join(", ")}.</p>
      {s.sfat && <p><b>Sfat:</b> {s.sfat}</p>}
      {s.nota && <p className="muted" style={{ fontSize: 14 }}>{s.nota}</p>}
      {s.citare && <p className="archive-cite">{s.citare}</p>}
      {g && <p style={{ fontSize: 14 }}><Link href={g}>Citește ghidul nostru despre asta</Link></p>}
    </li>
  );
}

/**
 * „Unde îți cauți strămoșii gratuit” (Daniel, 18.11.2026): ghidul cu toate sursele publice, pe grupe. Pagina doar trimite
 * oamenii la sursă (link într-o filă nouă); nu încarcă, nu copiază și nu arată nimic de pe site-urile acelea. Lista vine din
 * src/lib/surse-publice.ts, cu ce s-a oprit sau corectat în Admin → Surse publice. Doar în română (roOnly).
 */
export default async function SursePublicePage() {
  const list = (await surse(db).catch(() => [...SURSE])).filter((s) => s.activ);
  const url = canonicalUrl(PATH);
  const article = {
    "@context": "https://schema.org", "@type": "Article", headline: "Unde îți cauți strămoșii gratuit", description: SEO.description, url, inLanguage: "ro",
    mainEntityOfPage: url, datePublished: PUBLISHED, dateModified: PUBLISHED, image: `${SITE_URL}/opengraph-image.png`, author: PUBLISHER, publisher: PUBLISHER,
    about: list.map((s) => ({ "@type": "WebSite", name: s.nume, url: s.url })),
  };
  // Lista surselor, ca ItemList (cu legătura spre fiecare sursă pe pagină și adresa ei).
  const itemList = {
    "@context": "https://schema.org", "@type": "ItemList", name: "Surse publice pentru genealogie", url, numberOfItems: list.length,
    itemListElement: list.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.nume, url: s.url, description: s.descriere })),
  };
  const grupuri = GRUPURI.map((g) => ({ g, items: list.filter((s) => s.grup === g) })).filter((x) => x.items.length);
  return (
    <section className="stack" style={{ maxWidth: 860, margin: "0 auto" }}>
      <JsonLd data={webPageJsonLd({ path: PATH, title: SEO.title, description: SEO.description, crumb: "Surse publice" })} />
      <JsonLd data={article} />
      <JsonLd data={itemList} />
      <article className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Surse publice</div>
        <h1>Unde îți cauți strămoșii gratuit</h1>
        {intro.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        <nav className="surse-toc" aria-label="Grupele de surse">
          {grupuri.map(({ g }) => <a key={g} className="chip" href={`#grup-${g}`}>{GRUP_TITLU[g]}</a>)}
        </nav>
      </article>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cum cauți, pe scurt</h2>
        <ol>
          {PASI.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}
        </ol>
      </div>
      {grupuri.map(({ g, items }) => (
        <div className="card surse-grup" key={g} id={`grup-${g}`}>
          <h2 style={{ marginTop: 0 }}>{GRUP_TITLU[g]}</h2>
          {g === "platit" && <p className="muted">Nu e nevoie de ele ca să începi. Le punem aici pentru cine vrea să meargă mai departe; nu avem nicio înțelegere cu ele și nu primim nimic pentru linkuri.</p>}
          <ul>{items.map((s) => <SourceItem key={s.id} s={s} />)}</ul>
        </div>
      ))}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Și mai departe</h2>
        <p>
          Instituțiile și site-urile de mai sus sunt citate ca surse; nu sunt parteneri ai noștri. Pentru biblioteci digitale și teste ADN vezi
          și <Link href="/resurse-genealogie">Resurse gratuite pentru genealogie</Link>, iar pentru pași mai pe larg, <Link href="/ghid">ghidurile noastre</Link>.
        </p>
        <p>Când găsești ceva, trece-l în arbore și scrie la „Sursa informației” de unde l-ai luat. Așa rămâne pentru copii și nepoți, verificat.</p>
        <p><Link className="btn primary" href="/arbore-nou">Începe arborele familiei</Link></p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import FirulVremii from "@/components/FirulVremii";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { ARTICOLE, SERIE, articolPath } from "@/lib/istorie/articole";
import { getEntry } from "@/lib/continut/colectii";
import { UNIRE_SERIES } from "@/lib/sezon-unire";
import PageIntl from "@/i18n/PageIntl";
import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";

const SEO = {
  path: "/istoria-umanitatii",
  title: "Istoria umanității pe o axă | Cartea Neamului",
  description: "Cinci mii de ani de istorie pe o axă: Sumer, Egipt, Grecia, Roma și ținuturile românești, de la daci până azi, cu oamenii și faptele fiecărei epoci.",
};
// O funcție, nu o constantă: adresa canonică și hreflang depind de limba paginii (/it/…), știută doar la randare.
export const generateMetadata = (): Metadata => publicPageMetadata(SEO);

/** Pagină deschisă tuturor, fără cont: axa anilor de la primele orașe până azi (fosta „Firul vremii”; deocamdată doar în română). */
export default function IstoriaUmanitatiiPage() {
  return <><JsonLd data={webPageJsonLd(SEO)} /><PageIntl ns={["Charts"]} locale="ro"><FirulVremii /></PageIntl>
    <section className="card" lang="ro" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>{SERIE}: războaie, pandemii și crize</h2>
      <p>Cum s-a ajuns la marile încercări ale ultimului secol și cum au trecut prin ele familiile noastre, cu întrebări pentru propriul arbore.</p>
      <ul className="hub-list">
        {ARTICOLE.map((a) => <li key={a.slug}><Link href={articolPath(a.slug)}>{a.label}</Link> <span className="muted">{a.short}</span></li>)}
      </ul>
    </section>
    {/* Povestea Nașterii, din toate Evangheliile (Daniel, 26.11.2026): deschisă tuturor. */}
    <section className="card" lang="ro" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Povestea Crăciunului, din Evanghelii</h2>
      <p>Nașterea lui Isus, așa cum o spun Matei, Luca și Ioan, cu genealogia care deschide Noul Testament: „Cartea neamului lui Isus Hristos” (Matei 1:1). <Link href="/ghid/nasterea-lui-isus-in-evanghelii">Citește povestea Nașterii</Link></p>
    </section>
    {/* Seria despre Marea Unire din 1918 (ghidurile din content/ghid), cu accent pe strămoșii care puteau fi la Alba Iulia. */}
    <section className="card" lang="ro" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Marea Unire din 1918 și strămoșii tăi</h2>
      <p>Cum s-a pregătit Unirea, cine au fost delegații de la Alba Iulia și cum afli dacă cineva din neamul tău a fost acolo.</p>
      <ul className="hub-list">
        {UNIRE_SERIES.map((g) => getEntry("ghid", g)).filter((g) => !!g).map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link></li>)}
      </ul>
    </section></>;
}

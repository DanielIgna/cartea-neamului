import type { Metadata } from "next";
import FirulVremii from "@/components/FirulVremii";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { ARTICOLE, articolPath } from "@/lib/istorie/articole";
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
      <h2 style={{ marginTop: 0 }}>Vremuri grele: războaie, pandemii și crize</h2>
      <p>Cum s-a ajuns la marile încercări ale ultimului secol și cum au trecut prin ele familiile noastre, cu întrebări pentru propriul arbore.</p>
      <ul className="hub-list">
        {ARTICOLE.map((a) => <li key={a.slug}><Link href={articolPath(a.slug)}>{a.label}</Link> <span className="muted">{a.short}</span></li>)}
      </ul>
    </section></>;
}

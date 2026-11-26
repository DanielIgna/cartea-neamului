import type { Metadata } from "next";
import AdamHristos from "@/components/AdamHristos";
import JsonLd from "@/components/JsonLd";
import Link from "next/link";
import PageIntl from "@/i18n/PageIntl";
import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";

const SEO = {
  path: "/genealogii-vechi",
  title: "Genealogii biblice, de la Adam la Isus | Cartea Neamului",
  description: "Genealogia biblică de la Adam la Noe, Avraam, David și Isus. Șase arbori interactivi, cu anii de viață din vechile texte.",
};
// O funcție, nu o constantă: adresa canonică și hreflang depind de limba paginii (/it/…), știută doar la randare.
export const generateMetadata = (): Metadata => publicPageMetadata(SEO);

/** Pagină deschisă tuturor, fără cont: genealogiile vechi după textele biblice (deocamdată doar în română, cu numele din Cornilescu). */
export default function GenealogiiVechiPage() {
  return <><JsonLd data={webPageJsonLd(SEO)} /><PageIntl ns={["Charts"]} locale="ro"><AdamHristos /></PageIntl>
    {/* Matei 1:1, „Cartea neamului lui Isus Hristos”: povestea întreagă a Nașterii, din toate Evangheliile (Daniel, 26.11.2026). */}
    <section className="card" lang="ro" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>„Cartea neamului lui Isus Hristos”</h2>
      <p>Noul Testament începe cu o genealogie (Matei 1:1). Citește povestea Nașterii lui Isus, întreagă, din toate Evangheliile: <Link href="/ghid/nasterea-lui-isus-in-evanghelii">Povestea Nașterii lui Isus, din toate Evangheliile</Link>.</p>
    </section></>;
}

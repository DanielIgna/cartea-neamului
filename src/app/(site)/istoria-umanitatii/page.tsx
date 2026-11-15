import type { Metadata } from "next";
import FirulVremii from "@/components/FirulVremii";
import JsonLd from "@/components/JsonLd";
import PageIntl from "@/i18n/PageIntl";
import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";

const SEO = {
  path: "/istoria-umanitatii",
  title: "Istoria umanității pe o axă | Cartea Neamului",
  description: "Cinci mii de ani de istorie pe o axă: Sumer, Egipt, Grecia, Roma și ținuturile românești, de la daci până azi.",
};
// O funcție, nu o constantă: adresa canonică și hreflang depind de limba paginii (/it/…), știută doar la randare.
export const generateMetadata = (): Metadata => publicPageMetadata(SEO);

/** Pagină deschisă tuturor, fără cont: axa anilor de la primele orașe până azi (fosta „Firul vremii”; deocamdată doar în română). */
export default function IstoriaUmanitatiiPage() {
  return <><JsonLd data={webPageJsonLd(SEO)} /><PageIntl ns={["Charts"]} locale="ro"><FirulVremii /></PageIntl></>;
}

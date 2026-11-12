import type { Metadata } from "next";
import FirulVremii from "@/components/FirulVremii";
import PageIntl from "@/i18n/PageIntl";

export const metadata: Metadata = {
  title: "Istoria umanității · Cartea Neamului",
  description: "Cinci mii de ani de istorie pe o singură axă: Sumer, Egiptul, Grecia, Roma, China, India, Maya și incașii, Europa modernă, descoperirile care au schimbat lumea și, alături, istoria pământului românesc, de la daci până azi.",
};

/** Pagină deschisă tuturor, fără cont: axa anilor de la primele orașe până azi (fosta „Firul vremii”; deocamdată doar în română). */
export default function IstoriaUmanitatiiPage() {
  return <PageIntl ns={["Charts"]} locale="ro"><FirulVremii /></PageIntl>;
}

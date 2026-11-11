import type { Metadata } from "next";
import FirulVremii from "@/components/FirulVremii";
import PageIntl from "@/i18n/PageIntl";

export const metadata: Metadata = {
  title: "Firul vremii · Cartea Neamului",
  description: "Istoria Bibliei și a lumii pe aceeași axă: patriarhii, împărații lui Iuda și Israel, proorocii, Egiptul, Asiria, Babilonul, Persia, Grecia, Roma și geto-dacii, de la Avraam la Hristos.",
};

/** Pagină deschisă tuturor, fără cont: axa anilor de la Avraam la Hristos (deocamdată doar în română). */
export default function FirulVremiiPage() {
  return <PageIntl ns={["Charts"]} locale="ro"><FirulVremii /></PageIntl>;
}

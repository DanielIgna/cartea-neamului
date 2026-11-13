import type { Metadata } from "next";
import AdamHristos from "@/components/AdamHristos";
import JsonLd from "@/components/JsonLd";
import PageIntl from "@/i18n/PageIntl";
import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";

const SEO = {
  path: "/genealogii-vechi",
  title: "Genealogii biblice, de la Adam la Isus | Cartea Neamului",
  description: "Genealogia biblică de la Adam la Noe, Avraam, David și Isus. Șase arbori interactivi, cu anii de viață din vechile texte.",
};
export const metadata: Metadata = publicPageMetadata(SEO);

/** Pagină deschisă tuturor, fără cont: genealogiile vechi după textele biblice (deocamdată doar în română, cu numele din Cornilescu). */
export default function GenealogiiVechiPage() {
  return <><JsonLd data={webPageJsonLd(SEO)} /><PageIntl ns={["Charts"]} locale="ro"><AdamHristos /></PageIntl></>;
}

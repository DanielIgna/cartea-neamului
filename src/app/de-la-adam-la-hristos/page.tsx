import type { Metadata } from "next";
import AdamHristos from "@/components/AdamHristos";
import PageIntl from "@/i18n/PageIntl";

export const metadata: Metadata = {
  title: "De la Adam la Hristos · Cartea Neamului",
  description: "Arborele genealogic al lui Isus Hristos după Biblie, de la Adam la Noe, Avraam, David și Iosif: șase arbori interactivi, anii de viață și locurile unde socotelile diferă.",
};

/** Pagină deschisă tuturor, fără cont: neamul lui Hristos după Biblie (deocamdată doar în română, ca numele să fie cele din Cornilescu). */
export default function AdamHristosPage() {
  return <PageIntl ns={["Charts"]} locale="ro"><AdamHristos /></PageIntl>;
}

import type { Metadata } from "next";
import AdamHristos from "@/components/AdamHristos";
import PageIntl from "@/i18n/PageIntl";

export const metadata: Metadata = {
  title: "Genealogii vechi · Cartea Neamului",
  description: "Una dintre cele mai lungi genealogii păstrate în scris, așa cum o dau textele biblice: de la Adam la Noe, Avraam, David și Isus din Nazaret. Șase arbori interactivi, anii de viață și locurile unde vechile manuscrise dau cifre diferite.",
};

/** Pagină deschisă tuturor, fără cont: genealogiile vechi după textele biblice (deocamdată doar în română, cu numele din Cornilescu). */
export default function GenealogiiVechiPage() {
  return <PageIntl ns={["Charts"]} locale="ro"><AdamHristos /></PageIntl>;
}

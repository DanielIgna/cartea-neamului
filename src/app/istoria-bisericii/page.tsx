import type { Metadata } from "next";
import ChurchHistory from "@/components/ChurchHistory";

export const metadata: Metadata = {
  title: "Istoria Bisericii prigonite · Cartea Neamului",
  description: "Biserica lui Hristos de la apostoli până azi: martiri, reformatori, Biblia în limba română și eroi ai credinței din închisorile comuniste.",
};

/** Pagină deschisă tuturor, fără cont: istoria Bisericii prigonite, scrisă de mână, cu versete din Biblia Cornilescu. */
export default function ChurchHistoryPage() {
  return <ChurchHistory />;
}

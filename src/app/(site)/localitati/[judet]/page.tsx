import type { Metadata } from "next";
import { CountyPage, countyMetadata } from "@/components/continut/LocalityPages";

type Props = { params: Promise<{ judet: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return countyMetadata((await params).judet);
}

/** Pagina unui județ (date din content/localitati/judete.json). */
export default async function County({ params }: Props) {
  return <CountyPage slug={(await params).judet} />;
}

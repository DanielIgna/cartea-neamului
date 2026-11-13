import type { Metadata } from "next";
import { CountyPage, countyMetadata } from "@/components/continut/LocalityPages";
import { loadCounties } from "@/lib/continut/localitati";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; judet: string }> };

/** La publicare: toate județele pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  return sectionStaticParams(params.v, loadCounties().map((c) => c.slug)).map((p) => ({ judet: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return countyMetadata((await params).judet);
}

export default async function PublicCounty({ params }: Props) {
  await readVariant({ params });
  return <CountyPage slug={(await params).judet} />;
}

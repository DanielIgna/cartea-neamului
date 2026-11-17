import type { Metadata } from "next";
import { GenealogieCity, genealogieCityMetadata } from "@/components/continut/GenealogieOrase";
import { GEN_CITIES } from "@/lib/genealogie-orase";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; oras: string }> };

/** La publicare: toate orașele, pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  return sectionStaticParams(params.v, GEN_CITIES.map((c) => c.slug)).map((p) => ({ oras: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return genealogieCityMetadata((await params).oras);
}

export default async function PublicPage({ params }: Props) {
  await readVariant({ params });
  return <GenealogieCity slug={(await params).oras} />;
}

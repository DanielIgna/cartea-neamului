import type { Metadata } from "next";
import { GenealogieRegion, genealogieRegionMetadata } from "@/components/continut/GenealogieRegiuni";
import { GEN_REGIONS } from "@/lib/genealogie-regiuni";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; regiune: string }> };

/** La publicare: toate regiunile, pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  return sectionStaticParams(params.v, GEN_REGIONS.map((r) => r.slug)).map((p) => ({ regiune: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return genealogieRegionMetadata((await params).regiune);
}

export default async function PublicPage({ params }: Props) {
  await readVariant({ params });
  return <GenealogieRegion slug={(await params).regiune} />;
}

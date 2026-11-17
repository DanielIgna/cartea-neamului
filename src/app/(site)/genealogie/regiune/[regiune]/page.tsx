import type { Metadata } from "next";
import { GenealogieRegion, genealogieRegionMetadata } from "@/components/continut/GenealogieRegiuni";

type Props = { params: Promise<{ regiune: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return genealogieRegionMetadata((await params).regiune);
}

/** Genealogia unei regiuni istorice (Transilvania, Banat, Bucovina, Basarabia, Moldova, Dobrogea, Maramureș). */
export default async function Page({ params }: Props) {
  return <GenealogieRegion slug={(await params).regiune} />;
}

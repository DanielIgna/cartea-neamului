import type { Metadata } from "next";
import { GenealogieHub, genealogieHubMetadata } from "@/components/continut/GenealogieOrase";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return genealogieHubMetadata();
}

/** Hubul /genealogie gata făcut pentru vizitatori. */
export default async function PublicHub(props: VariantParams) {
  await readVariant(props);
  return <GenealogieHub />;
}

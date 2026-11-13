import type { Metadata } from "next";
import { LocalitiesHub, localitiesHubMetadata } from "@/components/continut/LocalityPages";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return localitiesHubMetadata();
}

/** Hubul /localitati gata făcut pentru vizitatori. */
export default async function PublicHub(props: VariantParams) {
  await readVariant(props);
  return <LocalitiesHub />;
}

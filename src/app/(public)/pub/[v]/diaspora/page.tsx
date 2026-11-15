import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return diasporaMetadata();
}

/** Hubul /diaspora gata făcut pentru vizitatori, în fiecare limbă. */
export default async function PublicHub(props: VariantParams) {
  await readVariant(props);
  return <DiasporaPage />;
}

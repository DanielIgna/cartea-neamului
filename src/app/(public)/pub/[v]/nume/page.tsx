import type { Metadata } from "next";
import { NamesHub, namesHubMetadata } from "@/components/continut/NamePages";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return namesHubMetadata(1);
}

/** Hubul /nume gata făcut pentru vizitatori (prima pagină; ?pagina=N merge la pagina făcută pe loc). */
export default async function PublicHub(props: VariantParams) {
  await readVariant(props);
  return <NamesHub page={1} />;
}

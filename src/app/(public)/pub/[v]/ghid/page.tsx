import type { Metadata } from "next";
import { HubPage, hubMetadata } from "@/components/continut/ArticlePages";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return hubMetadata("ghid", 1);
}

/** Hubul /ghid gata făcut pentru vizitatori (prima pagină; ?pagina=N merge la pagina făcută pe loc). */
export default async function PublicHub(props: VariantParams) {
  await readVariant(props);
  return <HubPage c="ghid" page={1} />;
}

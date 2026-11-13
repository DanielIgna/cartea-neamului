import type { Metadata } from "next";
import PartnersView from "@/components/PartnersView";
import { generateMetadata as siteMetadata } from "@/app/(site)/parteneri/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Partenerii, gata făcuți pentru vizitatori (fără acordul cuiva intrat în cont). */
export default async function PublicPartners(props: VariantParams) {
  await readVariant(props);
  return <PartnersView state={null} />;
}

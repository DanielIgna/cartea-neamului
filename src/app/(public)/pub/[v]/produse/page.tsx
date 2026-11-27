import type { Metadata } from "next";
import ProdusePage, { generateMetadata as siteMetadata } from "@/app/(site)/produse/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Magazinul gata făcut pentru vizitatori; modelele și prețurile noi apar în cel mult 10 minute. */
export default async function PublicProduse(props: VariantParams) {
  await readVariant(props);
  return <ProdusePage />;
}

import type { Metadata } from "next";
import GiftSeasonPage, { generateMetadata as siteMetadata } from "@/app/(site)/cadou-de-sarbatori/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** „Cadou de sărbători” gata făcut pentru vizitatori; un preț schimbat din Admin apare în cel mult 10 minute. */
export default async function PublicGift(props: VariantParams) {
  await readVariant(props);
  return <GiftSeasonPage />;
}

import type { Metadata } from "next";
import Page, { metadata as siteMetadata } from "@/app/(site)/istoria-umanitatii/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata;
}

/** Aceeași pagină ca /istoria-umanitatii, gata făcută pentru vizitatorii fără cont (vezi ../layout.tsx). */
export default async function PublicPage(props: VariantParams) {
  await readVariant(props);
  return <Page />;
}

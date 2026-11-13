import type { Metadata } from "next";
import Landing from "@/components/Landing";
import { HOME_JSON_LD } from "@/lib/home-jsonld";
import { generateMetadata as siteMetadata } from "@/app/(site)/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Prima pagină pentru vizitatorii fără cont, gata făcută (vezi layout.tsx de alături). */
export default async function PublicHome(props: VariantParams) {
  await readVariant(props);
  return <Landing deleted={false} jsonLd={HOME_JSON_LD} />;
}

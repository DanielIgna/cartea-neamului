import type { Metadata } from "next";
import DesignByPage, { generateMetadata as siteMetadata } from "@/app/(site)/design-by-cartea-neamului/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Pagina „Design by Cartea Neamului” gata făcută pentru vizitatori. */
export default async function PublicDesignBy(props: VariantParams) {
  await readVariant(props);
  return <DesignByPage />;
}

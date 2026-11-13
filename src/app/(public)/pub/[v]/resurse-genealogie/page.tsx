import type { Metadata } from "next";
import ResursePage, { generateMetadata as siteMetadata } from "@/app/(site)/resurse-genealogie/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Resursele gata făcute pentru vizitatori (laboratoarele din Admin apar în cel mult 10 minute). */
export default async function PublicResurse(props: VariantParams) {
  await readVariant(props);
  return <ResursePage />;
}

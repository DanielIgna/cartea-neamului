import type { Metadata } from "next";
import Page, { generateMetadata as siteMetadata } from "@/app/(site)/surse-publice/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Ghidul surselor publice, gata făcut pentru vizitatori (sursele oprite sau corectate în Admin apar în cel mult 10 minute). */
export default async function PublicSurse(props: VariantParams) {
  await readVariant(props);
  return <Page />;
}

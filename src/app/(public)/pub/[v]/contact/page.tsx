import type { Metadata } from "next";
import ContactPage, { generateMetadata as siteMetadata } from "@/app/(site)/contact/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return siteMetadata();
}

/** Contactul gata făcut pentru vizitatori; cererile cu ?tipar=… (din pagina cărții) merg la pagina obișnuită. */
export default async function PublicContact(props: VariantParams) {
  await readVariant(props);
  return <ContactPage searchParams={Promise.resolve({})} />;
}

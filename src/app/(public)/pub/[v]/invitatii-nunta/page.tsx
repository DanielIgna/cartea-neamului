import type { Metadata } from "next";
import InvitatiiNuntaPage, { hubMetadata } from "@/app/(site)/invitatii-nunta/page";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return hubMetadata();
}

/** Lista invitațiilor de nuntă, gata făcută pentru vizitatori; comutatorul din Admin se vede în cel mult 10 minute. */
export default async function PublicInvitatiiNunta(props: VariantParams) {
  await readVariant(props);
  return <InvitatiiNuntaPage />;
}

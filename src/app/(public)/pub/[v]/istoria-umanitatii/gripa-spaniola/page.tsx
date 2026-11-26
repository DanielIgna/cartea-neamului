import type { Metadata } from "next";
import IstorieArticle, { istorieMetadata } from "@/components/continut/IstorieArticle";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

const SLUG = "gripa-spaniola";

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return istorieMetadata(SLUG);
}

/** Aceeași pagină ca /istoria-umanitatii/gripa-spaniola, gata făcută pentru vizitatorii fără cont: fără fila pentru cei cu cont. */
export default async function PublicPage(props: VariantParams) {
  await readVariant(props);
  return <IstorieArticle slug={SLUG} fila={null} />;
}

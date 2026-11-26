import type { Metadata } from "next";
import CrizeArticle from "@/components/continut/CrizeArticle";
import { CRIZE } from "@/lib/istorie/crize";
import { publicPageMetadata } from "@/lib/page-metadata";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return publicPageMetadata({ path: CRIZE.path, title: CRIZE.title, description: CRIZE.description });
}

/** Aceeași pagină ca /istoria-umanitatii/crize, gata făcută pentru vizitatorii fără cont: fără fila pentru cei cu cont. */
export default async function PublicPage(props: VariantParams) {
  await readVariant(props);
  return <CrizeArticle fila={null} />;
}

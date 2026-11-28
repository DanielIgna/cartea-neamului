import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/MagazinPagini";
import { categoryHubMetadata } from "@/lib/invitatii-nunta-meta";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;

export async function generateMetadata(props: VariantParams): Promise<Metadata> {
  await readVariant(props);
  return categoryHubMetadata("accesorii");
}

/** „Accesorii nuntă”, gata făcută pentru vizitatori; comutatorul din Admin se vede în cel mult 10 minute. */
export default async function Page(props: VariantParams) {
  await readVariant(props);
  return <CategoryHubPage category="accesorii" />;
}

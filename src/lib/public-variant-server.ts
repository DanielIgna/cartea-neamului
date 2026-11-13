import { notFound } from "next/navigation";
import { setStaticLocale } from "@/i18n/server";
import { parseVariant, ALL_VARIANTS, type PublicVariant } from "@/lib/public-variant";

export type VariantParams = { params: Promise<{ v: string }> };

/** Citește varianta din adresa internă și fixează limba; o pun layout-ul, pagina și generateMetadata, fiecare. */
export async function readVariant({ params }: VariantParams): Promise<PublicVariant> {
  const v = parseVariant((await params).v);
  if (!v) notFound();
  setStaticLocale(v.locale);
  return v;
}

/** Toate variantele, făcute la publicare. */
export const variantParams = () => ALL_VARIANTS.map((v) => ({ v }));

import { notFound } from "next/navigation";
import { setStaticLocale } from "@/i18n/server";
import { parseVariant, ALL_VARIANTS, BUILD_VARIANT, type PublicVariant } from "@/lib/public-variant";

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

/**
 * Paginile din secțiuni (ghiduri, glosar…) gata făcute la publicare: toate, dar doar în română cu tema automată, cu sau fără
 * anunțul de cookie-uri (cum le primesc Google și aproape toți vizitatorii); celelalte variante (altă limbă sau temă aleasă)
 * se fac la cerere. Next cere ca fiecare variantă să întoarcă măcar o pagină (altfel nu mai face niciuna dinainte), de aceea
 * restul primesc una.
 */
const BUILD_ALL = new Set([BUILD_VARIANT, "ro.auto.1"]);
export function sectionStaticParams(v: string, slugs: string[]) {
  return (BUILD_ALL.has(v) ? slugs : slugs.slice(0, 1)).map((slug) => ({ slug }));
}

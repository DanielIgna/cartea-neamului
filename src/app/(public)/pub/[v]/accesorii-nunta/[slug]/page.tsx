import type { Metadata } from "next";
import { CategoryProduct } from "@/components/MagazinPagini";
import { categoryProductMetadata } from "@/lib/invitatii-nunta-meta";
import { readVariant } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; slug: string }> };

/** Produsele vin din baza de date: paginile se fac la prima cerere și apoi stau în cache (Admin-ul le reîmprospătează). */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return categoryProductMetadata("accesorii", (await params).slug);
}

/** Un produs din „Accesorii nuntă”, gata făcut pentru vizitatori (mesajul de eroare vine pe adresa cu ?eroare=, făcută pe loc). */
export default async function Page({ params }: Props) {
  await readVariant({ params });
  return <CategoryProduct category="accesorii" slug={(await params).slug} />;
}

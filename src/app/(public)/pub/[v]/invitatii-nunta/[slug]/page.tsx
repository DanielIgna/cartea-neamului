import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopModelPage } from "@/components/InvitatiiNunta";
import { modelMetadata } from "@/lib/invitatii-nunta-meta";
import { shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { publishedModel } from "@/lib/invitatii-nunta-produse";
import { readVariant } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; slug: string }> };

/** Modelele vin din baza de date: paginile se fac la prima cerere și apoi stau în cache (Admin-ul le reîmprospătează la schimbări). */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return modelMetadata((await params).slug);
}

/** Pagina unui model, gata făcută pentru vizitatori (fără mesaj de eroare: acela vine pe adresa cu ?eroare=, făcută pe loc). */
export default async function PublicInvitatieModel({ params }: Props) {
  await readVariant({ params });
  const model = await publishedModel(db, (await params).slug);
  if (!model) notFound();
  return <ShopModelPage model={model} locale={await getLocale()} open={await shopOpen(db)} payReady={shopPaymentsReady()} />;
}

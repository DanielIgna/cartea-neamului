import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopModelPage } from "@/components/InvitatiiNunta";
import { modelMetadata } from "@/app/(site)/invitatii-nunta/[slug]/page";
import { SHOP_MODELS, modelBySlug } from "@/lib/invitatii-nunta";
import { shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { readVariant } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; slug: string }> };

export function generateStaticParams() {
  return SHOP_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return modelMetadata((await params).slug);
}

/** Pagina unui model, gata făcută pentru vizitatori (fără mesaj de eroare: acela vine pe adresa cu ?eroare=, făcută pe loc). */
export default async function PublicInvitatieModel({ params }: Props) {
  await readVariant({ params });
  const model = modelBySlug((await params).slug);
  if (!model) notFound();
  return <ShopModelPage model={model} locale={await getLocale()} open={await shopOpen(db)} payReady={shopPaymentsReady()} />;
}

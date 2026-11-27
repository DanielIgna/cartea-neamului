import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopModelPage } from "@/components/InvitatiiNunta";
import { modelBySlug } from "@/lib/invitatii-nunta";
import { shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { modelMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return modelMetadata((await params).slug);
}

/** Pagina unui model de invitație, cu pozele, prețul și cumpărarea fără cont. */
export default async function InvitatieModelPage({ params, searchParams }: Props) {
  const model = modelBySlug((await params).slug);
  if (!model) notFound();
  const q = await searchParams;
  return <ShopModelPage model={model} locale={await getLocale()} open={await shopOpen(db)} payReady={shopPaymentsReady()} error={q.eroare ?? null} />;
}

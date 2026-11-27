import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopModelPage } from "@/components/InvitatiiNunta";
import { modelBySlug, modelPath, modelText } from "@/lib/invitatii-nunta";
import { shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { publicPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<Record<string, string | undefined>> };

export async function modelMetadata(slug: string): Promise<Metadata> {
  const model = modelBySlug(slug);
  if (!model) return {};
  const locale = await getLocale();
  const tm = modelText(model, locale);
  const img = model.images[0];
  const meta = publicPageMetadata({ path: modelPath(model), title: `${tm.metaTitle} | Cartea Neamului`, description: tm.metaDescription, locale, image: { url: img.src, alt: tm.title } });
  return (await shopOpen(db)) ? meta : { ...meta, robots: { index: false, follow: true } };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return modelMetadata((await params).slug);
}

/** Pagina unui model de invitație, cu pozele, prețul și cumpărarea fără cont. */
export default async function InvitatieModelPage({ params, searchParams }: Props) {
  const model = modelBySlug((await params).slug);
  if (!model) notFound();
  const q = (await searchParams) ?? {};
  return <ShopModelPage model={model} locale={await getLocale()} open={await shopOpen(db)} payReady={shopPaymentsReady()} error={q.eroare ?? null} />;
}

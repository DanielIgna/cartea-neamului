import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopModelPage } from "@/components/InvitatiiNunta";
import { CompleteSet } from "@/components/MagazinDigital";
import { shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { publishedModel, sameRegion } from "@/lib/invitatii-nunta-produse";
import { modelMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return modelMetadata((await params).slug);
}

/** Pagina unui model publicat, cu pozele, prețul și cumpărarea fără cont. Un model ciornă, retras sau arhivat dă 404. */
export default async function InvitatieModelPage({ params, searchParams }: Props) {
  const model = await publishedModel(db, (await params).slug);
  if (!model) notFound();
  const q = await searchParams;
  const locale = await getLocale();
  // „Completează setul” (28.11.2026): setul de accesorii din aceeași regiune, dacă e publicat și rubrica lui e pornită.
  const set = (await shopOpen(db, "accesorii")) ? await sameRegion(db, model, "accesorii").catch(() => null) : null;
  return <ShopModelPage model={model} locale={locale} open={await shopOpen(db)} payReady={shopPaymentsReady()} error={q.eroare ?? null}
    extra={set ? <CompleteSet accessory={set} locale={locale} /> : null} />;
}

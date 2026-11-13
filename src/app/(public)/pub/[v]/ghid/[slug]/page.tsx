import type { Metadata } from "next";
import { EntryPage, entryMetadata } from "@/components/continut/ArticlePages";
import { loadCollection } from "@/lib/continut/colectii";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
// Celelalte variante (altă limbă sau temă) se fac la prima cerere și rămân apoi în cache.
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; slug: string }> };

/** La publicare: toate paginile pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  return sectionStaticParams(params.v, loadCollection("ghid").map((e) => e.slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return entryMetadata("ghid", (await params).slug);
}

export default async function PublicEntry({ params }: Props) {
  await readVariant({ params });
  return <EntryPage c="ghid" slug={(await params).slug} />;
}

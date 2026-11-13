import type { Metadata } from "next";
import { SeatPage, seatMetadata } from "@/components/continut/LocalityPages";
import { loadCounties } from "@/lib/continut/localitati";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; judet: string; localitate: string }> };

/**
 * Reședințele județelor făcute la publicare. Segmentul [judet] e o pagină, nu un layout, deci Next nu ne dă județul:
 * întoarcem perechile complete (județ, reședință), toate pentru varianta văzută de Google (vezi sectionStaticParams).
 */
export function generateStaticParams({ params }: { params: { v: string } }) {
  const pairs = loadCounties().filter((c) => c.seatSlug).map((c) => ({ judet: c.slug, localitate: c.seatSlug! }));
  const keep = new Set(sectionStaticParams(params.v, pairs.map((p) => p.judet)).map((p) => p.slug));
  return pairs.filter((p) => keep.has(p.judet));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  const p = await params;
  return seatMetadata(p.judet, p.localitate);
}

export default async function PublicSeat({ params }: Props) {
  await readVariant({ params });
  const p = await params;
  return <SeatPage slug={p.judet} seat={p.localitate} />;
}

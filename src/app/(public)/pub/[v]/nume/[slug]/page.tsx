import type { Metadata } from "next";
import { NamePage, nameMetadata } from "@/components/continut/NamePages";
import { loadNames } from "@/lib/continut/nume";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
// Cifrele anonime din platformă se reîmprospătează din 10 în 10 minute.
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; slug: string }> };

/** La publicare: toate numele pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  return sectionStaticParams(params.v, loadNames().map((n) => n.slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return nameMetadata((await params).slug);
}

export default async function PublicName({ params }: Props) {
  await readVariant({ params });
  return <NamePage slug={(await params).slug} />;
}

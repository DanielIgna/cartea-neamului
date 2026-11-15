import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";
import { entries } from "@/lib/diaspora";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; a: string }> };

/** La publicare: țările și paginile speciale, pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  const slugs = entries().filter((e) => e.kind === "country" || e.kind === "theme").map((e) => e.path.split("/")[2]);
  return sectionStaticParams(params.v, slugs).map((p) => ({ a: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  return diasporaMetadata((await params).a);
}

export default async function PublicPage({ params }: Props) {
  await readVariant({ params });
  return <DiasporaPage a={(await params).a} />;
}

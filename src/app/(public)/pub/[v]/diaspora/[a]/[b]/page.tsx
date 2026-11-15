import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";
import { entries } from "@/lib/diaspora";
import { readVariant, sectionStaticParams } from "@/lib/public-variant-server";
export const dynamic = "force-static";
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ v: string; a: string; b: string }> };

/** La publicare: statele, provinciile și orașele, pentru varianta pe care o vede Google (vezi sectionStaticParams). */
export function generateStaticParams({ params }: { params: { v: string } }) {
  const paths = entries().filter((e) => e.kind === "region").map((e) => e.path.split("/").slice(2).join("/"));
  return sectionStaticParams(params.v, paths).map((p) => { const [a, b] = p.slug.split("/"); return { a, b }; });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await readVariant({ params });
  const { a, b } = await params;
  return diasporaMetadata(a, b);
}

export default async function PublicPage({ params }: Props) {
  await readVariant({ params });
  const { a, b } = await params;
  return <DiasporaPage a={a} b={b} />;
}

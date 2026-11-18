import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KinPageView } from "@/components/unelte/ToolPages";
import { KIN_PAGES, getKinPage, kinPagePath } from "@/lib/unelte/rudenie-pagini";
import { publicPageMetadata } from "@/lib/page-metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return KIN_PAGES.map((p) => ({ relatie: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ relatie: string }> }): Promise<Metadata> {
  const p = getKinPage((await params).relatie);
  return p ? publicPageMetadata({ path: kinPagePath(p), title: `${p.title} | Cartea Neamului`, description: p.description }) : {};
}

/** /unelte/rudenie/<relație> (src/lib/unelte/rudenie-pagini.ts). */
export default async function KinPage({ params }: { params: Promise<{ relatie: string }> }) {
  const p = getKinPage((await params).relatie);
  if (!p) notFound();
  return <KinPageView slug={p.slug} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/unelte/ToolPages";
import { TOOLS, getTool, toolPath } from "@/lib/unelte/unelte";
import { publicPageMetadata } from "@/lib/page-metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTool((await params).slug);
  return t ? publicPageMetadata({ path: toolPath(t), title: `${t.title} | Cartea Neamului`, description: t.description }) : {};
}

/** /unelte/<unealtă> (src/lib/unelte/unelte.ts). */
export default async function Tool({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTool((await params).slug);
  if (!t) notFound();
  return <ToolPage slug={t.slug} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftPageView } from "@/components/cadouri/GiftPages";
import { GIFT_PAGES, giftPage, giftPath } from "@/lib/cadouri";
import { publicPageMetadata } from "@/lib/page-metadata";

export const revalidate = 600;
export const dynamicParams = false;
export function generateStaticParams() {
  return GIFT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = giftPage((await params).slug);
  return p ? publicPageMetadata({ path: giftPath(p), title: p.title, description: p.description }) : {};
}

/** /cadouri/<ocazie> și /cadouri/pentru-<cine> (src/lib/cadouri.ts). */
export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = giftPage((await params).slug);
  if (!p) notFound();
  return <GiftPageView slug={p.slug} />;
}

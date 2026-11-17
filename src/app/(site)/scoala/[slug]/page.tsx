import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SchoolPageView from "@/components/scoala/SchoolPageView";
import { publicPageMetadata } from "@/lib/page-metadata";
import { SCHOOL_PAGES, schoolPage } from "@/lib/scoala";

export const dynamicParams = false;
export function generateStaticParams() {
  return SCHOOL_PAGES.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = schoolPage((await params).slug);
  return p ? publicPageMetadata({ path: p.path, title: p.title, description: p.description }) : {};
}

/** /scoala/clasa-3, /scoala/clasa-4, /scoala/gimnaziu-istorie. */
export default async function SchoolClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = schoolPage((await params).slug);
  if (!p || !p.slug) notFound();
  return <SchoolPageView page={p} />;
}

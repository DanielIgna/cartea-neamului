import type { Metadata } from "next";
import { CategoryProduct } from "@/components/MagazinPagini";
import { categoryProductMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryProductMetadata("accesorii", (await params).slug);
}

/** „Accesorii nuntă” → un produs publicat, cu pozele, prețul și cumpărarea fără cont. Nepublicat: 404. */
export default async function Page({ params, searchParams }: Props) {
  return <CategoryProduct category="accesorii" slug={(await params).slug} error={(await searchParams).eroare ?? null} />;
}

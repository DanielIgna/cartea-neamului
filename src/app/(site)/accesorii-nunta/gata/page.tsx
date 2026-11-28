import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { CategoryDone } from "@/components/MagazinPagini";
import { categoryText } from "@/lib/magazin-texte";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: categoryText("accesorii", await getLocale()).doneMetaTitle, robots: PRIVATE_ROBOTS };
}

/** „Accesorii nuntă” → după plată: linkul de descărcare și retrimiterea emailului (privată, noindex). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <CategoryDone category="accesorii" q={await searchParams} />;
}

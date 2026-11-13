import type { Metadata } from "next";
import { NamePage, nameMetadata } from "@/components/continut/NamePages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return nameMetadata((await params).slug);
}

/** Pagina unui nume de familie (date din content/nume/nume.json). */
export default async function Name({ params }: Props) {
  return <NamePage slug={(await params).slug} />;
}

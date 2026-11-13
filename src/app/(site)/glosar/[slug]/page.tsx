import type { Metadata } from "next";
import { EntryPage, entryMetadata } from "@/components/continut/ArticlePages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return entryMetadata("glosar", (await params).slug);
}

/** O pagină din /glosar (conținut din content/glosar/<slug>.md). */
export default async function Entry({ params }: Props) {
  return <EntryPage c="glosar" slug={(await params).slug} />;
}

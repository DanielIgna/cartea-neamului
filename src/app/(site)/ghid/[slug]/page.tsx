import type { Metadata } from "next";
import { EntryPage, entryMetadata } from "@/components/continut/ArticlePages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return entryMetadata("ghid", (await params).slug);
}

/** O pagină din /ghid (conținut din content/ghid/<slug>.md). */
export default async function Entry({ params }: Props) {
  return <EntryPage c="ghid" slug={(await params).slug} />;
}

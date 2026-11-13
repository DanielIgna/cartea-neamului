import type { Metadata } from "next";
import { HubPage, hubMetadata } from "@/components/continut/ArticlePages";
import { parsePage } from "@/lib/continut/paginare";

type Props = { searchParams: Promise<{ pagina?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return hubMetadata("glosar", parsePage((await searchParams).pagina));
}

/** Hubul /glosar (lista, căutarea și paginarea); vizitatorii fără cont primesc varianta gata făcută din app/(public). */
export default async function Hub({ searchParams }: Props) {
  return <HubPage c="glosar" page={parsePage((await searchParams).pagina)} />;
}

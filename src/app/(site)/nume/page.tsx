import type { Metadata } from "next";
import { NamesHub, namesHubMetadata } from "@/components/continut/NamePages";
import { parsePage } from "@/lib/continut/paginare";

type Props = { searchParams: Promise<{ pagina?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return namesHubMetadata(parsePage((await searchParams).pagina));
}

/** Hubul /nume (lista, căutarea și paginarea); vizitatorii fără cont primesc varianta gata făcută din app/(public). */
export default async function Hub({ searchParams }: Props) {
  return <NamesHub page={parsePage((await searchParams).pagina)} />;
}

import type { Metadata } from "next";
import { LocalityPage, localityMetadata } from "@/components/continut/LocalityPages";

type Props = { params: Promise<{ judet: string; localitate: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return localityMetadata(p.judet, p.localitate);
}

/** Pagina unei localități (comună, oraș, municipiu); reședința județului are pagina ei. */
export default async function Seat({ params }: Props) {
  const p = await params;
  return <LocalityPage judet={p.judet} localitate={p.localitate} />;
}

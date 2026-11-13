import type { Metadata } from "next";
import { SeatPage, seatMetadata } from "@/components/continut/LocalityPages";

type Props = { params: Promise<{ judet: string; localitate: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return seatMetadata(p.judet, p.localitate);
}

/** Pagina reședinței unui județ. */
export default async function Seat({ params }: Props) {
  const p = await params;
  return <SeatPage slug={p.judet} seat={p.localitate} />;
}

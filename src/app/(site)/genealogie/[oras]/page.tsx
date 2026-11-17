import type { Metadata } from "next";
import { GenealogieCity, genealogieCityMetadata } from "@/components/continut/GenealogieOrase";

type Props = { params: Promise<{ oras: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return genealogieCityMetadata((await params).oras);
}

/** Genealogia unui oraș mare din România. /genealogie/regiune/<regiune> are ruta ei (segment fix, are întâietate). */
export default async function Page({ params }: Props) {
  return <GenealogieCity slug={(await params).oras} />;
}

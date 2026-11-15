import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";

type Props = { params: Promise<{ a: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return diasporaMetadata((await params).a);
}

/** O țară sau o pagină specială din /diaspora. */
export default async function Page({ params }: Props) {
  return <DiasporaPage a={(await params).a} />;
}

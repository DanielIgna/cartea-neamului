import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";

type Props = { params: Promise<{ a: string; b: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await params;
  return diasporaMetadata(a, b);
}

/** Un stat, o provincie sau un oraș din /diaspora/statele-unite sau /diaspora/canada. */
export default async function Page({ params }: Props) {
  const { a, b } = await params;
  return <DiasporaPage a={a} b={b} />;
}

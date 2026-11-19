import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-access";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { DiasporaPage } from "@/components/diaspora/DiasporaPages";
import type { Lang } from "@/lib/diaspora";

export const metadata: Metadata = { title: "Ciornă diaspora", robots: PRIVATE_ROBOTS };

type Props = { params: Promise<{ p: string[] }>; searchParams: Promise<{ l?: string }> };

/** Previzualizarea unei ciorne de diaspora (/admin/seo/diaspora/<țară>[/<regiune>]?l=<limba>), doar pentru admin. */
export default async function Page({ params, searchParams }: Props) {
  const { p } = await params;
  await requireAdmin(`/admin/seo/diaspora/${p.join("/")}`);
  const { l } = await searchParams;
  return <DiasporaPage a={p[0]} b={p[1]} preview={{ lang: l as Lang | undefined }} />;
}

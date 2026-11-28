import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import DesignBy, { DESIGN_PATH, designText } from "@/components/DesignBy";
import { publicPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = designText(locale);
  return publicPageMetadata({ path: DESIGN_PATH, title: t.metaTitle, description: t.metaDescription, locale });
}

/** „Design by Cartea Neamului”: pentru cine caută numele după ce a văzut un produs „designed by Cartea Neamului”. */
export default async function DesignByPage() {
  return <DesignBy locale={await getLocale()} />;
}

import type { Metadata } from "next";
import ChurchHistory from "@/components/ChurchHistory";
import PageIntl from "@/i18n/PageIntl";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Church");
  return { title: `${t("meta.title")} · Cartea Neamului`, description: t("meta.description") };
}

/** Pagină deschisă tuturor, fără cont: istoria Bisericii prigonite, scrisă de mână, în limba cititorului. */
export default function ChurchHistoryPage() {
  return <PageIntl ns={["Church"]}><ChurchHistory /></PageIntl>;
}

import type { Metadata } from "next";
import ChurchHistory from "@/components/ChurchHistory";
import PageIntl from "@/i18n/PageIntl";
import { getAppName, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Church");
  return { title: `${t("meta.title")} · ${await getAppName()}`, description: t("meta.description"), alternates: { canonical: "/libertatea-de-a-crede" } };
}

/** Pagină deschisă tuturor, fără cont: „Libertatea de a crede”, istoria creștinismului și a celor prigoniți pentru credință, scrisă de mână, în limba cititorului. */
export default function LibertateaDeACredePage() {
  return <PageIntl ns={["Church"]}><ChurchHistory /></PageIntl>;
}

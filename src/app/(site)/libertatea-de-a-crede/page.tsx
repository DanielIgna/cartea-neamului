import type { Metadata } from "next";
import ChurchHistory from "@/components/ChurchHistory";
import JsonLd from "@/components/JsonLd";
import PageIntl from "@/i18n/PageIntl";
import { getT } from "@/i18n/server";
import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";

/** Titlul (cu tot cu „| Istoria creștinismului”) și descrierea, în limba cititorului; roboții, fără cookie, primesc româna. */
async function seo() {
  const t = await getT("Church");
  return { path: "/libertatea-de-a-crede", title: t("meta.title"), description: t("meta.description") };
}
export async function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata(await seo());
}

/** Pagină deschisă tuturor, fără cont: „Libertatea de a crede”, istoria creștinismului și a celor prigoniți pentru credință, scrisă de mână, în limba cititorului. */
export default async function LibertateaDeACredePage() {
  return <><JsonLd data={webPageJsonLd(await seo())} /><PageIntl ns={["Church"]}><ChurchHistory /></PageIntl></>;
}

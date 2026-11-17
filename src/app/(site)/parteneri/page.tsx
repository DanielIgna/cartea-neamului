import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { partnerState } from "@/lib/partners";
import PartnersView from "@/components/PartnersView";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("PartnersPage");
  return publicPageMetadata({ path: "/parteneri", title: t("metaTitle"), description: t("metaDescription"), locale: await getLocale() });
}

/**
 * Singura pagină cu partenerii (acum doar PropManage). Nu apare nicăieri în arbore, în amintiri, în cronologie, pe hartă sau
 * în carte: se ajunge aici doar din meniul contului și din subsol. Legătura spre partener poartă doar UTM-ul, iar sigla e
 * pusă la noi (public/parteneri), ca browserul să nu ceară nimic de la partener până nu apasă omul pe legătură.
 */
export default async function PartnersPage() {
  const [me, t, locale] = await Promise.all([currentUser(), getT("PartnersPage"), getLocale()]);
  return <><JsonLd data={webPageJsonLd({ path: "/parteneri", title: t("metaTitle"), description: t("metaDescription"), locale })} /><PartnersView state={me ? await partnerState(db, me.id).catch(() => null) : null} /></>;
}

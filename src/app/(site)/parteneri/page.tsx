import { publicPageMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { partnerState } from "@/lib/partners";
import PartnersView from "@/components/PartnersView";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("PartnersPage");
  return publicPageMetadata({ path: "/parteneri", title: t("metaTitle"), description: t("metaDescription") });
}

/**
 * Singura pagină cu partenerii (acum doar PropManage). Nu apare nicăieri în arbore, în amintiri, în cronologie, pe hartă sau
 * în carte: se ajunge aici doar din meniul contului și din subsol. Legătura spre partener poartă doar UTM-ul, iar sigla e
 * pusă la noi (public/parteneri), ca browserul să nu ceară nimic de la partener până nu apasă omul pe legătură.
 */
export default async function PartnersPage() {
  const me = await currentUser();
  return <PartnersView state={me ? await partnerState(db, me.id).catch(() => null) : null} />;
}

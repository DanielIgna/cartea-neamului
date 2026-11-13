import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { person, tree } from "@/db/schema";
import { requireUser, roleIn, can } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { loadTreeMap } from "@/lib/map-data";
import { placeMatches, storeSharedPlaces } from "@/lib/shared-places";
import FamilyMap from "@/components/FamilyMap";
import PageIntl from "@/i18n/PageIntl";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** Harta neamului: satele și orașele din fișe, cu oamenii născuți, îngropați sau care trăiesc acolo, și amintirile petrecute acolo. */
export default async function MapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loc?: string }> }) {
  const { id } = await params;
  const { loc } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/harta`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [tr] = await db.select({ name: tree.name, discoverable: tree.discoverable }).from(tree).where(eq(tree.id, id));
  if (!tr) notFound();
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const locale = await getLocale();
  const [t, tl] = await Promise.all([getT("Map", locale), getT("Lada", locale)]);
  const data = await loadTreeMap(db, id, { userId: me.id, personId: mine?.id ?? null }, {
    locale, born: (y, sex) => t("bornYear", { year: String(y), sex }), died: (y, sex) => t("diedYear", { year: String(y), sex }),
    countryOnly: t("countryOnlyDetail"), pinned: t("pinnedDetail"), pinnedGroup: t("pinnedGroup"),
    memory: { quoted: (text) => tl("quoted", { text }), voice: tl("untitledVoice"), plain: tl("untitled") },
  });
  // Satele pe care le văd celelalte neamuri țin pasul cu harta (de pildă după ce un loc e mutat pe hartă).
  if (tr.discoverable) await storeSharedPlaces(db, id, data.shared).catch((e) => console.error("Din aceleași locuri", e));
  const [{ n: treeTotal }] = await db.select({ n: sql<number>`count(*)::int` }).from(person).where(eq(person.treeId, id));
  const matches = tr.discoverable ? await placeMatches(db, id, me.id) : [];
  return (
    <PageIntl ns={["Map", "Nearby"]}>
      <FamilyMap treeId={id} treeName={tr.name} data={data} canEdit={can(role, "contributor")} focus={typeof loc === "string" ? loc : null}
        nearby={{ on: tr.discoverable, owner: role === "owner", demo: isDemo(me.email), matches }} treeTotal={treeTotal} />
    </PageIntl>
  );
}

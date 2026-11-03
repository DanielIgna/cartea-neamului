import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree } from "@/db/schema";
import { requireUser, roleIn, can } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { loadTreeMap } from "@/lib/map-data";
import { placeMatches, storeSharedPlaces } from "@/lib/shared-places";
import FamilyMap from "@/components/FamilyMap";

export const dynamic = "force-dynamic";

/** Harta neamului: satele și orașele din fișe, cu oamenii născuți, îngropați sau care trăiesc acolo. */
export default async function MapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loc?: string }> }) {
  const { id } = await params;
  const { loc } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/harta`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [t] = await db.select({ name: tree.name, discoverable: tree.discoverable }).from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const data = await loadTreeMap(db, id);
  // Satele pe care le văd celelalte neamuri țin pasul cu harta (de pildă după ce un loc e mutat pe hartă).
  if (t.discoverable) await storeSharedPlaces(db, id, data.shared).catch((e) => console.error("Din aceleași locuri", e));
  const matches = t.discoverable ? await placeMatches(db, id, me.id) : [];
  return <FamilyMap treeId={id} treeName={t.name} data={data} canEdit={can(role, "contributor")} focus={typeof loc === "string" ? loc : null}
    nearby={{ on: t.discoverable, owner: role === "owner", demo: isDemo(me.email), matches }} />;
}

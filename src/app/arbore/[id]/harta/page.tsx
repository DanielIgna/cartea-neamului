import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree } from "@/db/schema";
import { requireUser, roleIn, can } from "@/lib/access";
import { loadTreeMap } from "@/lib/map-data";
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
  const [t] = await db.select({ name: tree.name }).from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const data = await loadTreeMap(db, id);
  return <FamilyMap treeId={id} treeName={t.name} data={data} canEdit={can(role, "contributor")} focus={typeof loc === "string" ? loc : null} />;
}

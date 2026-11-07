import { notFound } from "next/navigation";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { person } from "@/db/schema";
import { loadTreeView, MAX_GENERATIONS } from "@/lib/tree-data";
import { requireUser, roleIn, can } from "@/lib/access";
import { loadTreeLive } from "@/lib/realtime";
import { aiConfigured } from "@/lib/ai";
import { storageConfigured } from "@/lib/storage";
import TreeScreen from "@/components/TreeScreen";
import PageIntl from "@/i18n/PageIntl";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function TreePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string; g?: string }> }) {
  const { id } = await params;
  const { p, g } = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  // Cine și-a revendicat profilul în arbore pornește din propria fișă: el e în centru și continuă de acolo.
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const generations = Math.min(Math.max(Number(g) || 5, 2), MAX_GENERATIONS);
  const start = mine?.id;
  const [data, live] = await Promise.all([loadTreeView(db, id, p && UUID.test(p) ? p : start, generations, await getLocale()), loadTreeLive(db, me.id, id)]);
  if (!data || !data.centerId || !data.slots[1]) notFound();
  const home = start ?? data.rootId;
  return (
    <PageIntl ns={["Tree", "Person", "Charts", "Times", "Vremuri", "Duplicates", "PersonForm", "Media", "Relations"]}>
      <TreeScreen treeId={id} treeName={data.tree.name} slots={data.slots} people={data.people} rels={data.rels} raised={data.raised} centerId={data.centerId} generations={generations}
        meId={me.id} isEditor={can(role, "editor")} isRoot={data.centerId === home} canAdd={can(role, "contributor")} canInvite={can(role, "editor")}
        live={live && { ...live, url: process.env.NEON_REALTIME_URL!, userId: me.id }} aiEnabled={aiConfigured()} storageEnabled={storageConfigured()} />
    </PageIntl>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/db";
import { loadTreeView } from "@/lib/tree-data";
import { requireUser, roleIn, can } from "@/lib/access";
import { loadTreeLive } from "@/lib/realtime";
import { aiConfigured } from "@/lib/ai";
import { storageConfigured } from "@/lib/storage";
import TreeScreen from "@/components/TreeScreen";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function TreePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string }> }) {
  const { id } = await params;
  const { p } = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [data, live] = await Promise.all([loadTreeView(db, id, p && UUID.test(p) ? p : undefined), loadTreeLive(db, me.id, id)]);
  if (!data || !data.centerId || !data.slots[1]) notFound();
  return (
    <TreeScreen treeId={id} treeName={data.tree.name} slots={data.slots} isRoot={data.centerId === data.rootId} canAdd={can(role, "contributor")} canInvite={can(role, "editor")}
      live={live && { ...live, url: process.env.NEON_REALTIME_URL!, userId: me.id }} aiEnabled={aiConfigured()} storageEnabled={storageConfigured()} />
  );
}

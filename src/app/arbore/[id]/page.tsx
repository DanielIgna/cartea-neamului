import { notFound } from "next/navigation";
import { db } from "@/db";
import { loadTreeView } from "@/lib/tree-data";
import { ensureSchema } from "@/lib/bootstrap";
import TreeScreen from "@/components/TreeScreen";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function TreePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const { p } = await searchParams;
  if (!UUID.test(id)) notFound();
  const data = await loadTreeView(db, id, p && UUID.test(p) ? p : undefined);
  if (!data || !data.centerId || !data.slots[1]) notFound();
  return <TreeScreen treeId={id} treeName={data.tree.name} slots={data.slots} isRoot={data.centerId === data.rootId} />;
}

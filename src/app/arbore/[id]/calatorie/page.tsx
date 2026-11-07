import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { birthOrigins } from "@/lib/origins";
import { isDemo } from "@/lib/demo";
import { baseWord } from "@/lib/texte";
import TimeJourney from "@/components/TimeJourney";

export const dynamic = "force-dynamic";
export const metadata = { title: "Călătoria în timp · Cartea Neamului" };
const UUID = /^[0-9a-f-]{36}$/i;

/** Călătoria în timp: nava pornește din prezent, de la cel din centru (implicit fișa ta), și coboară pe cele două spițe. */
export default async function Journey({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string }> }) {
  const { id } = await params;
  const { p } = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/calatorie`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const data = await loadTreeView(db, id, p && UUID.test(p) ? p : mine?.id, 2);
  if (!data || !data.centerId) notFound();
  const [origins, base] = await Promise.all([birthOrigins(db, id), baseWord(db)]);
  return (
    <TimeJourney treeId={id} treeName={data.tree.name} meId={me.id} centerId={data.centerId} people={data.people} rels={data.rels} origins={origins}
      word={data.tree.journeyWord ?? null} defaultWord={base} isOwner={role === "owner"} demo={isDemo(me.email)} />
  );
}

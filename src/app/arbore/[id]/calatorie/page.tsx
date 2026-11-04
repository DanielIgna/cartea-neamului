import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView, MAX_GENERATIONS } from "@/lib/tree-data";
import { birthOrigins } from "@/lib/origins";
import { requireUser, roleIn } from "@/lib/access";
import type { Traveller } from "@/lib/calatorie";
import TimeJourney from "@/components/TimeJourney";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function JourneyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string }> }) {
  const { id } = await params;
  const { p } = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/calatorie`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const [data, origins] = await Promise.all([loadTreeView(db, id, p && UUID.test(p) ? p : mine?.id, MAX_GENERATIONS), birthOrigins(db, id)]);
  if (!data || !data.centerId) notFound();
  // Clientului îi dăm doar ce arată călătoria, nu toată fișa.
  const people: Record<string, Traveller> = {};
  for (const x of Object.values(data.people)) {
    people[x.id] = { id: x.id, name: x.name, givenName: x.givenName, sex: x.sex, birthYear: x.birthYear, deathYear: x.deathYear, approx: x.approx, living: x.living, discreet: x.discreet,
      birthPlace: x.birthPlace, occupation: x.occupation, biography: x.biography };
  }
  return <TimeJourney treeId={id} treeName={data.tree.name} centerId={data.centerId} people={people} rels={data.rels} origins={origins} />;
}

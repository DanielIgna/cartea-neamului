import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { buildGraph } from "@/lib/kinship";
import { loadLada } from "@/lib/lada-db";
import { questionContext } from "@/lib/lada";
import { bookFor } from "@/lib/autobiografie";
import { lifeDates } from "@/lib/person-text";
import Autobiography from "@/components/Autobiography";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/** Autobiografia e a celui care o scrie: doar el, cât e în viață și cu fișa lui revendicată. Ceilalți văd ce le dă voie, în povestea de pe profil. */
export default async function AutobiographyPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}/autobiografie`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const data = await loadTreeView(db, id, undefined, 1);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const back = `/arbore/${id}/persoana/${pid}`;
  if (!p.living || p.claimedBy !== me.id) {
    return (
      <section className="card" style={{ maxWidth: 640, margin: "24px auto" }}>
        <h1 style={{ marginTop: 0 }}>Autobiografia</h1>
        <p>{!p.living ? "Autobiografia e pentru cei în viață, care își scriu singuri cartea." : `Doar ${p.givenName} își poate scrie autobiografia, din contul ${p.sex === "F" ? "ei" : "lui"}.`}</p>
        <Link className="btn" href={back}>Înapoi la profil</Link>
      </section>
    );
  }
  const g = buildGraph(Object.values(data.people), data.rels);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);
  const ctx = questionContext(g, data.people, pid);
  if (!ctx) notFound();
  return <Autobiography treeId={id} personId={pid} name={p.name} dates={lifeDates(p)} back={back} book={bookFor(ctx)} memories={lada.own} />;
}

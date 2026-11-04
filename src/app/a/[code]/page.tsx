import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memory, person, tree } from "@/db/schema";
import { requireUser, roleIn } from "@/lib/access";
import { memoryVisible } from "@/lib/lada-db";
import { fromShortCode } from "@/lib/short-link";

export const dynamic = "force-dynamic";
export const metadata = { title: "O amintire din Cartea neamului" };

function Note({ children }: { children: React.ReactNode }) {
  return (
    <section className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="section-label" style={{ marginTop: 0 }}>O amintire din Cartea neamului</div>
      {children}
      <p style={{ marginBottom: 0 }}><Link href="/">Mergi la arborii tăi</Link></p>
    </section>
  );
}

/**
 * Unde duce codul QR de lângă o amintire din Cartea neamului, tipărită: la amintire, în lada omului, cu glasul lui.
 * Se deschide doar pentru cine e în arbore și are voie s-o vadă, ca pe site; ceilalți află pe cine să roage.
 */
export default async function ShortMemoryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const id = fromShortCode(code);
  if (!id) notFound();
  const me = await requireUser(`/a/${code}`);
  const [m] = await db.select().from(memory).where(eq(memory.id, id));
  if (!m) return <Note><p>Amintirea nu mai e în ladă: poate a fost ștearsă de cel care a scris-o.</p></Note>;
  const [t] = await db.select({ name: tree.name }).from(tree).where(eq(tree.id, m.treeId));
  if (!(await roleIn(db, m.treeId, me.id))) {
    return <Note><p>Amintirea e în arborele „{t?.name ?? "familiei"}”. Ca s-o asculți, roagă o rudă din arbore să-ți trimită o invitație, apoi deschide din nou codul.</p></Note>;
  }
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, m.treeId), eq(person.claimedByUserId, me.id))).limit(1);
  if (!(await memoryVisible(db, m, { userId: me.id, personId: mine?.id ?? null }))) {
    return <Note><p>Cel care a scris amintirea a lăsat-o acum doar pentru o parte din familie, așa că nu se deschide pentru tine.</p></Note>;
  }
  redirect(`/arbore/${m.treeId}/persoana/${m.personId}#amintire-${m.id}`);
}

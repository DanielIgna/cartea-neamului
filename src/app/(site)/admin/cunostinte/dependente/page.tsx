import { db } from "@/db";
import { requireFounder } from "@/lib/admin-access";
import { EDGE_LABEL, NODE_COLS, buildGraph, countBy, knowledge } from "@/lib/cunostinte/verificare";
import CunostinteHead from "@/components/admin/CunostinteHead";
import { DepGraph } from "@/components/admin/Cunostinte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Harta dependențelor · Admin" };

/**
 * Admin → Harta dependențelor: documente → motoare → metrici → automatizări → API → tabele → panouri. Fiecare legătură e
 * verificată (roșu = duce la ceva ce nu mai există, punctat = nu s-a putut verifica). Hartă cu zoom sau matrice.
 */
export default async function Dependente() {
  await requireFounder("/admin/cunostinte/dependente");
  const k = await knowledge(db);
  const counts = countBy(k.docs.map((d) => d.status));
  const g = buildGraph(k.evals, k.docs, k.facts);
  return (
    <section className="stack kc">
      <CunostinteHead s={k.summary} active="dependente" counts={counts} />
      <DepGraph nodes={g.nodes} edges={g.edges} cols={NODE_COLS} legend={Object.entries(EDGE_LABEL).map(([key, label]) => ({ key, label }))} />
    </section>
  );
}

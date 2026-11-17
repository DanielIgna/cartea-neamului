import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree } from "@/db/schema";
import { requireUser, roleInTree, can } from "@/lib/access";
import { SITE_URL } from "@/lib/site-url";
import { embedCode, widgetData, widgetForTree } from "@/lib/widget-arbore";
import CopyLink from "@/components/admin/CopyLink";
import { saveWidget, stopWidget } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Widgetul „Arborele meu”", robots: { index: false, follow: false } };
const UUID = /^[0-9a-f-]{36}$/i;

/** Pornirea widgetului „Arborele meu” pentru un arbore (src/lib/widget-arbore.ts): titlul, previzualizarea și codul de pus pe blog. */
export default async function TreeWidget({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/widget`);
  const role = await roleInTree(db, id, me.id);
  if (!role) notFound();
  const [t] = await db.select({ name: tree.name }).from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const editor = can(role, "editor");
  const cur = await widgetForTree(db, id);
  const data = cur ? await widgetData(db, cur.token) : null;
  const code = cur ? embedCode(cur.token, cur.setting.title, SITE_URL) : "";
  return (
    <section className="stack" lang="ro">
      <p><Link href={`/arbore/${id}`}>← Înapoi la arbore</Link></p>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Widgetul „Arborele meu”</h1>
        <p>O fișă mică a neamului vostru, pe care o puteți pune pe blogul familiei, pe site-ul satului sau pe pagina asociației. Arată doar cifre: câte persoane are arborele, câte generații, anul celui mai vechi strămoș și din câte locuri vine familia. <b>Nu apare niciun nume</b> în afară de titlul ales de voi și nimic despre cei în viață.</p>
        {!editor && <p className="muted">Widgetul îl poate porni proprietarul arborelui sau un editor.</p>}
        {editor && (
          <form action={saveWidget.bind(null, id)} className="stack" style={{ gap: 8, maxWidth: 460 }}>
            <label>Titlul fișei
              <input name="title" defaultValue={cur?.setting.title ?? (/^(neamul|familia|arborele)\b/i.test(t.name) ? t.name : `Neamul ${t.name}`)} maxLength={60} required />
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" type="submit">{cur ? "Salvează titlul" : "Pornește widgetul"}</button>
              {cur && <button className="btn" formAction={stopWidget.bind(null, id)} type="submit">Oprește widgetul</button>}
            </div>
          </form>
        )}
      </div>
      {cur && data && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cum arată</h2>
          <iframe src={`/widget/arbore/${cur.token}`} width={320} height={230} style={{ border: 0, maxWidth: "100%" }} title={data.title} />
          <h2>Codul de pus pe site</h2>
          <p className="muted" style={{ marginTop: 0 }}>Copiați codul de mai jos în pagina blogului (în modul HTML al editorului). Cifrele se actualizează singure când arborele crește.</p>
          <textarea readOnly value={code} rows={5} style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }} />
          <p><CopyLink url={code} label="Copiază codul" /></p>
          <p className="muted small" style={{ marginBottom: 0 }}>Dacă opriți widgetul, fișa de pe celelalte site-uri arată doar „Widgetul nu mai e pornit”. Mai multe despre widget: <Link href="/arborele-meu">Arborele meu</Link>.</p>
        </div>
      )}
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import InvitatieForm from "@/components/admin/InvitatieForm";
import { ImagesEditor, ZipUpload } from "@/components/admin/InvitatieFisiere";
import StatusPill from "@/components/admin/InvitatieStare";
import { deleteProductAction, productStatusAction } from "@/app/invitatii-nunta-actions";
import { modelPath, publishProblems } from "@/lib/invitatii-nunta";
import { TEXT_LOCALES, productById, salesOf } from "@/lib/invitatii-nunta-produse";
import { localeNames, whenRo } from "@/lib/invitatii-nunta-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Model · Invitații de nuntă · Admin" };

const OK: Record<string, string> = {
  nou: "Am creat modelul ca ciornă. Acum urcă ZIP-ul și pozele, apoi apasă „Publică”.",
  salvat: "Am salvat schimbările. Paginile publice se refac imediat.",
  publish: "Modelul e publicat: apare pe site și în sitemap.",
  retract: "Modelul e retras (ciornă): nu mai apare pe site. Comenzile plătite se descarcă în continuare.",
  archive: "Modelul e arhivat: nu mai apare pe site. Comenzile plătite se descarcă în continuare.",
};

/**
 * Admin → Invitații de nuntă → un model: starea (Publică / Retrage / Arhivează), ZIP-ul, pozele, textele și ștergerea (doar fără
 * vânzări, cu slugul scris ca confirmare).
 */
export default async function AdminInvitatieModel({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  await requireAdmin(`/admin/invitatii-nunta/${id}`);
  const q = await searchParams;
  const p = await productById(db, id);
  if (!p) notFound();
  const sales = await salesOf(db, p.slug);
  const problems = publishProblems(p);
  const r = p.row;
  return (
    <section className="stack">
      <AdminNav active="invitatii-nunta" />
      <p><Link href="/admin/invitatii-nunta">← Înapoi la modele</Link></p>
      {q.ok && OK[q.ok] && <p className="cc-ok" role="status">{OK[q.ok]}</p>}
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      <div className="card">
        <div className="shopadm-head">
          <h1 style={{ margin: 0 }}>{p.texts.ro?.name ?? p.slug} <StatusPill status={p.status} /></h1>
          {p.status === "published" && <Link className="btn" href={modelPath(p)} target="_blank">Vezi pagina ↗</Link>}
        </div>
        <p className="muted">Slug: <code>{p.slug}</code> · vânzări: <b>{sales}</b> · actualizat: {whenRo(p.updatedAt)}{r.publishedAt ? ` · publicat prima dată: ${whenRo(r.publishedAt)}` : ""}</p>
        {p.status !== "published" && problems.length > 0 && (
          <div><p style={{ marginBottom: 4 }}><b>Ca să-l poți publica, mai trebuie:</b></p><ul style={{ marginTop: 0 }}>{problems.map((x) => <li key={x}>{x}</li>)}</ul></div>
        )}
        <div className="shopadm-actions">
          {p.status !== "published" && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="publish" />
              <button type="submit" className="btn primary" disabled={problems.length > 0}>Publică</button></form>
          )}
          {p.status === "published" && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="retract" />
              <button type="submit" className="btn">Retrage (ciornă)</button></form>
          )}
          {p.status !== "archived" && sales > 0 && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="archive" />
              <button type="submit" className="btn">Arhivează</button></form>
          )}
        </div>
      </div>
      <ZipUpload id={p.id} current={p.zipKey ? { name: p.zipName ?? `${p.slug}.zip`, size: r.zipSize, files: r.zipFiles, at: r.zipUpdatedAt ? whenRo(r.zipUpdatedAt) : null, version: r.zipVersion } : null} />
      <ImagesEditor id={p.id} images={p.images} />
      <InvitatieForm model={{ ...p, sort: r.sort }} locales={localeNames(TEXT_LOCALES)} slugLocked={!!p.zipKey || sales > 0} />
      <div className="card shopadm-danger">
        <h2 style={{ marginTop: 0 }}>Ștergerea modelului</h2>
        {sales > 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>Modelul are {sales} {sales === 1 ? "vânzare" : "vânzări"}, deci nu se poate șterge (clienții au linkuri spre el). Îl poți arhiva: dispare de pe site, iar linkurile plătite merg mai departe.</p>
        ) : (
          <form action={deleteProductAction} className="stack">
            <input type="hidden" name="rid" value={p.id} />
            <p className="muted" style={{ margin: 0 }}>Se șterg modelul, ZIP-ul și pozele lui urcate. Nu se poate da înapoi. Ca să confirmi, scrie slugul: <code>{p.slug}</code></p>
            <input name="confirm" required autoComplete="off" pattern={p.slug.replace(/-/g, "\\-")} aria-label="Slugul modelului, pentru confirmare" />
            <p style={{ margin: 0 }}><button type="submit" className="btn shopadm-delete">Șterge definitiv</button></p>
          </form>
        )}
      </div>
    </section>
  );
}

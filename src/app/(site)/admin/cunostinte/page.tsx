import Link from "next/link";
import { db } from "@/db";
import { requireFounder } from "@/lib/admin-access";
import { DOC_CATEGORY, DOC_KIND, DOC_STATUS, type DocCategory } from "@/lib/cunostinte/documente";
import { fnByKey } from "@/lib/cunostinte/functii";
import { countBy, knowledge, type DocEval } from "@/lib/cunostinte/verificare";
import { fold } from "@/lib/admin-menu";
import { day } from "@/components/admin/ui";
import CunostinteHead from "@/components/admin/CunostinteHead";
import { DocForm } from "@/components/admin/Cunostinte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centru de cunoștințe · Admin" };

/** Căutarea: cuvinte libere + stare:activ, tip:regula, categorie:bani (fără diacritice, după început). */
function matches(d: DocEval, q: string) {
  const parts = fold(q).split(/\s+/).filter(Boolean);
  const hay = fold(`${d.doc.id} ${d.doc.title} ${d.doc.summary} ${d.doc.rules.join(" ")} ${(d.doc.open ?? []).join(" ")} ${d.doc.source.join(" ")}`);
  return parts.every((p) => {
    const [k, v] = p.includes(":") ? p.split(":", 2) : [null, p];
    if (k === "stare" || k === "status") return fold(`${d.status} ${DOC_STATUS[d.status].label}`).includes(v);
    if (k === "tip" || k === "artifact") return fold(`${d.doc.kind} ${DOC_KIND[d.doc.kind]}`).includes(v);
    if (k === "categorie" || k === "category") return fold(`${d.doc.category} ${DOC_CATEGORY[d.doc.category]}`).includes(v);
    return hay.includes(v);
  });
}

function DocCard({ d, open }: { d: DocEval; open?: boolean }) {
  const st = DOC_STATUS[d.status];
  return (
    <li id={d.doc.id}>
      <details className="card kc-doc" open={open}>
        <summary>
          <span className="kc-doc-ico" aria-hidden="true">▤</span>
          <span className="kc-doc-t">{d.doc.id} · {d.doc.title}<small className="muted">v{d.doc.version} · {d.health == null ? "fără funcții legate" : `sănătate ${d.health}%`} · {DOC_CATEGORY[d.doc.category]}</small></span>
          <span className="kc-pills"><span className="pill">{DOC_KIND[d.doc.kind]}</span><span className={`pill ${st.tone}`}>{st.label}</span></span>
        </summary>
        <p style={{ marginTop: 10 }}>{d.doc.summary}</p>
        {d.reasons.length > 0 && <p className="kc-why"><b>De revizuit:</b> {d.reasons.join(" · ")}</p>}
        {d.doc.rules.length > 0 && <ul className="kc-rules">{d.doc.rules.map((r) => <li key={r}>{r}</li>)}</ul>}
        {d.doc.open?.length ? <><h3 className="kc-h3">Încă deschis</h3><ul className="kc-rules open">{d.doc.open.map((r) => <li key={r}>{r}</li>)}</ul></> : null}
        <p className="muted" style={{ fontSize: 13 }}>
          Sursa: {d.doc.source.join(" · ")}<br />
          {d.doc.governs.length > 0 && <>Guvernează: {d.doc.governs.map((k, i) => <span key={k}>{i ? ", " : ""}<Link href={`/admin/cunostinte/functii#${k}`}>{fnByKey(k)?.name ?? k}</Link></span>)}<br /></>}
          {d.doc.replacedBy && <>Înlocuit de <Link href={`/admin/cunostinte?q=${d.doc.replacedBy}`}>{d.doc.replacedBy}</Link><br /></>}
          Hotărât pe {day(d.doc.date)} · {d.reviewedAt ? `recitit pe ${day(d.reviewedAt)}` : "nerecitit încă"} · următoarea revizuire: {day(d.nextReview)}
          {d.note && <><br />Notița ta: {d.note}</>}
        </p>
        <DocForm id={d.doc.id} status={d.status} note={d.note} />
      </details>
    </li>
  );
}

/**
 * Admin → Centru de cunoștințe (doar fondatori): registrul hotărârilor, regulilor, auditurilor și planurilor, cu stare,
 * categorii, căutare și coada de revizuire. Textele sunt în src/lib/cunostinte/documente.ts; starea se schimbă de aici.
 */
export default async function Cunostinte({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; v?: string }> }) {
  await requireFounder("/admin/cunostinte");
  const sp = await searchParams;
  const k = await knowledge(db);
  const counts = countBy(k.docs.map((d) => d.status));
  const review = sp.v === "revizuire";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const cat = sp.cat && sp.cat in DOC_CATEGORY ? (sp.cat as DocCategory) : null;
  const catCounts = countBy(k.docs.map((d) => d.doc.category));
  const list = review ? k.queue : k.docs.filter((d) => (!cat || d.doc.category === cat) && (!q || matches(d, q)))
    .sort((a, b) => ["activ", "revizuire", "ciorna", "arhivat"].indexOf(a.status) - ["activ", "revizuire", "ciorna", "arhivat"].indexOf(b.status) || a.doc.id.localeCompare(b.doc.id));

  return (
    <section className="stack kc">
      <CunostinteHead s={k.summary} active={review ? "revizuire" : "documente"} counts={counts} q={q} />
      {review ? (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>De revizuit</h2>
          <p className="muted" style={{ marginBottom: 0 }}>Documentele marcate „De revizuit” sau ciornă, cele cu data de recitire trecută și cele care guvernează o funcție cu roșu. „Am recitit azi” mută următoarea revizuire mai încolo.</p>
        </div>
      ) : (
        <nav className="kc-cats" aria-label="Categorii">
          <Link href="/admin/cunostinte" className={!cat ? "on" : ""}>Toate<b>{k.docs.length}</b></Link>
          {(Object.keys(DOC_CATEGORY) as DocCategory[]).filter((c) => catCounts[c]).map((c) => (
            <Link key={c} href={`/admin/cunostinte?cat=${c}`} className={cat === c ? "on" : ""}>{DOC_CATEGORY[c]}<b>{catCounts[c]}</b></Link>
          ))}
        </nav>
      )}
      {q && <p className="muted">Caut „{q}”: {list.length} {list.length === 1 ? "document" : "documente"}. <Link href="/admin/cunostinte">Arată tot</Link></p>}
      {list.length === 0 ? <p className="card muted">{review ? "Nimic de revizuit acum." : "Niciun document nu se potrivește."}</p> : (
        <ul className="kc-doclist">{list.map((d) => <DocCard key={d.doc.id} d={d} open={list.length === 1} />)}</ul>
      )}
      <p className="muted" style={{ fontSize: 13 }}>
        Documentele se scriu în cod (src/lib/cunostinte/documente.ts), ca să aibă istoric; starea și recitirea se țin aici. Exportă tot: <Link href="/admin/cunostinte/export?ce=documente&format=json">JSON</Link> · <Link href="/admin/cunostinte/export?ce=documente&format=csv">CSV</Link>
      </p>
    </section>
  );
}

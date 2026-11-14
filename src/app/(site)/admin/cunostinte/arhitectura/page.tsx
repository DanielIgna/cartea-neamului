import Link from "next/link";
import { db } from "@/db";
import { requireFounder } from "@/lib/admin-access";
import { LAYER, architecture } from "@/lib/cunostinte/arhitectura";
import { countBy, knowledge } from "@/lib/cunostinte/verificare";
import CunostinteHead from "@/components/admin/CunostinteHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Navigator de arhitectură · Admin" };

const REPO = "https://github.com/danieligna/cartea-neamului/blob/main/";

/**
 * Admin → Navigator de arhitectură: de la regulile lui Daniel până la client, strat cu strat. Fiecare bloc se deschide și arată
 * fișierele reale, verificate în codul publicat (roșu = nu mai există). Doar fondatorii.
 */
export default async function Arhitectura() {
  await requireFounder("/admin/cunostinte/arhitectura");
  const k = await knowledge(db);
  const a = architecture();
  let last = "";
  return (
    <section className="stack kc">
      <CunostinteHead s={k.summary} active="arhitectura" counts={countBy(k.docs.map((d) => d.status))} />
      <div className="card">
        <p style={{ margin: 0 }}>De la reguli până la client: fiecare bloc se deschide și arată fișierele din spatele lui. {a.stats.files} fișiere verificate
          {a.stats.missing ? <b className="t-bad"> · {a.stats.missing} lipsă</b> : <b className="t-ok"> · toate există</b>} · {a.stats.pages} pagini · {a.stats.api} adrese API ·
          {" "}{a.stats.docs} documente active · {a.stats.functions} funcții. Legăturile între ele: <Link href="/admin/cunostinte/dependente">Harta dependențelor</Link>.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {a.blocks.map((b, i) => {
          const head = b.layer !== last;
          last = b.layer;
          const missing = b.files.filter((f) => !f.ok).length;
          return (
            <div key={b.id}>
              {i > 0 && <div aria-hidden style={{ textAlign: "center", opacity: 0.5, lineHeight: "22px" }}>↓</div>}
              <details className="card" style={{ margin: 0, borderColor: missing ? "var(--bad, #b8432f)" : undefined }}>
                <summary style={{ cursor: "pointer", listStyle: "none" }}>
                  {head && <div className="section-label" style={{ marginTop: 0 }}>{LAYER[b.layer]}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{b.title}</b>
                    <span className="muted small" style={{ whiteSpace: "nowrap" }}>{b.count ? `${b.count} · ` : ""}{b.files.length} fișiere{missing ? ` · ${missing} lipsă` : ""}</span>
                  </div>
                  <div className="muted small">{b.what}</div>
                </summary>
                <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {b.files.map((f) => <li key={f.path}><span className={f.ok ? "t-ok" : "t-bad"}>{f.ok ? "✓" : "✗"}</span>{" "}
                    {f.ok ? <a href={`${REPO}${f.path}`} target="_blank" rel="noopener noreferrer"><code>{f.path}</code></a> : <code>{f.path}</code>}</li>)}
                </ul>
                {b.href && <p className="small" style={{ margin: "8px 0 0" }}><Link href={b.href}>Deschide în Admin →</Link></p>}
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}

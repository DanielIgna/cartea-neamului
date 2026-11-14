import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { NOTICE_DAYS, archiveOverview, type ArchiveEvent } from "@/lib/arhivare";
import { coldArchiveConfigured } from "@/lib/storage";
import { emailReady } from "@/lib/email";
import { AdminNav, day } from "@/components/admin/ui";
import ArchiveForm from "@/components/admin/ArchiveForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arhivă · Admin" };

const EVENT: Record<ArchiveEvent, string> = { arhivare: "intră în arhiva sigilată", reducere: "rămân doar pozele în mic" };

/**
 * Arhiva sigilată (Daniel, 2026-11-14, varianta B): comutatorul, termenii, câte fișiere sunt online, în arhivă și micșorate,
 * și ce urmează pentru fiecare arbore, cu emailurile de anunț deja trimise.
 */
export default async function AdminArchive() {
  await requireAdmin("/admin/arhiva");
  const o = await archiveOverview(db);
  const s = o.settings;
  const pending = o.plans.filter((p) => !p.doneAt);
  const done = o.plans.filter((p) => p.doneAt);
  return (
    <section className="stack">
      <AdminNav active="arhiva" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Arhiva sigilată</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          După anul plătit, dacă nimeni din arbore nu reînnoiește și nu ia Păstrarea, originalele pozelor și ale actelor scanate mai stau
          întregi {s.freeYears === 1 ? "un an" : `${s.freeYears} ani`}. Cu cartea PDF, trec comprimate în arhiva sigilată pentru {s.sealYears} ani;
          fără ea, rămân doar pozele în mic. Glasurile, actele PDF și textele nu se ating. Anunțuri pe email: cu {NOTICE_DAYS.arhivare.join(" și ")} zile
          înainte de mutare, cu {NOTICE_DAYS.reducere.join(", ")} zile înainte de micșorare. Fără email trimis, nu se face nimic.
        </p>
        <p style={{ marginTop: 0 }}>
          Acum: <b>{s.on ? `pornite din ${day(s.from)}` : "oprite"}</b>
          {" · "}Email: <b>{emailReady() ? "merge" : "lipsește RESEND_API_KEY (fără el nu pleacă anunțuri, deci nu se face nimic)"}</b>
          {" · "}Magazia rece: <b>{coldArchiveConfigured() ? "pusă (ARCHIVE_S3_*)" : "nepusă: arhiva stă în bucket-ul obișnuit, doar comprimată"}</b>
        </p>
        {coldArchiveConfigured() && <p className="err">Magazia rece e pusă: scrie furnizorul ei în Confidențialitate (toate limbile) înainte de prima mutare.</p>}
        <ArchiveForm value={{ on: s.on, freeYears: s.freeYears, sealYears: s.sealYears }} />
        <p className="muted" style={{ marginBottom: 0 }}>Rularea zilnică e automatizarea „Arhiva sigilată” din <Link href="/admin/autonomie">Autonomie</Link>, oprită până o pornești.</p>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Fișierele</h3>
        <p style={{ margin: 0 }}>Online, neatinse: <b>{o.counts.live}</b> · În arhiva sigilată: <b>{o.counts.archived}</b> · Rămase în mic: <b>{o.counts.reduced}</b></p>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ce urmează ({pending.length})</h3>
        {pending.length ? (
          <ul>
            {pending.map((p) => (
              <li key={`${p.treeId}-${p.event}`}>
                <b>{p.name}</b>: pe {day(p.dueAt.toISOString())} {EVENT[p.event as ArchiveEvent] ?? p.event}
                <span className="muted"> · anunțuri: {Object.entries(p.notices as Record<string, string>).map(([d, at]) => `${d} zile (${at === "sarit" ? "sărit" : day(at)})`).join(", ") || "niciunul"}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted" style={{ margin: 0 }}>Nimic programat.</p>}
        {done.length > 0 && (
          <details>
            <summary>Făcute ({done.length})</summary>
            <ul>{done.map((p) => <li key={`${p.treeId}-${p.event}`}>{p.name}: {EVENT[p.event as ArchiveEvent] ?? p.event}, pe {day(p.doneAt!.toISOString())}</li>)}</ul>
          </details>
        )}
      </div>
    </section>
  );
}

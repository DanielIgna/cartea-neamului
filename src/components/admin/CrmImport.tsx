"use client";
import { useActionState } from "react";
import { importAction, type ImportState } from "@/app/crm-actions";

/** Admin → CRM → Import: unul sau mai multe CSV-uri; felul se ia din numele fișierului (scoli_trimise.csv...) sau din listă. */
export default function CrmImport({ kinds }: { kinds: [string, string][] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, null);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <form action={action} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        <label style={{ flex: "2 1 260px" }}>Fișierele CSV
          <input type="file" name="files" accept=".csv,text/csv" multiple required />
        </label>
        <label style={{ flex: "1 1 220px" }}>Felul (dacă numele fișierului nu-l spune)
          <select name="kind" defaultValue="">
            <option value="">după numele fișierului</option>
            {kinds.map(([k, what]) => <option key={k} value={k}>{k}.csv · {what}</option>)}
          </select>
        </label>
        <button className="btn primary" disabled={pending}>{pending ? "Import..." : "Importă"}</button>
      </form>
      {state?.error && <p className="cc-ok" role="alert" style={{ borderColor: "var(--red)" }}>{state.error}</p>}
      {state?.reports?.map((r) => (
        <div key={r.kind} className="cc-ok" role="status">
          <b>{r.kind}.csv</b>: {r.rows} rânduri · {r.orgsNew} organizații noi · {r.orgsSeen} existau deja · {r.activities} activități noi
          {r.suppressed ? ` · ${r.suppressed} pe lista „nu contacta”` : ""}
          {r.skipped.length > 0 && <small style={{ display: "block" }}>Sărite: {r.skipped.slice(0, 10).map((x) => `rândul ${x.row} (${x.why})`).join("; ")}{r.skipped.length > 10 ? ` și încă ${r.skipped.length - 10}` : ""}</small>}
        </div>
      ))}
    </div>
  );
}

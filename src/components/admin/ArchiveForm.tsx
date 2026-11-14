"use client";
import { useActionState } from "react";
import { saveArchiveRules, type AdminFormState } from "@/app/admin-actions";

/** Admin → Arhivă: comutatorul și cei doi termeni ai arhivei sigilate (src/lib/arhivare.ts). */
export default function ArchiveForm({ value }: { value: { on: boolean; freeYears: number; sealYears: number } }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveArchiveRules, null);
  return (
    <form action={action} className="form">
      <div className="limits-row">
        <label>Originalele online, după anul plătit (ani)
          <input name="freeYears" type="number" min={1} max={10} step={1} defaultValue={value.freeYears} required />
          <small className="muted">fără nicio plată; apoi rămân doar pozele în mic</small>
        </label>
        <label>Arhiva sigilată, cu cartea PDF (ani)
          <input name="sealYears" type="number" min={1} max={30} step={1} defaultValue={value.sealYears} required />
          <small className="muted">de la cumpărarea cărții</small>
        </label>
      </div>
      <label className="check">
        <input type="checkbox" name="on" defaultChecked={value.on} />{" "}
        <b>Pornește regulile arhivei.</b> Se aplică doar conturilor făcute de la pornire încolo; cele de dinainte păstrează promisiunea
        „nu se șterge nimic”. Termenii și Confidențialitatea arată singure textul nou. Mutarea și micșorarea le face automatizarea
        „Arhiva sigilată” din Autonomie, doar după emailurile de anunț.
      </label>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

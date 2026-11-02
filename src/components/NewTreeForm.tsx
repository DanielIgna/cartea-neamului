"use client";
import { useActionState } from "react";
import { createTree } from "@/app/actions";

export default function NewTreeForm() {
  const [state, action, pending] = useActionState(createTree, null);
  return (
    <form action={action} className="form">
      <h2 style={{ fontSize: 22 }}>Arbore nou</h2>
      <label>Numele arborelui<input name="name" placeholder="Neamul Pop din Ieud" required /></label>
      <label>Regiunea<input name="region" placeholder="Maramureș" /></label>
      <div className="section-label">Pornește de la tine</div>
      <div className="row">
        <label>Prenume<input name="given" /></label>
        <label>Nume<input name="surname" /></label>
      </div>
      <div className="row">
        <label>Anul nașterii<input name="birth" placeholder="1988" /></label>
        <label>Sex<select name="sex" defaultValue="U"><option value="M">Bărbat</option><option value="F">Femeie</option><option value="U">Nespecificat</option></select></label>
      </div>
      <div className="section-label">sau importă un fișier GEDCOM</div>
      <input type="file" name="gedcom" accept=".ged,.gedcom,text/plain" />
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? "Se creează…" : "Creează arborele"}</button>
    </form>
  );
}

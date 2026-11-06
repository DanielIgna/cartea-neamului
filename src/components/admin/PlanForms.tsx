"use client";
import { useActionState } from "react";
import { saveAccountPlan, savePlanLimits, type AdminFormState } from "@/app/admin-actions";
import { PLANS, type Plan } from "@/lib/plan-names";
import type { PlanSettings } from "@/lib/plans";

/** Limitele planului gratuit și prețul „Familie”, cum le vrea cel care ține site-ul. */
export function LimitsForm({ value }: { value: PlanSettings }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(savePlanLimits, null);
  return (
    <form action={action} className="form limits-form">
      <div className="limits-row">
        <label>Persoane gratuite pe arbore
          <input name="freePersons" type="number" inputMode="numeric" min={10} step={1} defaultValue={value.freePersons} required />
          <small className="muted">toți cei din arbore, vii și morți</small>
        </label>
        <label>Fișiere gratuite pe arbore
          <input name="freeFiles" type="number" inputMode="numeric" min={10} step={1} defaultValue={value.freeFiles} required />
          <small className="muted">poze, acte, înregistrări (500 ≈ 1 GB)</small>
        </label>
        <label>„Familie”, € pe an
          <input name="priceEurYear" type="number" inputMode="decimal" min={0} step={0.5} defaultValue={value.priceEurYear} required />
          <small className="muted">pentru un cont, oricâți arbori ar avea</small>
        </label>
      </div>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează limitele"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

/** Planul unui cont, cu o notă scurtă: de ce e gratuit sau ce s-a vorbit. */
export function AccountPlanForm({ userId, plan, note, compact }: { userId: string; plan: Plan; note: string | null; compact?: boolean }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveAccountPlan, null);
  return (
    <form action={action} className={`plan-form${compact ? " compact" : ""}`}>
      <input type="hidden" name="userId" value={userId} />
      <select name="plan" defaultValue={plan} aria-label="Planul contului">
        {(Object.keys(PLANS) as Plan[]).map((k) => <option key={k} value={k}>{PLANS[k].label}</option>)}
      </select>
      <input name="note" defaultValue={note ?? ""} maxLength={200} placeholder="notă (de ex. „vărul meu”)" aria-label="Notă despre cont" />
      <button className="btn" disabled={pending}>{pending ? "…" : "Salvează"}</button>
      <span role="status" className={state?.error ? "err" : "muted plan-saved"}>{state?.error ?? state?.ok ?? ""}</span>
    </form>
  );
}

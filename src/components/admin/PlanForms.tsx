"use client";
import { useActionState } from "react";
import { saveAccountPlan, savePlanLimits, type AdminFormState } from "@/app/admin-actions";
import { PLANS, type Plan } from "@/lib/plan-names";
import type { PlanSettings } from "@/lib/plans";

/** Zilele gratuite, prețurile și comutatorul care pornește plățile în site. */
export function LimitsForm({ value }: { value: PlanSettings }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(savePlanLimits, null);
  const field = (name: keyof PlanSettings, label: string, hint: string, step = 1) => (
    <label>{label}
      <input name={name} type="number" inputMode="decimal" min={name === "trialDays" ? 1 : 0} step={step} defaultValue={value[name] as number} required />
      <small className="muted">{hint}</small>
    </label>
  );
  return (
    <form action={action} className="form limits-form">
      <div className="limits-row">
        {field("trialDays", "Zile gratuite", "pentru fiecare om: cel care pornește arborele și fiecare rudă invitată")}
        {field("priceLei", "Anul, în lei", "cel care are un arbore al lui", 0.5)}
        {field("priceEur", "Anul, în €", "pentru cei din alte limbi", 0.5)}
      </div>
      <div className="limits-row">
        {field("invitePriceLei", "Anul pentru o rudă invitată, lei", "cei care contribuie la arborele altcuiva", 0.5)}
        {field("invitePriceEur", "Anul pentru o rudă invitată, €", "", 0.5)}
      </div>
      <div className="limits-row">
        {field("bookLei", "Cartea PDF, lei", "plata se adaugă la pasul următor", 0.5)}
        {field("bookEur", "Cartea PDF, €", "", 0.5)}
        {field("betaDays", "Zile gratuite pentru cei din beta", "cei cu cont dinainte de pornire (365 = primul an); 0 = fără")}
      </div>
      <label className="check">
        <input type="checkbox" name="on" defaultChecked={value.on} />{" "}
        <b>Pornește plățile în site.</b> Fiecare om primește zilele gratuite de azi (sau de când își face contul); după ele, arborii se pot doar vedea,
        până plătește. Nu se șterge nimic.
      </label>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

/** Planul unui cont, până când a plătit (pus de mână până merg plățile cu cardul) și o notă: de ce e gratuit sau ce s-a vorbit. */
export function AccountPlanForm({ userId, plan, note, paidUntil, compact }: { userId: string; plan: Plan; note: string | null; paidUntil?: string | null; compact?: boolean }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveAccountPlan, null);
  return (
    <form action={action} className={`plan-form${compact ? " compact" : ""}`}>
      <input type="hidden" name="userId" value={userId} />
      <select name="plan" defaultValue={plan} aria-label="Planul contului">
        {(Object.keys(PLANS) as Plan[]).map((k) => <option key={k} value={k}>{PLANS[k].label}</option>)}
      </select>
      <label className="plan-until">plătit până la{" "}
        <input name="paidUntil" type="date" defaultValue={paidUntil?.slice(0, 10) ?? ""} aria-label="Plătit până la" />
      </label>
      <input name="note" defaultValue={note ?? ""} maxLength={200} placeholder="notă (de ex. „vărul meu”)" aria-label="Notă despre cont" />
      <button className="btn" disabled={pending}>{pending ? "…" : "Salvează"}</button>
      <span role="status" className={state?.error ? "err" : "muted plan-saved"}>{state?.error ?? state?.ok ?? ""}</span>
    </form>
  );
}

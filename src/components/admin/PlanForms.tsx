"use client";
import { useActionState } from "react";
import { saveAccountPlan, savePlanLimits, type AdminFormState } from "@/app/admin-actions";
import { PLANS, TIER_LABELS, type Plan } from "@/lib/plan-names";
import type { PlanSettings } from "@/lib/plans";

type Tier = keyof typeof TIER_LABELS;
const TIER_HINT: Record<Tier, string> = {
  basic: "prețul de bază; rudele care scriu își plătesc anul lor (prețul pentru invitați, mai jos)",
  familie: "planul recomandat; rudele care scriu (în plafon) nu plătesc separat",
  premium: "pentru neamuri mari; rudele care scriu (în plafon) nu plătesc separat",
};

/** Zilele gratuite, prețurile și plafoanele fiecărui plan și comutatorul care pornește plățile în site. Plafon 0 = fără limită. */
export function LimitsForm({ value }: { value: PlanSettings }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(savePlanLimits, null);
  const field = (name: keyof PlanSettings, label: string, hint: string, step = 1, min = 0) => (
    <label>{label}
      <input name={name} type="number" inputMode="decimal" min={min} step={step} defaultValue={value[name] as number} required />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  const tier = (t: Tier) => {
    const price = t === "basic" ? (["priceLei", "priceEur"] as const) : ([`${t}Lei`, `${t}Eur`] as const);
    return (
      <fieldset key={t} className="tier-fields">
        <legend><b>{TIER_LABELS[t]}</b> <small className="muted">{TIER_HINT[t]}</small></legend>
        <div className="limits-row">
          {field(price[0], "Anul, în lei", "", 0.5)}
          {field(price[1], "Anul, în €", "pentru cei din alte limbi", 0.5)}
          {field(`${t}Persons`, "Persoane", "într-un arbore; 0 = nelimitat")}
          {field(`${t}Photos`, "Poze", "într-un arbore")}
        </div>
        <div className="limits-row">
          {field(`${t}Audio`, "Înregistrări cu glasul", "într-un arbore")}
          {field(`${t}Docs`, "Acte și documente", "acte, scrisori, altele")}
          {field(`${t}Writers`, "Cine scrie", "cu titularul cu tot (2 = titularul + 1)")}
          {field(`${t}Trees`, "Arbori", "ai titularului")}
        </div>
        <div className="limits-row">
          <label>Cartea PDF
            <select name={`${t}Book`} defaultValue={value[`${t}Book`]}>
              <option value="separat">separat (se plătește)</option>
              <option value="una">una inclusă pe an (un arbore la alegere)</option>
              <option value="toti">inclusă la toți arborii titularului</option>
            </select>
          </label>
          {field(`${t}Print`, "Reducere la cartea tipărită, %", "0 = preț întreg")}
        </div>
      </fieldset>
    );
  };
  return (
    <form action={action} className="form limits-form">
      <div className="limits-row">
        {field("trialDays", "Zile gratuite", "pentru fiecare om: cel care pornește arborele și fiecare rudă invitată", 1, 1)}
        {field("trialPersons", "Persoane în zilele gratuite", "cât crește un arbore până îl plătește cineva (30 = familia apropiată)", 1, 5)}
        {field("trialPhotos", "Poze în zilele gratuite", "într-un arbore; 0 = nelimitat")}
        {field("trialAudio", "Înregistrări în zilele gratuite", "")}
        {field("trialDocs", "Acte în zilele gratuite", "")}
      </div>
      {(Object.keys(TIER_LABELS) as Tier[]).map(tier)}
      <div className="limits-row">
        {field("invitePriceLei", "Anul pentru o rudă invitată, lei", "la Basic: cei care scriu în arborele altcuiva", 0.5)}
        {field("invitePriceEur", "Anul pentru o rudă invitată, €", "", 0.5)}
        {field("bookLei", "Cartea PDF, lei", "când nu e inclusă în plan", 0.5)}
        {field("bookEur", "Cartea PDF, €", "", 0.5)}
        {field("betaDays", "Zile gratuite pentru cei din beta", "cei cu cont dinainte de pornire (365 = primul an; au plafoanele Familie); 0 = fără")}
      </div>
      <div className="limits-row">
        {field("bundleLei", "Pachet Basic + cartea PDF, lei", "un an Basic cu o carte PDF inclusă (0 = fără pachet)", 0.5)}
        {field("bundleEur", "Pachet Basic + cartea PDF, €", "", 0.5)}
        {field("printFromLei", "Cartea tipărită „de la”, lei", "după ofertele tipografiilor; 0 = nu se arată", 1)}
        {field("printFromEur", "Cartea tipărită „de la”, €", "", 1)}
      </div>
      <div className="limits-row">
        {field("referralDays", "Zile în plus pentru o rudă adusă", "când o rudă invitată își deschide arborele și plătește primul an (0 = fără)")}
        {field("reminderDays", "Aducerea aminte înainte de expirare, zile", "o dată pe an, pe email (0 = fără)")}
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
export function AccountPlanForm({ userId, plan, tier, note, paidUntil, compact }: { userId: string; plan: Plan; tier?: Tier | null; note: string | null; paidUntil?: string | null; compact?: boolean }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveAccountPlan, null);
  return (
    <form action={action} className={`plan-form${compact ? " compact" : ""}`}>
      <input type="hidden" name="userId" value={userId} />
      <select name="plan" defaultValue={plan} aria-label="Planul contului">
        {(Object.keys(PLANS) as Plan[]).map((k) => <option key={k} value={k}>{PLANS[k].label}</option>)}
      </select>
      <select name="tier" defaultValue={tier ?? ""} aria-label="Planul anului">
        <option value="">— planul anului —</option>
        {(Object.keys(TIER_LABELS) as Tier[]).map((k) => <option key={k} value={k}>{TIER_LABELS[k]}</option>)}
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

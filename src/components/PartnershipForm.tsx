"use client";
import { useActionState } from "react";
import { partnershipAction, type PartnershipState } from "@/app/crm-actions";

/** Formularul „Vreau coduri pentru clasa / școala / firma mea” (/parteneriate). Bifa de acord e nebifată implicit. */
export default function PartnershipForm({ kinds, consent, defaultKind }: { kinds: [string, string][]; consent: string; defaultKind?: string }) {
  const [state, action, pending] = useActionState<PartnershipState, FormData>(partnershipAction, null);
  if (state?.ok) return <p className="cc-ok" role="status">Mulțumim! Am primit cererea și îți răspundem pe email, de obicei în 1–2 zile lucrătoare.</p>;
  return (
    <form action={action} className="form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
      <label>Cine ești<select name="tip" defaultValue={defaultKind ?? kinds[0][0]} required>{kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label>Numele școlii, firmei sau organizației<input name="organizatie" required maxLength={200} autoComplete="organization" /></label>
      <label>Localitatea<input name="localitate" maxLength={120} /></label>
      <label>Rolul tău<input name="rol" maxLength={120} placeholder="de pildă: învățătoare, director, HR" /></label>
      <label>Număr de elevi sau angajați<input name="numar" type="number" min={1} max={100000} inputMode="numeric" /></label>
      <label>Email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>Telefon (opțional)<input name="telefon" type="tel" maxLength={40} autoComplete="tel" /></label>
      <label style={{ gridColumn: "1/-1" }}>Mesaj (opțional)<textarea name="mesaj" rows={3} maxLength={2000} /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <label style={{ gridColumn: "1/-1", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" name="consent" required style={{ marginTop: 4 }} /> <span>{consent}</span>
      </label>
      {state?.error && <p role="alert" style={{ gridColumn: "1/-1", color: "var(--red)", margin: 0 }}>{state.error}</p>}
      <div style={{ gridColumn: "1/-1" }}><button className="btn primary" disabled={pending}>{pending ? "Se trimite..." : "Trimite cererea"}</button></div>
    </form>
  );
}

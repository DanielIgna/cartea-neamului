"use client";
import { useActionState } from "react";
import { saveShareTreeAction } from "@/app/invitatii-actions";

/** Ce arbore vede (doar citire) cine își face cont prin legătura omului; textele vin gata traduse de pe server. */
export default function ShareTreeForm({ current, options, save, saved }: { current: string; options: { id: string; label: string }[]; save: string; saved: string }) {
  const [state, action, pending] = useActionState(saveShareTreeAction, null);
  return (
    <form action={action} className="form">
      {options.map((o) => (
        <label key={o.id || "none"} className="check"><input type="radio" name="tree" value={o.id} defaultChecked={o.id === current} /> {o.label}</label>
      ))}
      <div className="actions"><button className="btn" disabled={pending}>{save}</button>{state?.ok && <span className="muted" role="status">{saved}</span>}</div>
    </form>
  );
}

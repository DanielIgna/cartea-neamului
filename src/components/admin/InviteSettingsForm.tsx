"use client";
import { useActionState } from "react";
import { saveInviteSettingsAction } from "@/app/invitatii-actions";
import type { InviteSettings } from "@/lib/invitatii";

/** Admin → Invitații: zilele, limita lunară și comutatoarele programului. */
export default function InviteSettingsForm({ s }: { s: InviteSettings }) {
  const [state, action, pending] = useActionState(saveInviteSettingsAction, null);
  return (
    <form action={action} className="form limits-form">
      <label className="check"><input type="checkbox" name="on" defaultChecked={s.on} /> <b>Programul e pornit</b> (oprit: legăturile merg, dar nu aduc zile)</label>
      <label>Zile pentru cel care invită<input type="number" name="daysReferrer" min={0} max={90} defaultValue={s.daysReferrer} /></label>
      <label>Zile în plus pentru cel invitat<input type="number" name="daysReferred" min={0} max={90} defaultValue={s.daysReferred} /></label>
      <label>Cel mult câte rude răsplătite pe lună, pentru un om (0 = fără limită)<input type="number" name="monthlyCap" min={0} max={1000} defaultValue={s.monthlyCap} /></label>
      <label className="check"><input type="checkbox" name="requirePerson" defaultChecked={s.requirePerson} /> Cere și o rudă adăugată în arbore (pe lângă emailul confirmat sau Google)</label>
      <label className="check"><input type="checkbox" name="shareTree" defaultChecked={s.shareTree} /> Omul poate alege un arbore pe care îl vede (doar citire) cine vine prin legătura lui</label>
      <div className="actions"><button className="btn primary" disabled={pending}>Salvează</button>
        {state?.ok && <span className="muted" role="status">{state.ok}</span>}{state?.error && <span className="err" role="status">{state.error}</span>}</div>
    </form>
  );
}

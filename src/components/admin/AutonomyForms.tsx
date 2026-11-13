"use client";
import { useActionState } from "react";
import { approveAutomation, runAutomationNow, runLoopNow, toggleAutomation, type AutoState } from "@/app/autonomie-actions";

function Msg({ s }: { s: AutoState }) {
  if (!s) return null;
  return <span className={s.ok ? "ok" : "err"} role="status" style={{ fontSize: 13 }}>{s.ok ?? s.error}</span>;
}

/** Comutatorul unei automatizări; la cele „cu acordul tău” cere o confirmare, fiindcă de acum le scrie oamenilor singură. */
export function AutoToggle({ k, on, label, consent }: { k: string; on: boolean; label: string; consent?: string }) {
  const [s, action, pending] = useActionState<AutoState, FormData>(toggleAutomation, null);
  return (
    <form action={action} className="auto-toggle" onSubmit={(e) => { if (!on && consent && !window.confirm(consent)) e.preventDefault(); }}>
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button type="submit" className={`switch${on ? " on" : ""}`} disabled={pending} aria-pressed={on} aria-label={`${label}: ${on ? "pornită" : "oprită"}`}>
        <span className="switch-knob" />{on ? "Pornită" : "Oprită"}
      </button>
      <Msg s={s} />
    </form>
  );
}

export function AutoRun({ k }: { k: string }) {
  const [s, action, pending] = useActionState<AutoState, FormData>(runAutomationNow, null);
  return (
    <form action={action} className="auto-run">
      <input type="hidden" name="key" value={k} />
      <button type="submit" className="btn" disabled={pending} title="Rulează acum">{pending ? "Rulează…" : "▶ Rulează"}</button>
      <Msg s={s} />
    </form>
  );
}

export function AutoApprove({ k, count }: { k: string; count: number }) {
  const [s, action, pending] = useActionState<AutoState, FormData>(approveAutomation, null);
  return (
    <form action={action} className="auto-run">
      <input type="hidden" name="key" value={k} />
      <button type="submit" className="btn primary" disabled={pending}>{pending ? "Se aplică…" : `Aprobă (${count})`}</button>
      <Msg s={s} />
    </form>
  );
}

export function LoopRun() {
  const [s, action, pending] = useActionState<AutoState>(runLoopNow, null);
  return (
    <form action={action} className="auto-run">
      <button type="submit" className="btn primary" disabled={pending}>{pending ? "Bucla rulează…" : "▶ Rulează bucla acum"}</button>
      <Msg s={s} />
    </form>
  );
}

"use client";
import { useActionState } from "react";
import { resetOwnerTwoStep, type OwnerRecoveryState } from "@/app/securitate-actions";

/** Butonul din Admin → Securitate cu care un proprietar resetează verificarea în 2 pași a celuilalt. */
export default function OwnerRecovery({ email, name }: { email: string; name: string }) {
  const [state, action, pending] = useActionState<OwnerRecoveryState, FormData>(resetOwnerTwoStep, null);
  return (
    <form action={action} className="form" style={{ gap: 8 }}>
      <input type="hidden" name="email" value={email} />
      <label className="radio"><input type="checkbox" name="confirm" value="da" required /><span>Am vorbit cu {name}: a pierdut telefonul și codurile de rezervă și vrea să-i resetez verificarea în 2 pași.</span></label>
      <button className="btn" disabled={pending}>{pending ? "…" : `Resetează verificarea în 2 pași a lui ${name}`}</button>
      {state?.error && <p className="err">{state.error}</p>}
      {state?.ok && <p><b>{state.ok}</b></p>}
    </form>
  );
}

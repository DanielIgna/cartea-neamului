"use client";
import { useActionState } from "react";
import Link from "next/link";
import { requestSchoolCodes, type FormState } from "@/app/scoala-actions";

/** „Vreau coduri pentru clasa mea”: cererea ajunge în Admin → Școli; codul se dă după confirmarea conducerii școlii. */
export default function SchoolRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSchoolCodes, null);
  if (state?.ok) return <p className="ok-box" role="status"><b>Mulțumim!</b> Am primit cererea. Vă scriem pe email după ce confirmăm cu conducerea școlii, de obicei în 1–3 zile lucrătoare.</p>;
  return (
    <form action={action} className="form school-form">
      <div className="row">
        <label>Școala<input name="school" required maxLength={160} placeholder="Școala Gimnazială nr. 1" /></label>
        <label>Localitatea<input name="locality" required maxLength={120} placeholder="Huedin" /></label>
      </div>
      <div className="row">
        <label>Județul <small className="muted">(opțional)</small><input name="county" maxLength={60} placeholder="Cluj" /></label>
        <label>Clasa<input name="classLabel" required maxLength={40} placeholder="a IV-a B" /></label>
        <label>Număr de elevi<input name="students" required type="number" min={1} max={60} inputMode="numeric" placeholder="24" /></label>
      </div>
      <div className="row">
        <label>Numele dumneavoastră <small className="muted">(opțional)</small><input name="teacher" maxLength={120} autoComplete="name" /></label>
        <label>Email<input name="email" required type="email" maxLength={160} autoComplete="email" /></label>
        <label>Telefon <small className="muted">(opțional)</small><input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
      </div>
      <label>Mesaj <small className="muted">(opțional)</small><textarea name="message" maxLength={1000} rows={3} placeholder="De pildă: când e proiectul, câte clase ar mai vrea" /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <label className="radio"><input type="checkbox" name="acord" required /> <span>Sunt de acord să fiu contactat(ă) pe email sau telefon pentru această cerere. Vezi <Link href="/confidentialitate">Confidențialitate</Link>.</span></label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div><button className="btn primary" disabled={pending}>{pending ? "Se trimite…" : "Vreau coduri pentru clasa mea"}</button></div>
    </form>
  );
}

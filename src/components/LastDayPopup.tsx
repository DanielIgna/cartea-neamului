"use client";
import { useEffect, useRef } from "react";

/**
 * Fereastra din ultima zi gratuită (src/lib/conversie.ts): se arată o singură dată pe zi (ținut minte în browser), cu un buton
 * spre /plata și „Mai târziu”. Textele vin gata traduse de pe server.
 */
export default function LastDayPopup({ day, title, text, pay, later }: { day: string; title: string; text: string; pay: string; later: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const key = `cn-ultima-zi-${day}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { /* fără loc în browser: se arată, dar o singură dată pe pagină */ }
    ref.current?.showModal?.();
  }, [day]);
  return (
    <dialog ref={ref} className="card" aria-labelledby="ultima-zi-titlu" style={{ maxWidth: 440, border: 0, borderRadius: 14, padding: 22 }}>
      <h2 id="ultima-zi-titlu" style={{ marginTop: 0 }}>{title}</h2>
      <p>{text}</p>
      <div className="actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="btn primary" href="/plata">{pay}</a>
        <button type="button" className="btn" onClick={() => ref.current?.close()}>{later}</button>
      </div>
    </dialog>
  );
}

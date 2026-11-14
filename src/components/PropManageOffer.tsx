"use client";
import { useState, useTransition } from "react";
import { propmanageInviteAction } from "@/app/propmanage-actions";
import { CONSENT_TEXT_RO, OFFER_TEXT_RO } from "@/lib/propmanage-texte";

/**
 * Caseta discretă „Cadou de la partenerul nostru PropManage” (după activarea cardului și în Datele mele). Bifa e nebifată
 * de la sine; butonul nu trimite nimic fără ea. Tab-ul nou se deschide pe loc, la clic (ca să nu-l oprească browserul), și
 * primește linkul când vine răspunsul; dacă PropManage nu răspunde, tab-ul se închide și caseta dispare.
 */
export function PropManageOffer({ place }: { place: "activare" | "datele-mele" }) {
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "gone">("idle");
  const [link, setLink] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (state === "gone") return null;

  const go = () => {
    if (!consent) return setHint("Bifează acordul ca să-ți facem contul. Fără bifă nu trimitem nimic.");
    setHint(null);
    const tab = window.open("about:blank", "_blank");
    start(async () => {
      const r = await propmanageInviteAction({ consent: true, place }).catch(() => ({ reason: "unavailable" } as { link?: string; reason?: string }));
      if (r.link) {
        if (tab && !tab.closed) { try { tab.opener = null; } catch {} tab.location.href = r.link; }
        setLink(r.link);
        setState("done");
      } else {
        tab?.close();
        if (r.reason === "no_consent") setHint("Bifează acordul ca să-ți facem contul.");
        else setState("gone"); // oprită, deja invitat sau PropManage nu răspunde: oferta nu mai apare
      }
    });
  };

  return (
    <div className="card pm-offer" style={{ borderStyle: "dashed", marginTop: 16 }} aria-live="polite">
      {state === "done" ? (
        <p style={{ margin: 0 }}>
          Contul tău PropManage te așteaptă. Dacă nu s-a deschis singur,{" "}
          <a href={link!} target="_blank" rel="noopener noreferrer">deschide-l de aici</a>.
        </p>
      ) : (
        <>
          <p style={{ marginTop: 0 }}>🏡 {OFFER_TEXT_RO}</p>
          <label className="check" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{CONSENT_TEXT_RO}.</span>
          </label>
          <div className="actions" style={{ marginTop: 10 }}>
            <button type="button" className="btn" disabled={pending} onClick={go}>{pending ? "Se pregătește…" : "Vreau contul gratuit"}</button>
          </div>
          {hint && <p className="muted" role="status"><small>{hint}</small></p>}
          <p className="muted" style={{ marginBottom: 0 }}><small>
            Doar numele și emailul tău pleacă la PropManage, doar dacă bifezi. Nimic din arbore. Vezi <a href="/confidentialitate#parteneri">Confidențialitatea</a>.
          </small></p>
        </>
      )}
    </div>
  );
}

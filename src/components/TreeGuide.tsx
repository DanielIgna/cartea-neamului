"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "use-intl";

/** Un pas al ghidului: ce scrie, dacă e deja făcut și ce butoane are (fiecare închide ghidul și duce omul unde trebuie). */
export type StepKey = "open" | "parents" | "grandparents" | "siblings" | "photo" | "invite";
export type GuideStep = { key: StepKey; done?: boolean; actions?: { label: string; run: () => void; primary?: boolean }[]; note?: string };

/**
 * Ghidul arborelui (Daniel, 24.11.2026): 6 pași scurți, de la „deschide arborele” la „invită o rudă”. Se deschide singur la
 * prima intrare în arbore (ținut minte în browser, pe cont) și oricând din butonul „?” de lângă desen.
 * Nu vine peste altă fereastră deschisă (de pildă ultima zi gratuită): așteaptă intrarea următoare.
 */
export default function TreeGuide({ steps, auto, storageKey, open, onOpenChange }: {
  steps: GuideStep[]; auto: boolean; storageKey: string; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("TreeGuide");
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  // Deschis singur (prima intrare): de la pasul 1. Din „?”: de la primul pas nefăcut.
  const fromStart = useRef(false);
  // Prima intrare: se deschide singur, o singură dată.
  useEffect(() => {
    if (!auto) return;
    let seen = false;
    try { seen = !!localStorage.getItem(storageKey); } catch { /* fără loc în browser: îl arătăm, butonul „?” rămâne */ }
    if (seen) return;
    const timer = setTimeout(() => {
      if (document.querySelector("dialog[open]")) return;
      try { localStorage.setItem(storageKey, "1"); } catch { /* idem */ }
      fromStart.current = true;
      onOpenChange(true);
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, storageKey]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { setI(fromStart.current ? 0 : Math.max(0, steps.findIndex((x) => !x.done))); fromStart.current = false; d.showModal?.(); }
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => {
    try { localStorage.setItem(storageKey, "1"); } catch { /* idem */ }
    onOpenChange(false);
  };
  const s = steps[i];
  if (!s) return null;
  const last = i === steps.length - 1;
  const rich = (key: StepKey): ReactNode => t.rich(`steps.${key}.text`, { b: (c) => <b>{c}</b> });
  return (
    <dialog ref={ref} className="tree-guide" aria-labelledby="ghid-arbore-titlu" onClose={() => open && close()}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="tg-in">
        <div className="tg-head">
          <span className="section-label" style={{ margin: 0 }}>{t("title")}</span>
          <button type="button" className="tg-x" onClick={close} aria-label={t("close")} title={t("close")}>✕</button>
        </div>
        <ol className="tg-dots" aria-label={t("stepOf", { n: i + 1, total: steps.length })}>
          {steps.map((x, k) => (
            <li key={x.key}>
              <button type="button" aria-current={k === i ? "step" : undefined} className={x.done ? "done" : ""} onClick={() => setI(k)}
                aria-label={`${k + 1}. ${t(`steps.${x.key}.title`)}`}>{x.done ? "✓" : k + 1}</button>
            </li>
          ))}
        </ol>
        <p className="tg-count muted">{t("stepOf", { n: i + 1, total: steps.length })}</p>
        <h2 id="ghid-arbore-titlu" className="tg-title">{t(`steps.${s.key}.title`)}{s.done && <span className="chip ok tg-done">✓ {t("done")}</span>}</h2>
        <p className="tg-text">{rich(s.key)}</p>
        {s.note && <p className="muted tg-note">{s.note}</p>}
        {s.actions && s.actions.length > 0 && (
          <div className="actions tg-actions">
            {s.actions.map((a) => (
              <button key={a.label} type="button" className={a.primary ? "btn primary" : "btn"} onClick={() => { close(); a.run(); }}>{a.label}</button>
            ))}
          </div>
        )}
        <div className="tg-nav">
          <button type="button" className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>{t("back")}</button>
          {last
            ? <button type="button" className="btn primary" onClick={close}>{t("finish")}</button>
            : <button type="button" className="btn primary" onClick={() => setI(i + 1)}>{t("next")}</button>}
        </div>
        <p className="muted tg-foot">{t("reopen")}</p>
      </div>
    </dialog>
  );
}

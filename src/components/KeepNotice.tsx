"use client";
import { useState } from "react";
import { closeKeepNotice } from "@/app/anunt-actions";
import { KEEP_NOTICE_COOKIE } from "@/lib/anunt-pastrare";

/**
 * Anunțul pentru cei care aveau deja cont când a apărut „Păstrarea” (2026-11-13): ce e nou și că s-au schimbat Termenii.
 * „Am înțeles” se ține pe cont (src/lib/anunt-pastrare.ts); cookie-ul de o săptămână doar ascunde banda până se încarcă pagina următoare.
 */
export default function KeepNotice({ lead, text, more, terms, ok }: { lead: string; text: string; more: string; terms: string; ok: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const close = () => {
    document.cookie = `${KEEP_NOTICE_COOKIE}=1; path=/; max-age=604800; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setGone(true);
    void closeKeepNotice();
  };
  return (
    <aside className="cookie-notice" aria-label={lead}>
      <p><b>{lead}</b> {text} <a href="/plata#pastrare">{more}</a> · <a href="/termeni">{terms}</a></p>
      <button type="button" className="btn" onClick={close}>{ok}</button>
    </aside>
  );
}

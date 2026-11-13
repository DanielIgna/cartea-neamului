"use client";
import { useState } from "react";

/** Cookie-ul care ține minte că omul a văzut anunțul despre „Păstrare” (o singură dată, pe fiecare telefon sau calculator). */
export const KEEP_NOTICE_COOKIE = "cn-pastrare-anunt";

/**
 * Anunțul pentru cei care aveau deja cont când a apărut „Păstrarea” (2026-11-13): ce e nou și că s-au schimbat Termenii.
 * „Am înțeles” pune cookie-ul pentru un an, ca anunțul să nu mai apară.
 */
export default function KeepNotice({ lead, text, more, terms, ok }: { lead: string; text: string; more: string; terms: string; ok: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const close = () => {
    document.cookie = `${KEEP_NOTICE_COOKIE}=1; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setGone(true);
  };
  return (
    <aside className="cookie-notice" aria-label={lead}>
      <p><b>{lead}</b> {text} <a href="/plata#pastrare">{more}</a> · <a href="/termeni">{terms}</a></p>
      <button type="button" className="btn" onClick={close}>{ok}</button>
    </aside>
  );
}

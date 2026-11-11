"use client";
import { useState } from "react";
import { COOKIE_NOTICE_COOKIE } from "@/lib/legal";

/**
 * Anunțul despre cookie-uri, o singură dată pe fiecare telefon sau calculator. Site-ul folosește doar cookie-uri strict
 * necesare, așa că nu cere acord: doar spune limpede ce folosește și trimite la lista întreagă din Politica de confidențialitate.
 * Legătura e un <a> simplu, nu <Link>: la trecerea între pagini, Next nu coboară singur la #cookie-uri.
 * „Am înțeles” pune cookie-ul `cn-cookie-uri` (un an), ca anunțul să nu mai apară.
 */
export default function CookieNotice({ lead, text, more, ok }: { lead: string; text: string; more: string; ok: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const close = () => {
    document.cookie = `${COOKIE_NOTICE_COOKIE}=1; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setGone(true);
  };
  return (
    <aside className="cookie-notice" aria-label={lead}>
      <p><b>{lead}</b> {text} <a href="/confidentialitate#cookie-uri">{more}</a></p>
      <button type="button" className="btn" onClick={close}>{ok}</button>
    </aside>
  );
}

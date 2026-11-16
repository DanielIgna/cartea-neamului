"use client";
import { useState } from "react";
import { CHOICE_ANALYTICS, CHOICE_COOKIE, CHOICE_EVENT, CHOICE_NECESSARY } from "@/lib/sursa-shared";

/** Scrie alegerea (un an) și anunță pagina, ca sursa vizitei să se scrie pe loc sau să se șteargă (src/components/SourceTracker.tsx). */
export function saveCookieChoice(analytics: boolean) {
  document.cookie = `${CHOICE_COOKIE}=${analytics ? CHOICE_ANALYTICS : CHOICE_NECESSARY}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  window.dispatchEvent(new Event(CHOICE_EVENT));
}

/**
 * Anunțul despre cookie-uri, o singură dată pe fiecare telefon sau calculator. Cookie-urile strict necesare nu cer acord; cele
 * două de analiză (de unde vin oamenii: `cn-sursa`, `cn-sursa-ultima`) se pun doar după „Accept” (Daniel, 16.11.2026).
 * Alegerea stă în `cn-cookie-uri` (un an): „analiza” sau „necesare”; se schimbă oricând din Politica de confidențialitate.
 * Legătura e un <a> simplu, nu <Link>: la trecerea între pagini, Next nu coboară singur la #cookie-uri.
 */
export default function CookieNotice({ lead, text, more, ok, necessary }: { lead: string; text: string; more: string; ok: string; necessary: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const choose = (analytics: boolean) => { saveCookieChoice(analytics); setGone(true); };
  return (
    <aside className="cookie-notice" aria-label={lead}>
      <p><b>{lead}</b> {text} <a href="/confidentialitate#cookie-uri">{more}</a></p>
      <div className="cookie-actions">
        <button type="button" className="btn" onClick={() => choose(false)}>{necessary}</button>
        <button type="button" className="btn" onClick={() => choose(true)}>{ok}</button>
      </div>
    </aside>
  );
}

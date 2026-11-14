"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Trimiterea cardului cadou digital către client, după vânzare: se deschide singur canalul ales la vânzare (WhatsApp, SMS sau
 * email, cu textul gata scris), iar dedesubt rămân butoanele, copierea legăturii și QR-ul de scanat de pe ecranul casei.
 */
export default function CardShare({ url, links, qr, auto }: { url: string; links: { whatsapp: string; sms: string; email: string; text: string }; qr: string; auto?: string }) {
  const [copied, setCopied] = useState(false);
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const to = auto === "whatsapp" ? links.whatsapp : auto === "sms" ? links.sms : auto === "email" ? links.email : null;
    if (to) window.location.href = to;
  }, [auto, links]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(links.text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* fără clipboard: rămâne legătura afișată */ }
  };
  return (
    <div className="cs-panel">
      <div className="cs-buttons">
        <a className="btn primary" href={links.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
        <a className="btn" href={links.sms}>SMS</a>
        <a className="btn" href={links.email}>Email</a>
        <button type="button" className="btn" onClick={copy}>{copied ? "Copiat ✓" : "Copiază mesajul"}</button>
      </div>
      <div className="cs-qr-wrap">
        <div className="cs-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="muted"><small>Sau clientul scanează acest QR cu telefonul lui, chiar de pe ecranul tău.</small></p>
      </div>
      <code className="cs-url">{url}</code>
    </div>
  );
}

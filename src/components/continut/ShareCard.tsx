"use client";
import { useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/**
 * Cardul de distribuit de sub o pagină de nume sau de localitate (Admin → Creștere): poza paginii și butoanele WhatsApp,
 * Facebook, „Copiază linkul” și „Descarcă poza”. Legăturile poartă semnele utm (sursa + campania), ca vizitele aduse să
 * se vadă în Admin → Analiză. Paginile acestea sunt doar în română.
 */
export default function ShareCard({ url, image, text, campaign }: { url: string; image: string; text: string; campaign: string }) {
  const [copied, setCopied] = useState(false);
  const tag = (source: string) => {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "distribuire");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  };
  return (
    <div className="card share-card">
      <h2 style={{ marginTop: 0 }}>Trimite-o familiei</h2>
      <p className="muted" style={{ marginTop: 0 }}>Cineva din familie știe sigur mai mult. Trimite-le pagina, cu poza ei.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={text} width={1200} height={630} loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 12, display: "block" }} />
      <div className="actions" style={{ flexWrap: "wrap" }}>
        <a className="btn primary" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${tag("whatsapp")}`)}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} /> WhatsApp</a>
        <a className="btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tag("facebook"))}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(tag("copiat")); setCopied(true); } catch { /* fără clipboard */ } }}>{copied ? "Link copiat" : "Copiază linkul"}</button>
        <a className="btn" href={image} download>Descarcă poza</a>
      </div>
    </div>
  );
}

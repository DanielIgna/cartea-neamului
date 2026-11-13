"use client";
import { useState } from "react";

/** „PDF”: pagina analizei se tipărește sau se salvează ca PDF din fereastra de tipărire a browserului. */
export function PrintButton() {
  return <button type="button" className="btn" onClick={() => window.print()}>⎙ PDF</button>;
}

const SOURCES = ["facebook", "whatsapp", "instagram", "email", "tiktok", "youtube", "afis"];
const PAGES = [["/", "Prima pagină"], ["/cadou-de-sarbatori", "Cadou de sărbători"], ["/resurse-genealogie", "Resurse genealogie"], ["/istoria-umanitatii", "Istoria umanității"], ["/contact", "Contact"]];

/** Linkul cu etichetele de campanie (utm_source, utm_medium, utm_campaign), gata de copiat în postare sau mesaj. */
export function CampaignLink() {
  const [page, setPage] = useState("/");
  const [source, setSource] = useState("facebook");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);
  const slug = campaign.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const medium = source === "email" ? "email" : source === "afis" ? "offline" : source === "whatsapp" ? "mesaj" : "social";
  const origin = typeof window === "undefined" ? "https://carteaneamului.ro" : window.location.origin;
  const url = `${origin}${page}?utm_source=${source}&utm_medium=${medium}${slug ? `&utm_campaign=${slug}` : ""}`;
  return (
    <div className="stack form" style={{ gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <label style={{ flex: "1 1 180px" }}>Pagina
          <select value={page} onChange={(e) => setPage(e.target.value)}>{PAGES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}</select>
        </label>
        <label style={{ flex: "1 1 140px" }}>Unde îl pui
          <select value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map((s) => <option key={s} value={s}>{s === "afis" ? "afiș / QR" : s}</option>)}</select>
        </label>
        <label style={{ flex: "2 1 220px" }}>Numele campaniei
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="de pildă: craciun-2026" maxLength={60} />
        </label>
      </div>
      <code style={{ wordBreak: "break-all", padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8 }}>{url}</code>
      <div>
        <button type="button" className="btn" onClick={() => { void navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>
          {copied ? "Copiat ✓" : "Copiază linkul"}
        </button>
      </div>
    </div>
  );
}

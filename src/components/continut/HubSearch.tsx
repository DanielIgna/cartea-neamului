"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

export type HubItem = { href: string; title: string; text?: string };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Căutarea dintr-o pagină-hub: lista întreagă stă în pagină, se caută în browser (cu sau fără diacritice). Cât timp
 * căutarea e goală se vede lista obișnuită, paginată, pe care o citește și Google (children).
 */
export default function HubSearch({ items, label, placeholder, children }: { items: HubItem[]; label: string; placeholder: string; children: ReactNode }) {
  const [q, setQ] = useState("");
  const found = useMemo(() => {
    const k = fold(q.trim());
    if (!k) return null;
    return items.filter((i) => fold(`${i.title} ${i.text ?? ""}`).includes(k)).slice(0, 100);
  }, [q, items]);
  return (
    <>
      <div className="hub-search" role="search">
        <label htmlFor="hub-q" className="sr-only">{label}</label>
        <input id="hub-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoComplete="off" />
      </div>
      {found ? (
        <div className="card">
          <p className="muted" aria-live="polite" style={{ marginTop: 0 }}>{found.length ? `${found.length === 100 ? "Primele 100 de" : found.length} rezultate` : "Nimic găsit. Încearcă fără diacritice sau doar începutul cuvântului."}</p>
          <ul className="hub-list">
            {found.map((i) => <li key={i.href}><Link href={i.href}>{i.title}</Link>{i.text && <span className="muted"> {i.text}</span>}</li>)}
          </ul>
        </div>
      ) : children}
    </>
  );
}

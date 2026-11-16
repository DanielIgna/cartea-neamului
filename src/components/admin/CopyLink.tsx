"use client";
import { useState } from "react";

/** Butonul „Copiază” de lângă un link (Admin → Linkuri cu sursă). */
export default function CopyLink({ url, label = "Copiază" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn" onClick={() => { void navigator.clipboard?.writeText(url).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }); }}>
      {done ? "Copiat ✓" : label}
    </button>
  );
}

"use client";

/** Tipărește pagina; din fereastra de tipărire se poate alege și „Salvează ca PDF”. */
export default function PrintButton({ label = "Tipărește sau salvează PDF" }: { label?: string }) {
  return <button className="btn primary" onClick={() => window.print()}>{label}</button>;
}

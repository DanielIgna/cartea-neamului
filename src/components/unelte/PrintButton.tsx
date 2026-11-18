"use client";
/** Butonul „Tipărește sau salvează PDF” (fereastra de tipărire a browserului). */
export default function PrintButton({ label = "Tipărește sau salvează PDF" }: { label?: string }) {
  return <button type="button" className="btn primary no-print" onClick={() => window.print()}>{label}</button>;
}

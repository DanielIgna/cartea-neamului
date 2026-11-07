"use client";

/** Tipărește pagina; din fereastra de tipărire se poate alege și „Salvează ca PDF”. Eticheta vine tradusă de la pagină. */
export default function PrintButton({ label }: { label: string }) {
  return <button className="btn primary" onClick={() => window.print()}>{label}</button>;
}

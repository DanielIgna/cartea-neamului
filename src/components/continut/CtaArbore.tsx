import Link from "next/link";

/** Îndemnul de la finalul paginilor publice de conținut: arborele familiei, început gratuit. */
export default function CtaArbore({ title = "Începe arborele familiei tale", text = "Primele 7 zile sunt gratuite, fără card. Adaugi părinții și bunicii, iar rudele pot completa ce știu ele." }: { title?: string; text?: string }) {
  return (
    <div className="card cta-card">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p>{text}</p>
      <Link className="btn primary" href="/intrare?mod=cont-nou">{title} →</Link>
    </div>
  );
}

/**
 * Îndemnul de sus (17.11.2026, mobil): butonul principal vizibil fără derulare, imediat sub datele paginii. Cel de jos rămâne.
 */
export function CtaSus({ label = "Începe arborele gratuit" }: { label?: string }) {
  return (
    <p className="cta-top">
      <Link className="btn primary" href="/intrare?mod=cont-nou">{label} →</Link>
      <small className="muted">7 zile gratuite, fără card</small>
    </p>
  );
}

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

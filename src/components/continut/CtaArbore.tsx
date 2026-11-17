import Link from "next/link";

/** Legătura de cont nou, cu sursa paginii (?src=…, vezi src/lib/sursa) când e dată. */
const signupHref = (src?: string) => `/intrare?mod=cont-nou${src ? `&src=${encodeURIComponent(src)}` : ""}`;

/** Îndemnul de la finalul paginilor publice de conținut: arborele familiei, început gratuit. */
export default function CtaArbore({ title = "Începe arborele familiei tale", text = "Primele 7 zile sunt gratuite, fără card. Adaugi părinții și bunicii, iar rudele pot completa ce știu ele.", src }: { title?: string; text?: string; src?: string }) {
  return (
    <div className="card cta-card">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p>{text}</p>
      <Link className="btn primary" href={signupHref(src)}>{title} →</Link>
    </div>
  );
}

/**
 * Îndemnul de sus (17.11.2026, mobil): butonul principal vizibil fără derulare, imediat sub datele paginii. Cel de jos rămâne.
 */
export function CtaSus({ label = "Începe arborele gratuit", src }: { label?: string; src?: string }) {
  return (
    <p className="cta-top">
      <Link className="btn primary" href={signupHref(src)}>{label} →</Link>
      <small className="muted">7 zile gratuite, fără card</small>
    </p>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/db";
import { Logo } from "@/components/Logo";
import { CARD_ORIGIN, activationUrl, cardByShareToken, giftCardsEnabled, pl } from "@/lib/carduri-cadou";

export const dynamic = "force-dynamic";

const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };
const durata = (m: number) => (m === 12 ? "un an" : m % 12 === 0 ? `${m / 12} ani` : pl(m, "lună", "luni"));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const img = `${CARD_ORIGIN}/card-imagine/${token}?f=og`;
  return {
    title: "Un card cadou Cartea Neamului pentru tine",
    description: "Povestea familiei tale, într-un singur loc. Deschide cardul și activează-l.",
    robots: { index: false, follow: false },
    openGraph: { title: "Un card cadou Cartea Neamului pentru tine", description: "Povestea familiei tale, într-un singur loc.", images: [{ url: img, width: 1200, height: 630 }] },
  };
}

/**
 * Cardul cadou digital, cum îl vede pe telefon cine l-a primit de la magazin (WhatsApp, SMS, email sau QR de pe ecranul casei):
 * felicitarea, pentru cine e, biletul, codul și butonul „Activează”. Merge doar după ce magazinul l-a vândut și cât e pornită
 * funcția din Admin. Legătura e secretă (144 de biți), deci nu se poate ghici.
 */
export default async function DigitalCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [on, c] = await Promise.all([giftCardsEnabled(db), cardByShareToken(db, token)]);
  const neutral = (h: string, p: string) => (
    <section className="stack" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card"><h1 style={{ marginTop: 0 }}>{h}</h1><p>{p}</p><div className="actions"><Link className="btn" href="/">Prima pagină</Link></div></div>
    </section>
  );
  if (!on || !c) return neutral("Card cadou", "Această pagină nu este disponibilă în acest moment.");
  if (c.status === "anulat") return neutral("Card anulat", "Acest card a fost anulat. Pentru lămuriri, scrie-ne pe pagina de Contact.");
  if (c.status === "generat" || c.status === "livrat_magazin") return neutral("Cardul nu este încă activ", "Magazinul nu a terminat încă vânzarea acestui card. Încearcă din nou peste câteva minute.");
  const used = c.status === "folosit";
  const url = activationUrl(CARD_ORIGIN, c.cod);
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1d17", light: "#fffdf8" } });
  return (
    <section className="dc-wrap">
      <article className="dc-card">
        <div className="dc-brand"><Logo size={26} /><b>Cartea Neamului</b></div>
        <p className="dc-eyebrow">Card cadou</p>
        <h1>{c.pentru ? `Pentru ${c.pentru}` : "Un dar pentru familia ta"}</h1>
        <p className="dc-lead">Povestea familiei tale, într-un singur loc: arborele, pozele, glasurile și amintirile celor dragi. Planul {PLAN[c.plan] ?? c.plan}, pentru {durata(c.durataLuni)}.</p>
        {c.mesaj && <blockquote className="dc-note">{c.mesaj}</blockquote>}
        {used ? (
          <p className="cc-ok" role="status">Cardul a fost deja activat. Intră în cont ca să continui povestea familiei.</p>
        ) : (
          <>
            <div className="dc-code"><span>Codul tău</span><code>{c.cod}</code></div>
            <Link className="btn primary dc-go" href={`/activeaza?cod=${encodeURIComponent(c.cod)}`}>Activează cardul</Link>
          </>
        )}
        <div className="dc-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="dc-small">Cumpărat de la {c.magazin}. Codul se activează o singură dată, pe contul tău; dacă ai deja un an plătit, se adaugă după el.</p>
      </article>
      <div className="actions" style={{ justifyContent: "center" }}>
        <a className="btn" href={`/card-imagine/${token}`} download={`card-cadou-${c.cod}.png`}>Salvează cardul ca imagine</a>
        {used && <Link className="btn primary" href="/intrare">Intră în cont</Link>}
      </div>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import PrintButton from "@/components/PrintButton";
import { Logo } from "@/components/Logo";
import { CARD_ORIGIN, activationUrl, batchById, batchCards, lotLabel, pl } from "@/lib/carduri-cadou";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carduri de tipar · Admin" };

/**
 * Cardurile unui lot, gata de tipar: format carte de vizită 85×55 mm, câte 10 pe o foaie A4 (2 × 5), cu linii fine de tăiere.
 * Pe fiecare: semnul și numele Cartea Neamului, textul scurt, QR-ul spre /activeaza?cod=… și codul sub zona „răzuiește aici”
 * (acolo se lipește eticheta de răzuit). Din fereastra de tipărire se alege „Salvează ca PDF” pentru fișierul de dus la tipografie.
 * Cardurile anulate nu se tipăresc.
 */
export default async function PrintCards({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/carduri/lot/${id}/tipar`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const b = await batchById(db, id);
  if (!b) notFound();
  const cards = (await batchCards(db, id)).filter((c) => c.status !== "anulat");
  const qrs = await Promise.all(cards.map((c) => QRCode.toString(activationUrl(CARD_ORIGIN, c.cod), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1d17", light: "#ffffff" } })));
  const pages: number[][] = [];
  for (let i = 0; i < cards.length; i += 10) pages.push(cards.slice(i, i + 10).map((_, k) => i + k));
  const months = b.durataLuni === 12 ? "1 an" : b.durataLuni === 24 ? "2 ani" : pl(b.durataLuni, "lună", "luni");
  return (
    <section className="cc-print-wrap">
      <div className="cc-print-tools">
        <p><Link href={`/admin/carduri/lot/${id}`}>← Înapoi la lot</Link></p>
        <p className="muted">
          {pl(cards.length, "card", "carduri")} pentru {b.partner}, câte 10 pe o foaie A4. Apasă butonul, apoi alege <b>„Salvează ca PDF”</b> (sau imprimanta).
          Pune „Margini: niciuna” și „Scară: 100%”, ca să iasă exact 85×55 mm.
        </p>
        <PrintButton label="Tipărește / Salvează ca PDF" />
      </div>
      {pages.map((idx, p) => (
        <div className="cc-sheet" key={p}>
          {idx.map((i) => {
            const c = cards[i];
            return (
              <article className="cc-card" key={c.id}>
                <div className="cc-card-left">
                  <div className="cc-brand"><Logo size={18} /><b>Cartea Neamului</b></div>
                  <p className="cc-text">Povestea familiei tale, într-un singur loc. Scanează și activează abonamentul pe {months}.</p>
                  <div className="cc-scratch">
                    <span>▼ răzuiește aici ▼</span>
                    <code>{c.cod}</code>
                  </div>
                  <small className="cc-url">carteaneamului.ro/activeaza · Lot {lotLabel(id)} · Nr. {c.seq}</small>
                </div>
                <div className="cc-qr" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}

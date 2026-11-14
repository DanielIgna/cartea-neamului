import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import PrintButton from "@/components/PrintButton";
import { Logo } from "@/components/Logo";
import { CARD_ORIGIN, partnerById } from "@/lib/carduri-cadou";
import { refUrl } from "@/lib/parteneri-crm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kit de tipar · City Partners · Admin" };

/**
 * Kitul de tipar al unui partener, cu numele lui și QR-ul lui de recomandare (/r/<cod>): pagina 1 e afișul A4, pagina 2 are
 * patru autocolante de 9×9 cm pentru casă, pagina 3 are 10 cărți de vizită de 85×55 mm. Se tipărește sau se salvează ca PDF.
 */
export default async function Kit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/parteneri/${id}/kit`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await partnerById(db, id);
  if (!p || !p.refCode) notFound();
  const url = refUrl(CARD_ORIGIN, p.refCode);
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1d17", light: "#ffffff" } });
  const short = url.replace(/^https?:\/\/(www\.)?/, "");
  const QR = ({ cls }: { cls: string }) => <div className={cls} dangerouslySetInnerHTML={{ __html: qr }} />;
  return (
    <section className="cc-print-wrap">
      <div className="cc-print-tools">
        <p><Link href={`/admin/parteneri/${id}`}>← Înapoi la {p.numeMagazin}</Link></p>
        <p className="muted">Trei pagini A4: afișul, 4 autocolante pentru casă (9×9 cm) și 10 cărți de vizită (85×55 mm). Apasă butonul și alege „Salvează ca PDF”, cu „Margini: niciuna” și „Scară: 100%”.</p>
        <PrintButton label="Tipărește / Salvează ca PDF" />
      </div>

      <div className="cc-sheet kit-poster">
        <div className="kit-brand"><Logo size={56} /><b>Cartea Neamului</b></div>
        <p className="kit-at">Acum și la <b>{p.numeMagazin}</b>{p.oras ? `, ${p.oras}` : ""}</p>
        <h1>Povestea familiei tale,<br />într-un singur loc.</h1>
        <p className="kit-lead">Arborele familiei, pozele, glasurile și amintirile bunicilor, păstrate pentru copii și nepoți. Și o carte a neamului, gata de tipărit.</p>
        <div className="kit-offer">
          <div><b>Card cadou</b><span>un an în Cartea Neamului, primit direct pe telefon</span></div>
          <div><b>La casă</b><span>întreabă de cardul cadou: un dar care rămâne în familie</span></div>
        </div>
        <QR cls="kit-qr" />
        <p className="kit-scan">Scanează și începe gratuit povestea familiei tale</p>
        <p className="kit-url">{short}</p>
      </div>

      <div className="cc-sheet kit-stickers">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kit-sticker">
            <div className="kit-brand small"><Logo size={22} /><b>Cartea Neamului</b></div>
            <p>Card cadou: povestea familiei, pe telefon</p>
            <QR cls="kit-qr-s" />
            <small>Întreabă la casă · {p.numeMagazin}</small>
          </div>
        ))}
      </div>

      <div className="cc-sheet">
        {Array.from({ length: 10 }, (_, i) => (
          <article key={i} className="cc-card">
            <div className="cc-card-left">
              <div className="cc-brand"><Logo size={18} /><b>Cartea Neamului</b></div>
              <p className="cc-text">Povestea familiei tale, într-un singur loc. Scanează și începe gratuit.</p>
              <p className="cc-text"><b>Card cadou la {p.numeMagazin}</b></p>
              <small className="cc-url">{short}</small>
            </div>
            <QR cls="cc-qr" />
          </article>
        ))}
      </div>
    </section>
  );
}

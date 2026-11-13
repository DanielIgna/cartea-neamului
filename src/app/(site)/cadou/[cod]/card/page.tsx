import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/db";
import PrintButton from "@/components/PrintButton";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/access";
import { giftByCode } from "@/lib/extra";
import { isTier } from "@/lib/plans";
import { siteOrigin } from "@/lib/site";
import { getAppName, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("GiftPage"))("printCard"), robots: { index: false, follow: false } };
}

/**
 * Cardul de tipărit al unui an dăruit, de pus în plic sau sub brad: biletul, legătura și un cod QR spre ea.
 * Îl vede doar cel care a plătit darul, cât timp darul nu a fost încă primit.
 */
export default async function GiftCardPage({ params }: { params: Promise<{ cod: string }> }) {
  const { cod } = await params;
  const me = await requireUser(`/cadou/${cod}/card`);
  const g = await giftByCode(db, cod);
  if (!g || g.buyerId !== me.id || g.redeemedBy || !isTier(g.tier)) notFound();
  const [t, tp, appName, origin] = await Promise.all([getT("GiftPage"), getT("Plata"), getAppName(), siteOrigin()]);
  const url = `${origin}/cadou/${g.id}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1d17", light: "#fffdf8" } });
  return (
    <section className="stack">
      <div className="gift-card">
        <Logo />
        <div className="section-label">{appName}</div>
        <h1>{t("cardTitle")}</h1>
        {g.forName && <p><b>{t("cardFor", { name: g.forName })}</b></p>}
        <p>{t("cardText", { plan: tp(`tiers.${g.tier}.name`) })}</p>
        {g.note && <p className="gift-card-note">{g.note}</p>}
        <div className="gift-card-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p>{t("cardHow")}</p>
        <code>{url}</code>
      </div>
      <div className="actions gift-print-hide" style={{ justifyContent: "center" }}>
        <PrintButton label={t("printCard")} />
        <Link className="btn" href="/plata#cadou">{t("cardBack")}</Link>
      </div>
      <p className="muted gift-print-hide" style={{ textAlign: "center" }}>{t("cardHint")}</p>
    </section>
  );
}

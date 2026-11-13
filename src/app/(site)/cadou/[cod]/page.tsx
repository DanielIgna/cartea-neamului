import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { giftByCode, redeemGift } from "@/lib/extra";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("Plata"))("giftPageTitle"), robots: { index: false } };
}

/**
 * Anul dăruit: cine primește legătura o deschide, intră în cont (sau își face unul) și apasă „Primește anul”. Biletul de la cel
 * care l-a dăruit se vede deasupra. Un dar se primește o singură dată.
 */
export default async function GiftPage({ params, searchParams }: { params: Promise<{ cod: string }>; searchParams: Promise<{ r?: string }> }) {
  const { cod } = await params;
  const { r } = await searchParams;
  const g = await giftByCode(db, cod);
  if (!g) notFound();
  const [t, me] = await Promise.all([getT("Plata"), currentUser()]);
  async function take() {
    "use server";
    const u = await currentUser();
    if (!u) redirect(`/intrare?next=${encodeURIComponent(`/cadou/${cod}`)}`);
    const res = await redeemGift(db, cod, u.id);
    redirect(`/cadou/${cod}?r=${res}`);
  }
  const plan = t(`tiers.${g.tier as "basic" | "familie" | "premium"}.name`);
  return (
    <section className="stack" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("giftPageTitle")}</h1>
        <p>{t("giftPageText", { plan })}</p>
        {g.note && <blockquote className="gift-note">{g.note}</blockquote>}
        {r === "ok" || (g.redeemedBy && g.redeemedBy === me?.id) ? (
          <p className="pay-ok" role="status">{t("giftTaken")} <Link href="/plata">{t("giftSeePlan")}</Link></p>
        ) : g.redeemedBy || r === "used" ? (
          <p className="err">{t("giftUsed")}</p>
        ) : r === "own" ? (
          <p className="err">{t("giftOwn")}</p>
        ) : me ? (
          <form action={take}><div className="actions"><button className="btn primary">{t("giftTake")}</button></div></form>
        ) : (
          <div className="actions"><Link className="btn primary" href={`/intrare?next=${encodeURIComponent(`/cadou/${cod}`)}`}>{t("giftSignIn")}</Link></div>
        )}
      </div>
    </section>
  );
}

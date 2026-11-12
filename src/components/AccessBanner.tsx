import Link from "next/link";
import { db } from "@/db";
import { accessBanner } from "@/lib/plata";
import { getT } from "@/i18n/server";

/**
 * Banda de sus, doar când plățile sunt pornite din Admin: câte zile gratuite mai are omul, sau că s-au terminat și arborii lui
 * se pot doar vedea până plătește. Prețul: în lei pentru română, în euro pentru celelalte limbi.
 * Butonul duce la pagina de plată.
 */
export default async function AccessBanner({ userId, locale }: { userId: string; locale: string }) {
  const info = await accessBanner(db, userId).catch(() => null);
  if (!info) return null;
  const t = await getT("Access");
  const price = locale === "ro" ? `${info.price.lei} lei` : `${info.price.eur} €`;
  const ended = info.access.kind === "expirat";
  return (
    <div className={`access-banner${ended ? " ended" : ""}`} role="status">
      <p>{ended
        ? t.rich("ended", { price, b: (c) => <b>{c}</b> })
        : t("trial", { days: info.access.kind === "proba" ? info.access.daysLeft : 0, price })}</p>
      <Link className={`btn${ended ? " primary" : ""}`} href="/plata">{t("pay")}</Link>
    </div>
  );
}

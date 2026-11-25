import Link from "next/link";
import { db } from "@/db";
import { accessBanner } from "@/lib/plata";
import { getT } from "@/i18n/server";
import { myArchiveNotes } from "@/lib/arhivare";
import { activeOffer, convSettings } from "@/lib/conversie";
import LastDayPopup from "./LastDayPopup";
import { PERIODS, TIERS, periodPrice, planSettings } from "@/lib/plans";
import { money } from "@/lib/plati";

/**
 * Banda de sus, doar când plățile sunt pornite din Admin: câte zile gratuite mai are omul, sau că s-au terminat și arborii lui
 * se pot doar vedea până plătește. Prețul: în lei pentru română, în euro pentru celelalte limbi.
 * Butonul duce la pagina de plată. La final, spune ce rămâne gratuit și arată Basic lângă Familie, cu prețurile.
 */
export default async function AccessBanner({ userId, locale }: { userId: string; locale: string }) {
  const info = await accessBanner(db, userId).catch(() => null);
  if (!info) return null;
  const [t, tk] = await Promise.all([getT("Access"), getT("Keep")]);
  const price = locale === "ro" ? `${info.price.lei} lei` : `${info.price.eur} €`;
  const ended = info.access.kind === "expirat";
  // La finalul zilelor gratuite (și în ultimele două), un mesaj clar: ce rămâne gratuit și Basic lângă Familie, cu prețurile.
  const familie = locale === "ro" ? `${info.familie.lei} lei` : `${info.familie.eur} €`;
  const last = ended || (info.access.kind === "proba" && info.access.daysLeft <= 2);
  // „Păstrarea”: cine o are vede tot (doar fără adăugări); cine a avut un an și n-o are află că pozele altora se văd în mic.
  if (info.access.kind === "expirat" && info.access.keptUntil) {
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(info.access.keptUntil);
    return (
      <div className="access-banner" role="status">
        <p>{tk("banner", { date })}</p>
        <Link className="btn" href="/plata">{t("pay")}</Link>
      </div>
    );
  }
  // Arhiva sigilată: cu 90 de zile înainte ca pozele unui arbore al lui să rămână doar în mic (sau să intre în arhivă), o vorbă aici.
  const soon = ended ? (await myArchiveNotes(db, userId).catch(() => [])).find((n) => n.state.kind === "liber" && n.state.next.at.getTime() - Date.now() < 90 * 86_400_000) : undefined;
  const archiveLine = soon && soon.state.kind === "liber"
    ? (await getT("ArchiveNote"))("banner", { tree: soon.name, date: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(soon.state.next.at) }) : null;
  const keep = info.keep && (locale === "ro" ? info.keep.lei : info.keep.eur) > 0
    ? tk("bannerOffer", { price: locale === "ro" ? `${info.keep.lei} lei` : `${info.keep.eur} €` }) : null;
  // Din gratuit în plătit (src/lib/conversie.ts): după zile, „Activează un plan ca să continui” și reducerea, cât e valabilă;
  // în ultima zi, o fereastră o dată pe zi.
  const tc = await getT("Conversion");
  const offer = ended ? await activeOffer(db, userId).catch(() => null) : null;
  const fmt = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);
  // Cu abonamentele (Daniel, 25.11.2026): „După ele, alegi un plan: de la 16,99 lei pe lună sau 49 lei pe an.”
  let trialLine: string | null = null;
  if (info.access.kind === "proba") {
    const s = await planSettings(db).catch(() => null);
    if (s?.subs) {
      const lei = locale === "ro";
      const v = (p: (typeof PERIODS)[number]) => Math.min(...TIERS.map((x) => { const r = periodPrice(x, p, true, s); return r ? (lei ? r.lei : r.eur) : Infinity; }));
      const [tp, tpr] = await Promise.all([getT("Plata"), getT("Preturi")]);
      trialLine = `${tp("trial", { days: info.access.daysLeft })} ${tpr("bannerAfter", { month: money(v("luna"), locale).label, year: money(v("an"), locale).label })}`;
    }
  }
  const lastDay = info.access.kind === "proba" && info.access.daysLeft <= 1 && (await convSettings(db)).popup;
  return (
    <div className={`access-banner${ended ? " ended" : ""}`} role="status">
      <p>{ended
        ? t.rich("ended", { price, b: (c) => <b>{c}</b> })
        : trialLine ?? t("trial", { days: info.access.kind === "proba" ? info.access.daysLeft : 0, price })}
        {ended && <><br /><span className="access-plans">{tc("activateText")}</span></>}
        {offer && <><br /><b>{tc("offerBar", { percent: String(offer.percent), until: fmt(offer.expiresAt), code: offer.code })}</b></>}
        {last && <><br /><span className="access-plans">{t("plans", { basic: price, familie })}</span></>}
        {ended && keep && <><br /><span className="access-plans">{keep}</span></>}
        {archiveLine && <><br /><span className="access-plans">{archiveLine} <Link href="/arhiva">{tk("archiveLink")}</Link></span></>}</p>
      <Link className={`btn${ended ? " primary" : ""}`} href="/plata">{ended ? tc("activate") : t("pay")}</Link>
      {lastDay && <LastDayPopup day={new Date().toISOString().slice(0, 10)} title={tc("popupTitle")} text={tc("popupText", { basic: price })} pay={tc("popupPay")} later={tc("popupLater")} />}
    </div>
  );
}

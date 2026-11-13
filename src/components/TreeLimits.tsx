import Link from "next/link";
import { db } from "@/db";
import { treeUsage } from "@/lib/plata";
import { getLocale, getT } from "@/i18n/server";

/**
 * În arbore, discret: când un plafon al planului titularului (persoane, poze, glasuri, acte) e aproape plin (de la 90%)
 * sau plin, un rând scurt, de pildă „Poze: 198 / 200”, cu legătura la planuri. Doar pentru cei care pot adăuga.
 */
export default async function TreeLimits({ treeId }: { treeId: string }) {
  const usage = await treeUsage(db, treeId).catch(() => []);
  if (!usage.length) return null;
  const [t, locale] = await Promise.all([getT("Plata"), getLocale()]);
  const nf = new Intl.NumberFormat(locale);
  return (
    <p className="tree-limits" role="status">
      <span>{t("treeNear")}</span>
      {usage.map((u) => <span key={u.what}>{t(`lim.${u.what}`)}: <b>{nf.format(u.used)} / {nf.format(u.cap)}</b></span>)}
      <Link href="/plata">{t("treeLink")}</Link>
    </p>
  );
}

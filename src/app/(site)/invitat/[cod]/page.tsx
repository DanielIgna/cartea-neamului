import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { planSettings } from "@/lib/plans";
import { cleanCode, firstName, inviteSettings, ownerOfCode } from "@/lib/invitatii";
import { getAppName, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** Previzualizarea legăturii (WhatsApp, Facebook): doar prenumele celui care invită. Nu se indexează. */
export async function generateMetadata({ params }: { params: Promise<{ cod: string }> }): Promise<Metadata> {
  const owner = await ownerOfCode(db, cleanCode((await params).cod)).catch(() => null);
  const t = await getT("Invites");
  const name = firstName(owner?.name);
  const title = name ? t("landTitle", { name }) : t("landTitleNoName");
  const description = t("landLead");
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description, siteName: await getAppName(), type: "website" } };
}

/**
 * Pagina la care ajunge cine deschide o legătură de invitație (/i/<cod> trimite aici, după ce ține minte codul): cine îl invită,
 * câte zile gratuite are și cum le primesc amândoi. Codul merge și în adresa paginii de cont nou (`?inv=`), ca rezervă la cookie.
 */
export default async function Invited({ params }: { params: Promise<{ cod: string }> }) {
  const code = cleanCode((await params).cod);
  const [owner, me, t, s, plans] = await Promise.all([ownerOfCode(db, code).catch(() => null), currentUser(), getT("Invites"), inviteSettings(db), planSettings(db)]);
  const name = firstName(owner?.name);
  const base = plans.trialDays, total = base + (s.on ? s.daysReferred : 0);
  return (
    <section className="card invite-land">
      <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
      <h2>{owner && name ? t("landTitle", { name }) : t("landTitleNoName")}</h2>
      <p>{t("landLead")}</p>
      {owner && s.on && total > base && <p><b>{t("landGift", { total: String(total), base: String(base) })}</b><br /><span className="muted small">{t("landHow")}</span></p>}
      {me ? (
        <>
          <p className="muted">{t("landSigned")}</p>
          <Link className="btn primary" href="/invitatii">{t("landMine")}</Link>
        </>
      ) : (
        <div className="actions">
          <Link className="btn primary" href={`/intrare?mod=cont-nou${owner ? `&inv=${code}` : ""}`}>{t("landSignUp")}</Link>
          <Link className="btn" href="/intrare">{t("landHave")}</Link>
        </div>
      )}
    </section>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { partnerState, partnerUrl } from "@/lib/partners";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("PartnersPage");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/parteneri" } };
}

/**
 * Singura pagină cu partenerii (acum doar PropManage). Nu apare nicăieri în arbore, în amintiri, în cronologie, pe hartă sau
 * în carte: se ajunge aici doar din meniul contului și din subsol. Legătura spre partener poartă doar UTM-ul, iar sigla e
 * pusă la noi (public/parteneri), ca browserul să nu ceară nimic de la partener până nu apasă omul pe legătură.
 */
export default async function PartnersPage() {
  const t = await getT("PartnersPage");
  const me = await currentUser();
  const state = me ? await partnerState(db, me.id).catch(() => null) : null;
  const myData = (c: React.ReactNode) => <Link href="/datele-mele#parteneri">{c}</Link>;
  return (
    <section className="stack partners" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h2>{t("title")}</h2>
        <p>{t("lead")}</p>
      </div>
      <div className="card partner-item">
        <img src="/parteneri/propmanage.svg" alt={t("pmAlt")} width={200} height={47} className="partner-logo" />
        <div className="muted" style={{ fontSize: 14 }}>{t("pmWhat")}</div>
        <p>{t("pmLine1")}</p>
        <p>{t("pmLine2")}</p>
        <div className="actions">
          <a className="btn primary" href={partnerUrl("parteneri")} target="_blank" rel="noopener noreferrer">{t("pmCta")}</a>
        </div>
      </div>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("dataTitle")}</div>
        <p>{t("dataText")}</p>
        <p className="muted">
          {state ? t.rich(state.granted ? "stateOn" : "stateOff", { link: myData })
            : t.rich("stateGuest", { link: (c) => <Link href="/confidentialitate#parteneri">{c}</Link> })}
        </p>
      </div>
    </section>
  );
}

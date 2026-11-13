import Link from "next/link";
import { getT } from "@/i18n/server";
import { partnerUrl, type partnerState } from "@/lib/partners";

/** Pagina în sine; `state` e acordul celui intrat în cont (null pentru vizitatori, și în varianta gata făcută din app/(public)). */
export default async function PartnersView({ state }: { state: Awaited<ReturnType<typeof partnerState>> | null }) {
  const t = await getT("PartnersPage");
  const myData = (c: React.ReactNode) => <Link href="/datele-mele#parteneri">{c}</Link>;
  return (
    <section className="stack partners" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card">
        <h1 className="section-label" style={{ marginTop: 0 }}>{t("label")}</h1>
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

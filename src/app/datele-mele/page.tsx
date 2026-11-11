import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { deletionPlan } from "@/lib/account";
import { consentState } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import { TERMS_DATE, operator } from "@/lib/legal";
import { AccountDelete, FaithWithdraw, PartnerToggle, UsageToggle } from "@/components/MyDataTools";
import { partnerState } from "@/lib/partners";
import { usageOf } from "@/lib/usage";
import { getFormat, getLocale, getAppName, getT } from "@/i18n/server";
import PageIntl from "@/i18n/PageIntl";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT("MyData");
  return { title: `${t("metaTitle")} · ${await getAppName()}` };
}

const tags = {
  b: (c: ReactNode) => <b>{c}</b>,
  terms: (c: ReactNode) => <Link href="/termeni">{c}</Link>,
  privacy: (c: ReactNode) => <Link href="/confidentialitate">{c}</Link>,
};

/**
 * „Datele mele”: ce știe site-ul despre cont, descărcarea lor, acordurile date (și retragerea celui pentru „Credința”)
 * și ștergerea contului, cu tot ce pleacă și ce rămâne în arborii familiei.
 */
export default async function MyDataPage() {
  const me = await requireUser("/datele-mele");
  const locale = await getLocale();
  const [t, tp, format] = await Promise.all([getT("MyData", locale), getT("Partners", locale), getFormat(locale)]);
  const day = (d: Date) => format.dateTime(d, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
  const rich = (key: string, v: Record<string, unknown> = {}) => (t.rich as unknown as (k: string, v: object) => ReactNode)(key, { ...tags, ...v });
  const duration = (seconds: number) => {
    if (seconds < 60) return t("duration.sec", { n: seconds });
    const min = Math.round(seconds / 60);
    if (min < 60) return t("duration.min", { n: min });
    const h = Math.floor(min / 60), m = min % 60;
    return m ? t("duration.hoursMin", { h, m }) : t("duration.hours", { h });
  };
  const [plan, terms, faith, usage] = await Promise.all([deletionPlan(db, me.id), consentState(db, me.id, "terms"), consentState(db, me.id, "faith"),
    consentState(db, me.id, "usage")]);
  const partner = await partnerState(db, me.id);
  const mine = usage.granted ? await usageOf(db, me.id, 30) : null;
  const contact = operator().email;
  const consent = tp("checkbox");
  const trees = [...plan.owned.map((t) => ({ id: t.id, name: t.name })), ...plan.member];
  return (
    <PageIntl ns={["MyData"]}>
    <section className="stack my-data">
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h2>{t("title")}</h2>
        <p>{rich("intro", { name: me.name, email: me.email, date: day(me.createdAt) })}</p>
      </div>

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("download.label")}</div>
        <p>{t("download.text")}</p>
        <div className="actions"><a className="btn primary" href="/api/datele-mele" download>{t("download.button")}</a></div>
        {trees.length > 0 && (
          <>
            <p className="muted" style={{ marginBottom: 4 }}>{t("download.gedcom")}</p>
            <ul className="my-trees">
              {trees.map((t) => <li key={t.id}><a href={`/api/arbore/${t.id}/gedcom?living=1`} download>{t.name}</a></li>)}
            </ul>
          </>
        )}
      </div>

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("consents.label")}</div>
        <p>{terms.granted && terms.at ? rich("consents.termsGiven", { date: day(terms.at) }) : rich("consents.termsLater", { date: day(TERMS_DATE) })}</p>
        <p>{faith.granted && faith.at ? t("consents.faithGiven", { date: day(faith.at), count: plan.faith })
          : faith.at ? t("consents.faithWithdrawn", { date: day(faith.at) }) : t("consents.faithNone")}</p>
        <FaithWithdraw answers={plan.faith} granted={faith.granted} />
        <p id="folosire" style={{ marginTop: 18 }}>{usage.granted && usage.at
          ? <>{t("consents.usageGiven", { date: day(usage.at) })}
              {mine && <> {mine.total ? t("consents.usageTotal", { total: duration(mine.total), count: mine.activeDays }) : t("consents.usageEmpty")}</>}</>
          : usage.at ? t("consents.usageRefused", { date: day(usage.at) }) : t("consents.usageNone")}
        </p>
        {mine && mine.sections.length > 0 && (
          <ul className="my-usage">
            {mine.sections.slice(0, 6).map((x) => <li key={x.section}>{t(`sections.${x.section}`)}: <b>{duration(x.seconds)}</b></li>)}
          </ul>
        )}
        <UsageToggle granted={usage.granted} demo={isDemo(me.email)} />
        <p id="parteneri" style={{ marginTop: 18 }}>{partner.granted && partner.since ? t("consents.partnerGiven", { date: day(partner.since), consent })
          : partner.since ? t("consents.partnerWithdrawn", { date: day(partner.since) }) : t("consents.partnerNone", { consent })}
          {" "}<Link href="/parteneri">{t("consents.aboutPartners")}</Link>.
        </p>
        <PartnerToggle granted={partner.granted} demo={isDemo(me.email)} />
      </div>

      <div className="card my-danger">
        <div className="section-label" style={{ marginTop: 0 }}>{t("remove.label")}</div>
        <p>{t("remove.text")}</p>
        <AccountDelete plan={plan} email={me.email} demo={isDemo(me.email)} />
        <p className="muted" style={{ marginTop: 12 }}>{rich("remove.contact", { email: contact, mail: (c: ReactNode) => <a href={`mailto:${contact}`}>{c}</a> })}</p>
      </div>
    </section>
    </PageIntl>
  );
}

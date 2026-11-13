import type { Metadata } from "next";
import { readUnsubscribeToken } from "@/lib/partners";
import { getT } from "@/i18n/server";
import UnsubscribeButton from "@/components/UnsubscribeButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cartea Neamului", robots: { index: false, follow: false } };

/**
 * Dezabonarea din emailurile partenerului, fără intrare în cont: legătura poartă un semn (HMAC) al contului. Deschiderea
 * paginii nu schimbă nimic; acordul se retrage abia la apăsarea butonului (vezi src/app/parteneri-actions.ts).
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t: token } = await searchParams;
  const t = await getT("PartnersPage");
  const ok = !!readUnsubscribeToken(token);
  return (
    <section className="stack" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        {ok ? (
          <>
            <h2>{t("unsubTitle")}</h2>
            <p>{t("unsubText")}</p>
            <UnsubscribeButton token={token!} label={t("unsubButton")} working={t("unsubWorking")} done={t("unsubDone")} bad={t("unsubBad")} />
          </>
        ) : <p className="err">{t("unsubBad")}</p>}
      </div>
    </section>
  );
}

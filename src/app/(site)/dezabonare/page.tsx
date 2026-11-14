import Link from "next/link";
import { unsubscribeNews } from "@/app/vesti-actions";
import { checkUnsubscribe } from "@/lib/crestere";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { getAppName, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { robots: PRIVATE_ROBOTS };

/**
 * Dezabonarea de la sfaturile pe email (legătura din fiecare email). Cere o apăsare pe buton, nu se face la simpla deschidere,
 * ca programele care verifică legăturile din emailuri să nu dezaboneze oamenii fără voia lor.
 */
export default async function Dezabonare({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const [t, app] = await Promise.all([getT("News"), getAppName()]);
  const valid = !!q.u && !!q.t && checkUnsubscribe(q.u, q.t);
  return (
    <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("unsubTitle")}</h1>
        {q.gata === "1" ? <p role="status">{t("unsubDone")}</p>
          : q.gata === "0" || !valid ? <p>{t("unsubBad")}</p>
          : (
            <form action={unsubscribeNews}>
              <input type="hidden" name="u" value={q.u} />
              <input type="hidden" name="t" value={q.t} />
              <p>{t("unsubAsk", { app })}</p>
              <button className="btn primary">{t("unsubConfirm")}</button>
            </form>
          )}
        <p style={{ marginBottom: 0 }}><Link href="/">{t("unsubHome")}</Link></p>
      </div>
    </section>
  );
}

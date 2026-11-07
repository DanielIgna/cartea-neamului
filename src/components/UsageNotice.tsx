"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { answerUsage } from "@/app/folosire-actions";

/** Anunțul cerut o singură dată: „Bine” pornește măsurarea timpului petrecut în site, „Nu vreau” n-o pornește. */
export default function UsageNotice() {
  const t = useTranslations("UsageNotice");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  if (done) return null;
  const answer = (granted: boolean) => start(async () => {
    const r = await answerUsage(granted);
    if (r.error) return setErr(r.error);
    setDone(true);
    router.refresh();
  });
  return (
    <aside className="usage-notice" aria-label={t("label")}>
      <p><b>{t("lead")}</b> {t("text")}</p>
      <div className="usage-actions">
        <button type="button" className="btn primary" disabled={pending} onClick={() => answer(true)}>{t("yes")}</button>
        <button type="button" className="btn" disabled={pending} onClick={() => answer(false)}>{t("no")}</button>
        <Link href="/confidentialitate#folosire">{t("more")}</Link>
        {err && <span className="err" role="alert">{err}</span>}
      </div>
    </aside>
  );
}

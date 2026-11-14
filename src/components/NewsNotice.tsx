"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { answerNews } from "@/app/vesti-actions";

/** Întrebarea „Vrei sfaturi pe email?”, pusă o singură dată (după celelalte întrebări). Fără „Da” nu pleacă niciun sfat. */
export default function NewsNotice() {
  const t = useTranslations("News");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  if (done) return null;
  const answer = (granted: boolean) => start(async () => {
    const r = await answerNews(granted);
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
        <Link href="/confidentialitate#data">{t("more")}</Link>
        {err && <span className="err" role="alert">{err}</span>}
      </div>
    </aside>
  );
}

/** Comutatorul din „Datele mele”. */
export function NewsToggle({ granted, demo }: { granted: boolean; demo: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("News");
  if (demo) return <p className="muted">{t("demo")}</p>;
  return (
    <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
      <button type="button" role="switch" aria-checked={granted} className={`switch${granted ? " on" : ""}`} disabled={pending}
        onClick={() => start(async () => {
          const r = await answerNews(!granted);
          if (r.error) return setMsg(r.error);
          setMsg(granted ? t("stopped") : t("started"));
          router.refresh();
        })}>
        <span className="switch-knob" aria-hidden />
        <span>{pending ? t("pending") : granted ? t("stop") : t("start")}</span>
      </button>
      {msg && <span role="status" className="muted">{msg}</span>}
    </div>
  );
}

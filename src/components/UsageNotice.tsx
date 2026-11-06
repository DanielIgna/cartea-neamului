"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { answerUsage } from "@/app/folosire-actions";
import { USAGE_CONSENT_TEXT } from "@/lib/legal";

/** Anunțul cerut o singură dată: „Bine” pornește măsurarea timpului petrecut în site, „Nu vreau” n-o pornește. */
export default function UsageNotice() {
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
    <aside className="usage-notice" aria-label="Cât folosești site-ul">
      <p><b>O întrebare, o singură dată.</b> {USAGE_CONSENT_TEXT}</p>
      <div className="usage-actions">
        <button type="button" className="btn primary" disabled={pending} onClick={() => answer(true)}>Bine</button>
        <button type="button" className="btn" disabled={pending} onClick={() => answer(false)}>Nu vreau</button>
        <Link href="/confidentialitate#folosire">Ce înseamnă</Link>
        {err && <span className="err" role="alert">{err}</span>}
      </div>
    </aside>
  );
}

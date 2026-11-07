"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChatLimit } from "@/app/actions";
import { useLocale, useTranslations } from "use-intl";
import { degreeWord } from "@/lib/kin-words";

/** Doar proprietarul arborelui alege până la ce grad de rudenie își pot scrie membrii. */
export default function ChatLimit({ treeId, limit }: { treeId: string; limit: number }) {
  const router = useRouter();
  const t = useTranslations("Chat"), locale = useLocale();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <label className="gen-select" style={{ marginBottom: 10 }}>
      {t("limitLabel")}
      <select defaultValue={limit} disabled={pending} onChange={(e) => {
        const v = Number(e.target.value);
        start(async () => { const r = await setChatLimit(treeId, v); setErr(r.error ?? null); router.refresh(); });
      }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{t("limitOption", { degree: degreeWord(d, locale), d: String(d) })}</option>)}
      </select>
      {err && <span className="err">{err}</span>}
    </label>
  );
}

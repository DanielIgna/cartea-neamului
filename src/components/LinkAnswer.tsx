"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { answerLink } from "@/app/harta-actions";
import { answerJoinRequest } from "@/app/join-actions";

/**
 * Răspunsul la o cerere: „Din aceleași locuri” (Acceptă / Refuză, „Încheie legătura”, „Acceptă totuși”)
 * sau intrarea cuiva în arbore după nume și data nașterii (Acceptă / Refuză).
 */
export default function LinkAnswer({ id, mode, kind = "place" }: { id: string; mode: "ask" | "end" | "undo"; kind?: "place" | "join" }) {
  const router = useRouter();
  const t = useTranslations("Chat");
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function answer(accept: boolean) {
    setBusy(true); setErr(null);
    const res = kind === "join" ? await answerJoinRequest(id, accept) : await answerLink(id, accept);
    setBusy(false);
    if (res.error) setErr(res.error); else router.refresh();
  }
  return (
    <span className="actions" style={{ margin: 0, alignItems: "center" }}>
      {mode === "ask" && <>
        <button className="btn primary" disabled={busy} onClick={() => answer(true)}>{t("accept")}</button>
        <button className="btn" disabled={busy} onClick={() => answer(false)}>{t("refuse")}</button>
      </>}
      {mode === "undo" && <button className="btn" disabled={busy} onClick={() => answer(true)}>{t("acceptAnyway")}</button>}
      {mode === "end" && (sure
        ? <><small>{t("endWarn")}</small><button className="btn" disabled={busy} onClick={() => answer(false)}>{t("yesEnd")}</button><button className="btn" onClick={() => setSure(false)}>{t("no")}</button></>
        : <button className="linklike" style={{ fontSize: 13 }} onClick={() => setSure(true)}>{t("endLink")}</button>)}
      {err && <small className="err">{err}</small>}
    </span>
  );
}

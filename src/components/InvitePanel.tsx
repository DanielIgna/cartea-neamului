"use client";
import { useActionState, useState } from "react";
import { useFormatter, useTranslations } from "use-intl";
import { createInviteLink } from "@/app/actions";

export default function InvitePanel({ treeId, personId, personName }: { treeId: string; personId?: string; personName?: string }) {
  const t = useTranslations("InvitePanel");
  const format = useFormatter();
  const [state, action, pending] = useActionState(createInviteLink, null);
  const [copied, setCopied] = useState("");
  const copy = async (v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(t("copied")); } catch { setCopied(t("copyManually")); }
  };
  // Ziua până la care merge linkul, la amiază, ca să nu sară în ziua de dinainte sau de după din cauza orei.
  const until = (day: string) => format.dateTime(new Date(`${day}T12:00:00Z`), { day: "numeric", month: "long", year: "numeric" });
  return (
    <form action={action} className="form">
      <input type="hidden" name="treeId" value={treeId} />
      {personId && <input type="hidden" name="personId" value={personId} />}
      <label>{personName ? t("whatCan", { name: personName }) : t("whatCanRelative")}
        <select name="role" defaultValue="contributor">
          <option value="contributor">{t("contributor")}</option>
          <option value="editor">{t("editor")}</option>
          <option value="viewer">{t("viewer")}</option>
        </select>
      </label>
      <button className="btn primary" disabled={pending}>{pending ? t("creating") : personId ? t("createFor", { name: personName ?? "" }) : t("create")}</button>
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      {state && "link" in state && state.link && (
        <div className="linkbox">
          <input readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} aria-label={t("linkLabel")} />
          <button type="button" className="btn" onClick={() => copy(state.link!)}>{t("copy")}</button>
          <small className="muted" style={{ width: "100%" }}>{copied || t("valid", { date: until(state.expiresAt) })}</small>
        </div>
      )}
    </form>
  );
}

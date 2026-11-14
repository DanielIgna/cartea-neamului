"use client";
import { useActionState, useState } from "react";
import { useFormatter, useTranslations } from "use-intl";
import { createInviteLink } from "@/app/actions";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/** Linkul cu semnele din Analiză: de unde a plecat (whatsapp, email, telefon) și campania „invitatie”. */
function tagged(link: string, source: string) {
  try {
    const u = new URL(link);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "invitatie");
    u.searchParams.set("utm_campaign", "invitatie");
    return u.toString();
  } catch {
    return link;
  }
}

export default function InvitePanel({ treeId, personId, personName }: { treeId: string; personId?: string; personName?: string }) {
  const t = useTranslations("InvitePanel");
  const ts = useTranslations("Share");
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
          {"share" in state && state.share && (() => {
            const msg = (src: string) => ts("message", { app: state.app ?? "", link: tagged(state.link!, src) });
            const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
            return (
              <div className="actions invite-share" style={{ width: "100%", marginTop: 4 }}>
                <a className="btn primary" href={`https://wa.me/?text=${encodeURIComponent(msg("whatsapp"))}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon size={18} /> {ts("whatsapp")}
                </a>
                <a className="btn" href={`mailto:?subject=${encodeURIComponent(ts("subject"))}&body=${encodeURIComponent(msg("email"))}`}>{ts("email")}</a>
                {canShare && <button type="button" className="btn" onClick={() => navigator.share({ title: ts("subject"), text: msg("telefon") }).catch(() => undefined)}>{ts("share")}</button>}
              </div>
            );
          })()}
        </div>
      )}
    </form>
  );
}

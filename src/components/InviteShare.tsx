"use client";
import { useState } from "react";
import { useTranslations } from "use-intl";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/** Legătura cu canalul pe care pleacă (?c=whatsapp…), ca în Analiză să se vadă pe unde au venit invitații. */
function via(link: string, channel: string) {
  try {
    const u = new URL(link);
    u.searchParams.set("c", channel);
    return u.toString();
  } catch {
    return link;
  }
}

/**
 * Butoanele de trimis legătura personală de invitație (/i/<cod>): copiază, WhatsApp, Facebook, Messenger, email, SMS și,
 * pe telefon, „Trimite…” (meniul telefonului). Textul mesajului e în limba omului, cu zilele din Admin.
 */
export default function InviteShare({ link, app, total }: { link: string; app: string; total: number }) {
  const t = useTranslations("InviteShare");
  const [note, setNote] = useState("");
  const msg = (c: string) => t("message", { app, total: String(total), link: via(link, c) });
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setNote(t("copied")); } catch { setNote(t("copyManually")); }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const enc = encodeURIComponent;
  return (
    <div className="invite-share-box">
      <div className="linkbox">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={t("copy")} />
        <button type="button" className="btn primary" onClick={copy}>{t("copy")}</button>
        {note && <small className="muted" role="status" style={{ width: "100%" }}>{note}</small>}
      </div>
      <div className="actions invite-share" style={{ marginTop: 10 }}>
        <a className="btn primary" href={`https://wa.me/?text=${enc(msg("whatsapp"))}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} /> {t("whatsapp")}</a>
        <a className="btn" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(via(link, "facebook"))}`} target="_blank" rel="noopener noreferrer">{t("facebook")}</a>
        <a className="btn" href={`fb-messenger://share/?link=${enc(via(link, "messenger"))}`}>{t("messenger")}</a>
        <a className="btn" href={`mailto:?subject=${enc(t("subject"))}&body=${enc(msg("email"))}`}>{t("email")}</a>
        <a className="btn" href={`sms:?&body=${enc(msg("sms"))}`}>{t("sms")}</a>
        {canShare && <button type="button" className="btn" onClick={() => navigator.share({ title: t("subject"), text: msg("telefon") }).catch(() => undefined)}>{t("more")}</button>}
      </div>
    </div>
  );
}

"use client";
import { useActionState, useState } from "react";
import { useTranslations } from "use-intl";
import { sendContactMessage, type ContactResult } from "@/app/contact-actions";
import { CONTACT_LIMITS } from "@/lib/contact";

/** Formularul de pe /contact: nume, email (ca să-i putem răspunde) și mesajul. Trimiterea se face pe server. */
export default function ContactForm({ from, message }: { from?: string; message?: string }) {
  const t = useTranslations("Contact");
  const [key, setKey] = useState(0);
  return <Inner key={key} t={t} from={from} message={key ? undefined : message} again={() => setKey((k) => k + 1)} />;
}

function Inner({ t, from, message, again }: { t: ReturnType<typeof useTranslations<"Contact">>; from?: string; message?: string; again: () => void }) {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(sendContactMessage, null);
  if (state?.ok) {
    return (
      <div className="stack" role="status">
        <p className="contact-sent">{t("sent")}</p>
        <div><button type="button" className="btn" onClick={again}>{t("another")}</button></div>
      </div>
    );
  }
  return (
    <form action={action} className="form contact-form">
      <label>{t("name")}<input name="name" required maxLength={CONTACT_LIMITS.name} autoComplete="name" /></label>
      <label>{t("email")}<input name="email" type="email" required maxLength={CONTACT_LIMITS.email} autoComplete="email" inputMode="email" /></label>
      <label>{t("message")}<textarea name="message" defaultValue={message} required rows={6} minLength={CONTACT_LIMITS.minMessage} maxLength={CONTACT_LIMITS.message} placeholder={t("messagePlaceholder")} /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="contact-trap" />
      {from && <input type="hidden" name="from" value={from} />}
      {state?.error && <p className="err" role="alert">{t(`errors.${state.error}`)}</p>}
      <div className="actions"><button className="btn primary" disabled={pending}>{pending ? t("sending") : t("send")}</button></div>
      {/* Informarea de la colectare (GDPR art. 13): pe unde trece mesajul și cum se poate ocoli. */}
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t.rich("privacyNote", { privacy: (c) => <a href="/confidentialitate">{c}</a> })}</p>
    </form>
  );
}

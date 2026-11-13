"use client";
import { useActionState } from "react";
import { useTranslations } from "use-intl";
import { sendDnaRequest, type DnaResult } from "@/app/resurse-actions";

/** Cererea „Vreau un test ADN”: doar date de contact și un mesaj, cu bifa obligatorie. Fără date genetice sau medicale. */
export default function DnaForm() {
  const t = useTranslations("Resources");
  const [state, action, pending] = useActionState<DnaResult | null, FormData>(sendDnaRequest, null);
  if (state?.ok) return <p className="contact-sent" role="status">{t("ok")}</p>;
  return (
    <form action={action} className="form contact-form dna-form">
      <label>{t("name")}<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>{t("email")}<input name="email" type="email" required maxLength={200} autoComplete="email" inputMode="email" /></label>
      <label>{t("phone")}<input name="phone" type="tel" maxLength={40} autoComplete="tel" inputMode="tel" /></label>
      <label>{t("city")}<input name="city" required maxLength={120} autoComplete="address-level2" /></label>
      <label>{t("message")}<textarea name="message" required rows={5} maxLength={1000} /><small className="muted">{t("messageHint")}</small></label>
      <label className="check"><input type="checkbox" name="consent" required /> {t("consent")}</label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="contact-trap" />
      {state?.error && <p className="err" role="alert">{t(`err.${state.error}`)}</p>}
      <div className="actions"><button className="btn primary" disabled={pending}>{pending ? t("sending") : t("send")}</button></div>
    </form>
  );
}

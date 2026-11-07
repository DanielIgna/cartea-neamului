"use client";
import { useActionState } from "react";
import { useTranslations } from "use-intl";
import { createTree } from "@/app/actions";

/** Arborele făcut în alt program de genealogie, adus întreg dintr-un fișier GEDCOM. Pornirea de la zero e în FamilyStart. */
export default function GedcomImport() {
  const t = useTranslations("GedcomImport");
  const [state, action, pending] = useActionState(createTree, null);
  return (
    <form action={action} className="form">
      <h2 style={{ fontSize: 20 }}>{t("title")}</h2>
      <p className="muted" style={{ margin: 0 }}>{t("text")}</p>
      <label>{t("name")}<input name="name" placeholder={t("namePlaceholder")} required /></label>
      <label>{t("region")}<input name="region" placeholder={t("regionPlaceholder")} /></label>
      <label>{t("file")}<input type="file" name="gedcom" accept=".ged,.gedcom,text/plain" required /></label>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? t("bringing") : t("bring")}</button>
    </form>
  );
}

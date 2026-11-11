"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "use-intl";
import { chooseLanguage } from "@/app/limba-actions";
import { LANGUAGE_NAMES, LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

/**
 * Lista limbilor, sus lângă temă: globul și codul scurt al limbii. Fiecare limbă e scrisă în limba ei, ca omul s-o găsească și dacă nu citește româna.
 * `remember`: limba a venit din cont (aleasă pe alt telefon); o ținem minte și aici, ca să rămână și după ieșirea din cont.
 */
export default function LanguagePicker({ remember = false }: { remember?: boolean }) {
  const t = useTranslations("LanguagePicker");
  const locale = useLocale();
  useEffect(() => {
    if (remember) document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  }, [remember, locale]);
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (l: Locale) => start(async () => {
    const r = await chooseLanguage(l);
    if (r.ok) router.refresh();
  });
  return (
    <label className="lang-pick" title={`${t("label")}: ${LANGUAGE_NAMES[locale as Locale] ?? locale}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
      {/* Se vede doar codul scurt (RO, EN, DE…); lista deschisă arată numele întregi. Lista stă invizibilă peste tot butonul. */}
      <span className="lang-code" aria-hidden="true">{locale.split("-")[0].toUpperCase()}</span>
      <svg className="lang-caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      <select value={locale} aria-label={`${t("label")} (Language)`} disabled={pending} onChange={(e) => choose(e.target.value as Locale)}>
        {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
      </select>
    </label>
  );
}

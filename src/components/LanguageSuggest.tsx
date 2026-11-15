"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseLanguage } from "@/app/limba-actions";
import { dirOf, LANGUAGE_FLAGS, SUGGEST_DISMISSED_COOKIE, localizedPath, splitLocalePath, type Locale } from "@/i18n/locales";
import { isPublicPath } from "@/lib/public-variant";

/**
 * Întrebarea „Citești în …?”, o singură dată, pentru cine are browserul în altă limbă pe care o avem și n-a ales încă nimic.
 * Întrebarea e în limba browserului; „Rămân pe română” e în română. Oricare răspuns se ține minte un an (cookie-ul „limba”).
 * Pe o pagină publică, „Da” duce la adresa paginii în limba aleasă (/it/contact), ca linkul trimis mai departe să fie în ea.
 */
export default function LanguageSuggest({ locale, question, hint, accept, stay, close }: { locale: Locale; question: string; hint: string; accept: string; stay: string; close: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const answer = (l: Locale) => start(async () => {
    const r = await chooseLanguage(l);
    if (!r.ok) return;
    setGone(true);
    const { path } = splitLocalePath(location.pathname);
    if (isPublicPath(path)) location.assign(localizedPath(path, l) + location.search);
    else router.refresh();
  });
  // ✕: întrebarea dispare și nu mai vine înapoi pe acest dispozitiv (un an), fără să schimbe limba.
  const dismiss = () => {
    document.cookie = `${SUGGEST_DISMISSED_COOKIE}=1; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setGone(true);
  };
  return (
    <aside className="lang-suggest" aria-label={question}>
      <button type="button" className="lang-suggest-close" lang={locale} aria-label={close} title={close} onClick={dismiss}>✕</button>
      <p lang={locale} dir={dirOf(locale)}><b>{question}</b> {hint}</p>
      <div className="lang-suggest-actions">
        <button type="button" className="btn primary" lang={locale} disabled={pending} onClick={() => answer(locale)}><span aria-hidden="true">{LANGUAGE_FLAGS[locale]}</span> {accept}</button>
        <button type="button" className="btn" lang="ro" disabled={pending} onClick={() => answer("ro")}>{stay}</button>
      </div>
    </aside>
  );
}

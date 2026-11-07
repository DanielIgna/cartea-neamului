"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseLanguage } from "@/app/limba-actions";
import type { Locale } from "@/i18n/locales";

/**
 * Întrebarea „Citești în …?”, o singură dată, pentru cine are browserul în altă limbă pe care o avem și n-a ales încă nimic.
 * Întrebarea e în limba browserului; „Rămân la română” e în română. Oricare răspuns se ține minte.
 */
export default function LanguageSuggest({ locale, question, hint, accept, stay }: { locale: Locale; question: string; hint: string; accept: string; stay: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const answer = (l: Locale) => start(async () => {
    const r = await chooseLanguage(l);
    if (!r.ok) return;
    setGone(true);
    router.refresh();
  });
  return (
    <aside className="lang-suggest" aria-label={question}>
      <p lang={locale}><b>{question}</b> {hint}</p>
      <div className="lang-suggest-actions">
        <button type="button" className="btn primary" lang={locale} disabled={pending} onClick={() => answer(locale)}>{accept}</button>
        <button type="button" className="btn" lang="ro" disabled={pending} onClick={() => answer("ro")}>{stay}</button>
      </div>
    </aside>
  );
}

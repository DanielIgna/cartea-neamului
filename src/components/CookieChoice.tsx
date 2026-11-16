"use client";
import { useEffect, useState } from "react";
import { saveCookieChoice } from "@/components/CookieNotice";
import { CHOICE_ANALYTICS, CHOICE_COOKIE, readCookie } from "@/lib/sursa-shared";

type Texts = { title: string; now: string; analytics: string; necessary: string; none: string; accept: string; refuse: string; saved: string };

/** Pe pagina Politicii de confidențialitate (#cookie-uri): alegerea de acum pentru cookie-urile de analiză, schimbată dintr-un clic. */
export default function CookieChoice({ t }: { t: Texts }) {
  const [choice, setChoice] = useState<"analiza" | "necesare" | "none" | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const c = readCookie(document.cookie, CHOICE_COOKIE);
    setChoice(c === CHOICE_ANALYTICS ? "analiza" : c ? "necesare" : "none");
  }, []);
  const pick = (analytics: boolean) => { saveCookieChoice(analytics); setChoice(analytics ? "analiza" : "necesare"); setSaved(true); };
  return (
    <div className="cookie-choice" role="group" aria-label={t.title}>
      <b>{t.title}</b>
      <span className="muted">{t.now} {choice === "analiza" ? t.analytics : choice === "necesare" ? t.necessary : choice === "none" ? t.none : "…"}</span>
      <button type="button" className="btn" aria-pressed={choice === "analiza"} onClick={() => pick(true)}>{t.accept}</button>
      <button type="button" className="btn" aria-pressed={choice === "necesare"} onClick={() => pick(false)}>{t.refuse}</button>
      {saved && <span role="status">{t.saved}</span>}
    </div>
  );
}

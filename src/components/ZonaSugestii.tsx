"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { ZoneSuggestion } from "@/lib/zona/registru";

/** Textele blocului, în română și engleză (celelalte limbi primesc engleza, ca paginile de diaspora). */
const TX = {
  ro: { forYou: (p: string) => `Pentru românii din ${p}`, all: (p: string) => `Toată pagina pentru ${p}`, other: "Alt stat sau altă provincie?", guides: "Ghiduri potrivite", lead: "Am pus aici ce se potrivește locului de unde ne citești: istoria românilor de acolo, unde le cauți actele și cum păstrezi poveștile familiei." },
  en: { forYou: (p: string) => `For Romanian families in ${p}`, all: (p: string) => `Everything for ${p}`, other: "Another state or province?", guides: "Guides for you", lead: "Picked for where you are reading from: the story of Romanians there, where to find their records and how to keep your family's stories." },
} as const;

/**
 * Blocul „Pentru românii din zona ta” (Daniel, 18.11.2026): se cere după încărcare de la /api/zona, deci pagina e aceeași
 * pentru toți și pentru Google; blocul apare doar pentru țările din registru (SUA și Canada acum, Europa în curând).
 * Arată statul sau provincia, pagina țării (cu toate statele, pentru cine s-a mutat de curând) și câteva ghiduri.
 */
export default function ZonaSugestii({ locale }: { locale: Locale }) {
  const [s, setS] = useState<ZoneSuggestion | null>(null);
  useEffect(() => {
    let on = true;
    fetch(`/api/zona?l=${encodeURIComponent(locale)}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (on && d) setS(d); }).catch(() => {});
    return () => { on = false; };
  }, [locale]);
  if (!s) return null;
  const t = TX[s.lang];
  const place = s.region?.label ?? s.country.label;
  return (
    <section className="zona-sugestii" aria-labelledby="zona-titlu" lang={s.lang}>
      <h2 id="zona-titlu">{t.forYou(place)}</h2>
      <p className="muted">{t.lead}</p>
      <ul className="zona-linkuri">
        {s.region && <li><Link href={s.region.href}>{t.forYou(s.region.label)}<span aria-hidden="true"> →</span></Link></li>}
        <li><Link href={s.country.href}>{t.all(s.country.label)}<span aria-hidden="true"> →</span></Link></li>
        {s.region && <li><Link href={`${s.country.href}#regiuni`}>{t.other}</Link></li>}
      </ul>
      {s.guides.length > 0 && (
        <>
          <h3>{t.guides}</h3>
          <ul className="zona-ghiduri">{s.guides.map((g) => <li key={g.href}><Link href={g.href}>{g.label}</Link></li>)}</ul>
        </>
      )}
    </section>
  );
}

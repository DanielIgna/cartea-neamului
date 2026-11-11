"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { BIBLE_STEPS, CHURCH_ERAS, END_VERSES, HEROES, INFLUENCE, STEP_QUOTES, WITNESS_QUOTES } from "@/lib/istoria-bisericii";
import { READ_JOHN } from "@/lib/calatorie-popas";
import type { Locale } from "@/i18n/locales";

const KEY = "istoria-bisericii:ro";

/** Istoria Bisericii prigonite: epocile, eroii credinței și Biblia în limba română, cu un filtru „doar la noi”. */
export default function ChurchHistory() {
  const t = useTranslations("Church");
  const locale = useLocale() as Locale;
  // Cheile se compun din id-urile din src/lib/istoria-bisericii.ts; testele verifică să existe în fiecare limbă.
  const tx = t as unknown as (key: string, values?: Record<string, string>) => string;
  const Quote = ({ k }: { k: string }) => (
    <blockquote className="ch-verse"><p>{tx("quoted", { text: tx(`${k}.text`) })}</p><cite>{tx(`${k}.ref`)}</cite></blockquote>
  );
  const [onlyRo, setOnlyRo] = useState(false);
  useEffect(() => {
    try { setOnlyRo(localStorage.getItem(KEY) === "1"); } catch { /* fără stocare: rămâne totul */ }
  }, []);
  const pick = (v: boolean) => {
    setOnlyRo(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* nimic */ }
  };
  const eras = CHURCH_ERAS.map((e) => ({ ...e, witnesses: onlyRo ? e.witnesses.filter((w) => w.ro) : e.witnesses })).filter((e) => e.witnesses.length > 0);

  return (
    <article className="card ch">
      <header className="ch-head">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h2>{t("title")}</h2>
        <p className="ch-lead">{t("intro")}</p>
        <Quote k="promise" />
      </header>

      <nav className="ch-nav" aria-label={t("toc")}>
        {CHURCH_ERAS.map((e) => <a key={e.id} className="chip" href={`#${e.id}`}>{tx(`eras.${e.id}.name`)}</a>)}
        <a className="chip ch-chip-strong" href="#eroi">{t("heroesChip")}</a>
        <a className="chip ch-chip-strong" href="#biblia">{t("bibleChip")}</a>
      </nav>

      <div className="toolbar ch-filter">
        <div className="seg" role="group" aria-label={t("filterLabel")}>
          <button type="button" aria-pressed={!onlyRo} onClick={() => pick(false)}>{t("all")}</button>
          <button type="button" aria-pressed={onlyRo} onClick={() => pick(true)}>{t("onlyRo")}</button>
        </div>
      </div>

      <ol className="ch-eras">
        {eras.map((e) => (
          <li key={e.id} id={e.id} className="ch-era">
            <div className="ch-era-years">{e.from}–{e.id === "azi" ? t("today") : e.to}</div>
            <h3>{tx(`eras.${e.id}.name`)}</h3>
            <p>{tx(`eras.${e.id}.intro`)}</p>
            <Quote k={`eras.${e.id}.verse`} />
            <div className="ch-witnesses">
              {e.witnesses.map((w) => {
                const k = `eras.${e.id}.w.${w.key}`;
                return (
                  <section key={w.key} className={`ch-witness${w.ro ? " ro" : ""}`}>
                    <div className="ch-w-top"><strong>{tx(`${k}.name`)}</strong><span className="muted">{tx(`${k}.years`)}</span></div>
                    <div className="ch-w-place">{tx(`${k}.place`)}{w.ro && <span className="chip ch-ro">{t("ourLand")}</span>}</div>
                    <p>{tx(`${k}.text`)}</p>
                    {WITNESS_QUOTES.has(`${e.id}.${w.key}`) && <p className="ch-w-quote">{tx("quoted", { text: tx(`${k}.quote`) })}</p>}
                  </section>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <section id="eroi" className="ch-part">
        <div className="section-label">{t("heroesLabel")}</div>
        <h3 className="ch-part-title">{t("heroesTitle")}</h3>
        <p>{t("heroesIntro")}</p>
        <div className="ch-heroes">
          {HEROES.map((h) => (
            <details key={h.id} id={h.id} className="ch-hero" open={h.id === "wurmbrand"}>
              <summary>
                <span className="ch-hero-name">{tx(`heroes.${h.id}.name`)}</span> <span className="muted">{tx(`heroes.${h.id}.years`)}</span>
                <span className="ch-hero-who">{tx(`heroes.${h.id}.who`)}</span>
              </summary>
              {Array.from({ length: h.paragraphs }, (_, i) => <p key={i}>{tx(`heroes.${h.id}.story.p${i + 1}`)}</p>)}
              <p className="ch-lesson">{tx(`heroes.${h.id}.lesson`)}</p>
              <Quote k={`heroes.${h.id}.verse`} />
            </details>
          ))}
        </div>
      </section>

      <section id="biblia" className="ch-part">
        <div className="section-label">{t("bibleLabel")}</div>
        <h3 className="ch-part-title">{t("bibleTitle")}</h3>
        <p>{t("bibleIntro")}</p>
        <ol className="ch-bible">
          {BIBLE_STEPS.map((b) => (
            <li key={b}>
              <div className="ch-b-year">{tx(`steps.${b}.year`)}</div>
              <div>
                <strong>{tx(`steps.${b}.title`)}</strong>
                <div className="muted ch-b-who">{tx(`steps.${b}.who`)}</div>
                <p>{tx(`steps.${b}.text`)}</p>
                {STEP_QUOTES.has(b) && <p className="ch-w-quote">{tx("quoted", { text: tx(`steps.${b}.quote`) })}</p>}
              </div>
            </li>
          ))}
        </ol>
        <h4 className="ch-sub">{t("influenceTitle")}</h4>
        <ul className="ch-influence">{INFLUENCE.map((i) => <li key={i}>{tx(`influence.${i}`)}</li>)}</ul>
        <Quote k="bibleVerse" />
      </section>

      <section className="ch-part ch-end">
        <h3 className="ch-part-title">{t("endTitle")}</h3>
        <p>{t("endText")}</p>
        {END_VERSES.map((v) => <Quote key={v} k={`endVerses.${v}`} />)}
        <p><a className="btn primary" href={READ_JOHN[locale] ?? READ_JOHN.ro} target="_blank" rel="noopener noreferrer">{t("readJohn")}</a> <a className="btn" href="/de-la-adam-la-hristos">{t("adamToChrist")}</a></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>{t("note")}</p>
      </section>
    </article>
  );
}

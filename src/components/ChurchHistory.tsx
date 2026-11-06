"use client";

import { useEffect, useState } from "react";
import {
  BIBLE_INFLUENCE, BIBLE_INTRO, BIBLE_STEPS, BIBLE_VERSE, CHURCH_END, CHURCH_ERAS, CHURCH_INTRO, CHURCH_PROMISE, HEROES, HEROES_INTRO,
  type Verse,
} from "@/lib/istoria-bisericii";
import { READ_JOHN } from "@/lib/calatorie-popas";

const KEY = "istoria-bisericii:ro";

function Quote({ v }: { v: Verse }) {
  return <blockquote className="ch-verse"><p>„{v.text}”</p><cite>{v.ref}</cite></blockquote>;
}

/** Istoria Bisericii prigonite: epocile, eroii credinței și Biblia în limba română, cu un filtru „doar la noi”. */
export default function ChurchHistory() {
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
        <div className="section-label" style={{ marginTop: 0 }}>Istoria Bisericii</div>
        <h2>Biserica lui Hristos, prigonită de la început până azi</h2>
        <p className="ch-lead">{CHURCH_INTRO}</p>
        <Quote v={CHURCH_PROMISE} />
      </header>

      <nav className="ch-nav" aria-label="Cuprins">
        {CHURCH_ERAS.map((e) => <a key={e.id} className="chip" href={`#${e.id}`}>{e.name}</a>)}
        <a className="chip ch-chip-strong" href="#eroi">Eroi ai credinței</a>
        <a className="chip ch-chip-strong" href="#biblia">Biblia în limba română</a>
      </nav>

      <div className="toolbar ch-filter">
        <div className="seg" role="group" aria-label="Ce arată">
          <button type="button" aria-pressed={!onlyRo} onClick={() => pick(false)}>Toată lumea</button>
          <button type="button" aria-pressed={onlyRo} onClick={() => pick(true)}>Doar la noi, pe pământ românesc</button>
        </div>
      </div>

      <ol className="ch-eras">
        {eras.map((e) => (
          <li key={e.id} id={e.id} className="ch-era">
            <div className="ch-era-years">{e.from}–{e.id === "azi" ? "azi" : e.to}</div>
            <h3>{e.name}</h3>
            <p>{e.intro}</p>
            <Quote v={e.verse} />
            <div className="ch-witnesses">
              {e.witnesses.map((w) => (
                <section key={w.name} className={`ch-witness${w.ro ? " ro" : ""}`}>
                  <div className="ch-w-top"><strong>{w.name}</strong><span className="muted">{w.years}</span></div>
                  <div className="ch-w-place">{w.place}{w.ro && <span className="chip ch-ro">la noi</span>}</div>
                  <p>{w.text}</p>
                  {w.quote && <p className="ch-w-quote">„{w.quote}”</p>}
                </section>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <section id="eroi" className="ch-part">
        <div className="section-label">Povești care întăresc</div>
        <h3 className="ch-part-title">Eroi ai credinței din închisorile comuniste</h3>
        <p>{HEROES_INTRO}</p>
        <div className="ch-heroes">
          {HEROES.map((h) => (
            <details key={h.id} id={h.id} className="ch-hero" open={h.id === "wurmbrand"}>
              <summary>
                <span className="ch-hero-name">{h.name}</span> <span className="muted">{h.years}</span>
                <span className="ch-hero-who">{h.who}</span>
              </summary>
              {h.story.map((p, i) => <p key={i}>{p}</p>)}
              <p className="ch-lesson">{h.lesson}</p>
              <Quote v={h.verse} />
            </details>
          ))}
        </div>
      </section>

      <section id="biblia" className="ch-part">
        <div className="section-label">Cuvântul în limba noastră</div>
        <h3 className="ch-part-title">Cum a ajuns Biblia în limba română</h3>
        <p>{BIBLE_INTRO}</p>
        <ol className="ch-bible">
          {BIBLE_STEPS.map((b) => (
            <li key={b.title}>
              <div className="ch-b-year">{b.year}</div>
              <div>
                <strong>{b.title}</strong>
                <div className="muted ch-b-who">{b.who}</div>
                <p>{b.text}</p>
                {b.quote && <p className="ch-w-quote">„{b.quote}”</p>}
              </div>
            </li>
          ))}
        </ol>
        <h4 className="ch-sub">Ce a schimbat Biblia în viața românilor</h4>
        <ul className="ch-influence">{BIBLE_INFLUENCE.map((t) => <li key={t}>{t}</li>)}</ul>
        <Quote v={BIBLE_VERSE} />
      </section>

      <section className="ch-part ch-end">
        <h3 className="ch-part-title">Și noi suntem o filă din istoria aceasta</h3>
        <p>Biserica nu e o clădire și nici o instituție, ci toți cei care L-au primit pe Hristos, de la Ștefan până la bunicii care se rugau în ascuns și până la noi.
          Lumina a trecut din mână în mână două mii de ani, adesea cu prețul vieții. Acum e în mâinile noastre: s-o ținem aprinsă, să citim Cuvântul și să ne rugăm pentru cei care sunt prigoniți azi.</p>
        {CHURCH_END.map((v) => <Quote key={v.ref} v={v} />)}
        <p><a className="btn primary" href={READ_JOHN} target="_blank" rel="noopener noreferrer">Citește Evanghelia după Ioan</a></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Versetele sunt din Biblia tradusă de Dumitru Cornilescu. Unde un lucru e doar tradiție, textul o spune.</p>
      </section>
    </article>
  );
}

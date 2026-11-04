"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildGraph, type Rel } from "@/lib/kinship";
import { buildJourney, destinations, pathTo, type PersonStop, type Stop, type Traveller } from "@/lib/calatorie";
import { END_TEXT, REGIME_TEXT } from "@/lib/calatorie-text";
import { ageWords, type Origin } from "@/lib/vremuri";
import { originFor, toneColor, TONE_LABEL } from "./TimesStory";
import type { PersonView } from "@/lib/tree-data";

const FLIGHT_MS = 2200;
const stillScreen = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Stele care stau liniștite la o oprire și se lungesc în dungi cât zboară nava. */
function Stars({ flying }: { flying: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const speed = useRef(0);
  const fly = useRef(flying);
  fly.current = flying;
  useEffect(() => {
    const c = ref.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const stars = Array.from({ length: 170 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), s: 0.4 + Math.random() }));
    const still = stillScreen();
    let raf = 0;
    const size = () => { c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio; };
    size();
    window.addEventListener("resize", size);
    const draw = () => {
      speed.current += ((fly.current && !still ? 1 : 0.02) - speed.current) * 0.05;
      const w = c.width, h = c.height, cx = w / 2, cy = h / 2, R = Math.hypot(cx, cy), v = speed.current;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const r0 = st.r * R, r1 = r0 + 2 * devicePixelRatio + v * 70 * st.r * devicePixelRatio;
        ctx.strokeStyle = `rgba(226,235,255,${0.25 + 0.6 * st.r})`;
        ctx.lineWidth = st.s * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(st.a) * r0, cy + Math.sin(st.a) * r0);
        ctx.lineTo(cx + Math.cos(st.a) * r1, cy + Math.sin(st.a) * r1);
        ctx.stroke();
        if (!still) { st.r += (0.0004 + v * 0.016) * st.s; if (st.r > 1) { st.r = 0.02; st.a = Math.random() * Math.PI * 2; } }
      }
      if (!still || fly.current) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="voy-stars" aria-hidden="true" />;
}

const Ship = ({ flying }: { flying: boolean }) => (
  <svg className={`voy-ship${flying ? " flying" : ""}`} viewBox="0 0 120 160" aria-hidden="true">
    <path className="voy-flame" d="M48 118c2 16 8 30 12 36 4-6 10-20 12-36z" fill="#f2b45a" />
    <path d="M60 4c20 20 28 52 26 96l-52 0C32 56 40 24 60 4z" fill="#dfe7f2" />
    <path d="M34 72 12 112l24-6zM86 72l22 40-24-6z" fill="#b9822a" />
    <circle cx="60" cy="52" r="13" fill="#17345a" stroke="#b9822a" strokeWidth="4" />
    <path d="M36 100h48l-5 16H41z" fill="#8fa3bb" />
  </svg>
);

const yearsOf = (p: Traveller) => `${p.approx ? "cca. " : ""}${p.birthYear ?? "?"}${p.deathYear ? `–${p.deathYear}` : p.living ? "" : "–?"}`;

function PersonPanel({ stop, treeId, answered, onAnswer }: { stop: PersonStop; treeId: string; answered: number | undefined; onAnswer: (i: number) => void }) {
  const { person: p, story, quiz } = stop;
  const known = [p.occupation, p.birthPlace && `născut${p.sex === "F" ? "ă" : ""} la ${p.birthPlace}`, stop.childrenCount ? `${stop.childrenCount === 1 ? "un copil trecut" : `${stop.childrenCount} copii trecuți`} în arbore` : null].filter(Boolean);
  return (
    <>
      <p className="voy-kicker">Anul {stop.estimated ? "cca. " : ""}{stop.year}{story.where ? `, ${story.where}` : ""}</p>
      <h1>{p.name}</h1>
      <p className="voy-muted">{yearsOf(p)}{known.length ? ` · ${known.join(" · ")}` : ""}</p>
      {p.biography
        ? <p>{p.biography.length > 420 ? `${p.biography.slice(0, 420).trim()}…` : p.biography}</p>
        : <p className="voy-muted">Despre {p.givenName} nu e scrisă încă nicio poveste. <Link href={`/arbore/${treeId}?p=${p.id}`}>Deschide-i fișa</Link> și adaugă ce știi, cât mai trăiesc cei care își amintesc.</p>}
      <h2>Lumea în care s-a născut: {story.era.name}</h2>
      <p>{story.life}</p>
      {story.lived.length > 0 && (
        <>
          <h2>Ce a trăit{stop.estimated ? " (după un an socotit)" : ""}</h2>
          <ul className="voy-events">
            {story.lived.slice(0, 6).map(({ event, age, ongoing }) => (
              <li key={`${event.year}${event.text}`}>
                <i style={{ background: toneColor(event.tone) }} title={TONE_LABEL[event.tone]} />
                <span><b>{event.year}{event.to ? `–${event.to}` : ""}</b>, {ageWords(age, p.sex, ongoing)}: {event.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {stop.contemporaries.length > 0 && (
        <>
          <h2>Din neam, în aceiași ani</h2>
          <ul className="voy-people">
            {stop.contemporaries.map((c) => <li key={c.id}><Link href={`/arbore/${treeId}?p=${c.id}`}>{c.name}</Link> <span className="voy-muted">{yearsOf(c)}{c.birthPlace ? `, ${c.birthPlace}` : ""}</span></li>)}
          </ul>
        </>
      )}
      {quiz && (
        <div className="voy-quiz">
          <h2>{quiz.question}</h2>
          {quiz.options.map((o, i) => (
            <button key={o} type="button" disabled={answered !== undefined} onClick={() => onAnswer(i)}
              className={answered === undefined ? "" : i === quiz.answer ? "right" : i === answered ? "wrong" : ""}>{o}</button>
          ))}
          {answered !== undefined && <p role="status">{answered === quiz.answer ? "Corect: ai câștigat o filă de istorie." : "Nu chiar."} S-a întâmplat în {quiz.year}.</p>}
        </div>
      )}
    </>
  );
}

function RegimePanel() {
  return (
    <>
      <p className="voy-kicker">Popas · {REGIME_TEXT.years}</p>
      <h1>{REGIME_TEXT.title}</h1>
      {REGIME_TEXT.paragraphs.map((t) => <p key={t}>{t}</p>)}
      <blockquote>{REGIME_TEXT.verse} <cite>{REGIME_TEXT.verseRef}</cite></blockquote>
      <p className="voy-question">{REGIME_TEXT.question}</p>
    </>
  );
}

function EndPanel({ treeId, pages, total, onAgain }: { treeId: string; pages: number; total: number; onAgain: () => void }) {
  return (
    <>
      <p className="voy-kicker">{END_TEXT.kicker}</p>
      <h1>{END_TEXT.title}</h1>
      <p>{END_TEXT.intro}</p>
      <div className="voy-lines">
        {END_TEXT.lines.map((l) => <a key={l.ref} href={l.href} target="_blank" rel="noopener noreferrer"><b>{l.name}</b><span className="voy-ref">{l.ref} ↗</span><span>{l.text}</span></a>)}
      </div>
      {END_TEXT.paragraphs.map((t) => <p key={t}>{t}</p>)}
      {END_TEXT.verses.map((v) => <blockquote key={v.ref}>{v.text} <cite>{v.ref}</cite></blockquote>)}
      <p className="voy-question">{END_TEXT.question} <cite>{END_TEXT.questionRef}</cite></p>
      <p>{END_TEXT.invite}</p>
      <div className="voy-actions">
        <a className="voy-go" href={END_TEXT.read.href} target="_blank" rel="noopener noreferrer">{END_TEXT.read.label} ↗</a>
        <button type="button" onClick={onAgain}>Altă călătorie</button>
        <Link href={`/arbore/${treeId}`}>Înapoi la arbore</Link>
      </div>
      {total > 0 && <p className="voy-muted">Ai adunat {pages} din {total} file de istorie.</p>}
    </>
  );
}

export default function TimeJourney({ treeId, treeName, centerId, people, rels, origins }: {
  treeId: string; treeName: string; centerId: string; people: Record<string, Traveller>; rels: Rel[]; origins: Record<string, Origin>;
}) {
  const graph = useMemo(() => buildGraph(Object.values(people), rels), [people, rels]);
  const { options, preferred } = useMemo(() => destinations(graph, centerId, people), [graph, centerId, people]);
  const [target, setTarget] = useState(preferred);
  const originOf = (id: string) => originFor(id, graph, origins, people as unknown as Record<string, PersonView>);
  const [stops, setStops] = useState<Stop[] | null>(null);
  const [at, setAt] = useState(0); // stops.length = capătul drumului
  const [flying, setFlying] = useState(false);
  const [shownYear, setShownYear] = useState(new Date().getFullYear());
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const panel = useRef<HTMLElement>(null);
  const timers = useRef<{ raf: number }>({ raf: 0 });
  useEffect(() => () => cancelAnimationFrame(timers.current.raf), []);

  /** Zboară până la oprirea `to`: anii se dau înapoi pe tablou, apoi se deschide povestea. */
  const flyTo = (to: number, list: Stop[], fromYear: number) => {
    const toYear = to < list.length ? list[to].year : 0;
    const arrive = () => { setShownYear(toYear); setAt(to); setFlying(false); requestAnimationFrame(() => { panel.current?.focus(); panel.current?.scrollTo?.(0, 0); }); };
    if (stillScreen()) { arrive(); return; }
    setFlying(true);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / FLIGHT_MS), eased = k * k * (3 - 2 * k);
      setShownYear(Math.round(fromYear + (toYear - fromYear) * eased));
      if (k < 1) timers.current.raf = requestAnimationFrame(step); else arrive();
    };
    timers.current.raf = requestAnimationFrame(step);
  };
  const start = () => {
    if (!target) return;
    const path = pathTo(graph, centerId, target, people) ?? [centerId];
    const list = buildJourney(graph, path, people, originOf);
    setStops(list); setAnswers({}); setAt(0);
    flyTo(0, list, new Date().getFullYear());
  };
  const again = () => { setStops(null); setShownYear(new Date().getFullYear()); };

  const stop = stops && at < stops.length ? stops[at] : null;
  const quizzes = stops?.flatMap((s, i) => (s.kind === "person" && s.quiz ? [[i, s.quiz.answer] as const] : [])) ?? [];
  const pages = quizzes.filter(([i, a]) => answers[i] === a).length;
  const yearLabel = shownYear <= 0 ? "Începuturi" : shownYear;

  return (
    <div className="voyage">
      <Stars flying={flying} />
      <header className="voy-top">
        <Link href={`/arbore/${treeId}?p=${centerId}`}>← Arborele</Link>
        <div className="voy-year" aria-live={flying ? "off" : "polite"}><small>Anul</small>{yearLabel}</div>
        {stops ? <span className="voy-pages">{pages} {pages === 1 ? "filă" : "file"}</span> : <span />}
      </header>
      {stops && (
        <ol className="voy-rail" aria-label="Opririle călătoriei">
          {stops.map((s, i) => (
            <li key={i} className={i === at && !flying ? "here" : i < at ? "done" : ""}>
              <button type="button" disabled={flying || i > at} onClick={() => flyTo(i, stops, shownYear)} title={s.kind === "person" ? s.person.name : REGIME_TEXT.title}>
                <span className="sr">{s.kind === "person" ? s.person.name : REGIME_TEXT.title}</span>
              </button>
            </li>
          ))}
          <li className={at === stops.length && !flying ? "here end" : "end"} aria-label="Capătul drumului" />
        </ol>
      )}
      {!stops && (
        <main className="voy-card voy-start">
          <Ship flying={false} />
          <p className="voy-kicker">{treeName}</p>
          <h1>O călătorie din prezent în trecut</h1>
          <p>Urci în navă și mergi înapoi în timp, din om în om. La fiecare oprire afli ce se știe despre el, în ce lume s-a născut, ce a trăit și cine din neam era pe lume atunci.</p>
          {target ? (
            <>
              <label>Pe urmele cui pornești?
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {options.map(([id, gen]) => <option key={id} value={id}>{people[id].name}{people[id].birthYear ? `, ${people[id].birthYear}` : ""} · {gen === 1 ? "părinte" : gen === 2 ? "bunic" : `${gen} generații în urmă`}</option>)}
                </select>
              </label>
              <button type="button" className="voy-go" onClick={start}>Pornește nava</button>
            </>
          ) : <p className="voy-muted">Încă nu are strămoși în arbore. <Link href={`/arbore/${treeId}?p=${centerId}`}>Adaugă-i părinții</Link> și nava poate pleca.</p>}
        </main>
      )}
      {stops && flying && <div className="voy-flight" role="status"><Ship flying /><p>Mergem înapoi în timp…</p></div>}
      {stops && !flying && (
        <main className="voy-card" ref={panel} tabIndex={-1}>
          {stop?.kind === "person" && <PersonPanel stop={stop} treeId={treeId} answered={answers[at]} onAnswer={(i) => setAnswers((a) => ({ ...a, [at]: i }))} />}
          {stop?.kind === "regime" && <RegimePanel />}
          {!stop && <EndPanel treeId={treeId} pages={pages} total={quizzes.length} onAgain={again} />}
          {stop && <div className="voy-actions"><button type="button" className="voy-go" onClick={() => flyTo(at + 1, stops, stop.year)}>Mai departe în trecut</button></div>}
        </main>
      )}
    </div>
  );
}

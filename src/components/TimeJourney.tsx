"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { buildGraph, type Rel } from "@/lib/kinship";
import { isPlaceholder } from "@/lib/family";
import { lineRoot } from "@/lib/tree-layout";
import { journeyStops, journeyLegs, quizFor, agoWords, yearsWords, type Stop, type Quiz } from "@/lib/calatorie";
import { REGIME_TEXT, READ_JOHN } from "@/lib/calatorie-popas";
import { wordFor } from "@/lib/cuvant-final";
import WordBlocks from "@/components/WordBlocks";
import { lifeDates } from "@/lib/person-text";
import type { PersonView } from "@/lib/tree-data";
import type { Origin } from "@/lib/vremuri";
import { ageWords, eventsFor } from "@/lib/vremuri";
import { setJourneyWord } from "@/app/calatorie-actions";
import { originFor, bornLine, eraYears, toneColor, TONE_LABEL, useTimesWords } from "./TimesStory";
import "./time-journey.css";

type Props = {
  treeId: string; treeName: string; meId: string; centerId: string; people: Record<string, PersonView>; rels: Rel[]; origins: Record<string, Origin>;
  word: string | null; defaultWord: string; isOwner: boolean; demo: boolean;
};

/** Pe ecran: -1 = rampa de plecare (azi), 0…n-1 = opririle, n = dincolo de timp (cuvântul de la final). */
export default function TimeJourney(props: Props) {
  const { treeId, treeName, meId, centerId, people, rels, origins, isOwner, demo } = props;
  const now = new Date().getFullYear();
  const graph = useMemo(() => buildGraph(Object.values(people), rels), [people, rels]);
  const placeholder = useMemo(() => (id: string) => isPlaceholder(people[id]?.givenName ?? ""), [people]);

  // Spițele pornesc de unde le-a ales fiecare în Copac (aceleași alegeri, păstrate în browser), altfel din tată în tată.
  const [picks, setPicks] = useState<{ patRoot: string | null; matRoot: string | null }>({ patRoot: null, matRoot: null });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`spite:${treeId}:${meId}:${centerId}`) ?? "{}") ?? {};
      setPicks({ patRoot: saved.patRoot ?? null, matRoot: saved.matRoot ?? null });
    } catch { /* alegerile implicite */ }
  }, [treeId, meId, centerId]);

  const stops = useMemo(() => journeyStops({
    g: graph, people, ego: centerId, patRoot: picks.patRoot, matRoot: picks.matRoot, placeholder, now,
    origins: (id) => originFor(id, graph, origins, people),
  }), [graph, people, centerId, picks, placeholder, now, origins]);

  // Cuvântul de la final: al proprietarului, cel de bază sau deloc. Se schimbă pe loc după ce proprietarul îl salvează.
  const [stored, setStored] = useState(props.word);
  const word = wordFor(stored, props.defaultWord);
  // Drumul: opririle la oameni și popasul din anii comunismului.
  const legs = useMemo(() => journeyLegs(stops, people, now), [stops, people, now]);
  const last = legs.length; // indexul „dincolo de timp”
  // Jocul: la fiecare oprire, o întrebare; răspunsurile bune adună „file de istorie”.
  const quizzes = useMemo(() => new Map(stops.flatMap((st) => {
    const q = quizFor(st, people[st.id], eventsFor(st.story?.origin ?? null), now);
    return q ? [[st.id, q] as const] : [];
  })), [stops, people, now]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const pages = [...quizzes].filter(([id, q]) => answers[id] === q.answer).length;
  const [idx, setIdx] = useState(-1);
  const ego = people[centerId];

  // Numele spițelor: după numele de naștere al celui mai vechi om de pe fiecare.
  const sur = (id: string) => people[id]?.birthSurname?.trim() || people[id]?.surname || "";
  const top = (line: Stop["line"]) => [...stops].reverse().find((s) => s.line === line)?.id;
  const lineName = (line: Stop["line"]) => {
    const t = top(line);
    const s = t ? sur(t) : "";
    return line === "ego" ? "Azi" : s ? `Spița ${s}` : line === "father" ? "Spița tatălui" : "Spița mamei";
  };
  const oldest = stops.length > 1 ? stops[stops.length - 1] : null;

  // Anul de pe ecranul navei se derulează spre anul opririi; cu „mișcare redusă” sare direct.
  const targetYear = idx < 0 ? now : idx >= last ? null : legs[idx].year;
  const [shown, setShown] = useState<number | null>(now);
  const [warp, setWarp] = useState(false);
  const from = useRef<number>(now);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    const end = targetYear ?? (oldest?.year ?? now) - 120;
    if (reduce || start === end) { setShown(targetYear); from.current = end; setWarp(false); return; }
    const ms = Math.min(2400, 700 + Math.abs(end - start) * 18);
    const t0 = performance.now();
    let raf = 0;
    setWarp(true);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      const y = Math.round(start + (end - start) * e);
      from.current = y;
      setShown(k >= 1 ? targetYear : y);
      if (k < 1) raf = requestAnimationFrame(step);
      else setWarp(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetYear, oldest, now]);

  const max = word ? last : last - 1;
  const go = (i: number) => setIdx(Math.max(-1, Math.min(max, i)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(max, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(-1, i - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [max]);
  const card = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    card.current?.focus({ preventScroll: true });
    document.querySelector(".time-road button.on")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [idx]);

  const leg = idx >= 0 && idx < last ? legs[idx] : null;
  const stop = leg?.kind === "person" ? leg.stop : null;
  const p = stop ? people[stop.id] : null;
  const dest = idx < 0 ? `Azi, ${now}` : stop && p ? `${p.name}${stop.relation ? `, ${stop.relation}` : ""}` : leg ? `Popas: ${REGIME_TEXT.title.toLowerCase()}` : "Dincolo de timp";

  return (
    <div className="journey">
      <div className="card">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="title">Călătoria în timp · {treeName}</div>
          {quizzes.size > 0 && <span className="muted" title="Răspunsurile bune de la opriri">File de istorie: {pages} din {quizzes.size}</span>}
          <Link className="btn" href={`/arbore/${treeId}?p=${centerId}`}>Înapoi la arbore</Link>
        </div>
      </div>

      <div className={`cockpit${warp ? " warp" : ""}`} aria-live="polite">
        <div className="streaks" aria-hidden /><div className="stars s1" aria-hidden /><div className="stars s2" aria-hidden /><div className="stars s3" aria-hidden />
        <Ship />
        <div className="cockpit-screen">
          <div className="cockpit-label">{idx < 0 ? "Pornim din" : idx >= last ? "Destinația" : warp ? "Coborâm prin ani…" : "Am aterizat în"}</div>
          <div className="cockpit-year">{shown === null ? "∞" : shown}</div>
          <div className="cockpit-ago">{shown === null ? "la începutul tuturor neamurilor" : idx < 0 ? "prezentul" : agoWords(shown, now)}</div>
        </div>
        <div className="cockpit-dest">{dest}</div>
      </div>

      <nav className="time-road" aria-label="Opririle călătoriei">
        <button className={idx === -1 ? "on" : ""} onClick={() => go(-1)} title="Azi"><i className="ego" /><span>Azi</span></button>
        {legs.map((l, i) => l.kind === "person" ? (
          <button key={l.stop.id} className={idx === i ? "on" : ""} onClick={() => go(i)} title={`${people[l.stop.id]?.name} · ${l.year}`}>
            <i className={l.stop.line} /><span>{l.stop.estimated ? `cca. ${l.year}` : l.year}</span>
          </button>
        ) : (
          <button key="popas" className={idx === i ? "on" : ""} onClick={() => go(i)} title={`Popas: ${REGIME_TEXT.title}`}>
            <i className="regime" /><span>popas</span>
          </button>
        ))}
        {word && <button className={idx === last ? "on" : ""} onClick={() => go(last)} title="Dincolo de timp"><i className="beyond" /><span>∞</span></button>}
      </nav>

      <div className="journey-nav">
        <button className="btn" onClick={() => go(idx - 1)} disabled={idx < 0}>◀ Spre prezent</button>
        <button className="btn primary" onClick={() => go(idx + 1)} disabled={idx >= max}>
          {idx < 0 ? "Pornește motoarele ▶" : idx === last - 1 && word ? "Dincolo de timp ▶" : "Mai departe în trecut ▶"}
        </button>
      </div>

      <div ref={card} tabIndex={-1} className="journey-card-wrap">
        {idx < 0 && (
          <div className="card journey-card">
            <h2>Nava timpului e gata de plecare</h2>
            {stops.length > 1 && oldest ? (
              <p>
                Pornim din {now}, de la {ego?.givenName || ego?.name}, și coborâm prin ani pe {(["father", "mother"] as const).filter((l) => stops.some((s) => s.line === l)).map((l) => lineName(l).replace(/^Spița/, "spița")).join(" și pe ")},
                până la {people[oldest.id]?.name}, născut{people[oldest.id]?.sex === "F" ? "ă" : ""} {oldest.estimated ? "pe la" : "în"} {oldest.year}. La fiecare oprire afli cine era,
                cum se trăia atunci în ținutul lui, ce a trăit și cine mai era în viață din familie.
              </p>
            ) : (
              <p>Deocamdată nava are o singură oprire. Trece părinții și bunicii lui {ego?.givenName || ego?.name} în arbore, cu anul și locul nașterii, și călătoria va coborî pe urmele lor.</p>
            )}
            <p className="muted" style={{ fontSize: 14 }}>
              Spițele merg din tată în tată, la tată și la mamă (prin tatăl ei), sau de unde le-ai ales tu în Copac. Folosește săgețile ◀ ▶ sau apasă pe anii de mai sus.
            </p>
          </div>
        )}
        {stop && p && <StopCard stop={stop} p={p} people={people} treeId={treeId} lineName={lineName(stop.line)}
          quiz={quizzes.get(stop.id) ?? null} answered={answers[stop.id]} onAnswer={(a) => setAnswers((x) => (stop.id in x ? x : { ...x, [stop.id]: a }))} />}
        {leg?.kind === "regime" && <RegimeCard faith={!!word} />}
        {idx >= last && word && <WordCard text={word} pages={pages} total={quizzes.size} />}
        {!word && idx >= 0 && idx === last - 1 && (
          <div className="card journey-card"><p className="muted" style={{ margin: 0 }}>Aici se oprește ce știm despre neam. Fiecare strămoș trecut în arbore duce nava mai departe în trecut.</p></div>
        )}
        {isOwner && (idx >= last || (!word && idx === last - 1)) && (
          <WordEditor treeId={treeId} stored={stored} defaultWord={props.defaultWord} demo={demo} onSaved={setStored} />
        )}
      </div>
    </div>
  );
}

function StopCard({ stop, p, people, treeId, lineName, quiz, answered, onAnswer }: {
  stop: Stop; p: PersonView; people: Record<string, PersonView>; treeId: string; lineName: string; quiz: Quiz | null; answered: number | undefined; onAnswer: (a: number) => void;
}) {
  const s = stop.story;
  const w = useTimesWords();
  const bio = (p.biography ?? "").trim();
  return (
    <article className={`card journey-card line-${stop.line}`}>
      <div className="stop-head">
        <span className={`line-chip ${stop.line}`}>{lineName}</span>
        {stop.relation && <span className="muted">{stop.relation}{stop.gen > 1 ? ` · ${stop.gen} generații în urmă` : ""}</span>}
      </div>
      <h2>{p.name}</h2>
      <div className="muted" style={{ marginTop: -6 }}>{lifeDates(p) || (stop.estimated ? `născut${p.sex === "F" ? "ă" : ""} pe la ${stop.year}` : "")}{p.occupation ? ` · ${p.occupation}` : ""}</div>
      {s ? (
        <>
          <p className="times-born" style={{ marginTop: 10 }}>
            {stop.estimated ? `Anul nașterii nu e trecut; l-am socotit cam cu o generație înaintea copilului: pe la ${stop.year}` : bornLine(p, s, w.region)}.
            {s.origin?.guess && <span className="muted"> Locul nu e trecut în fișă; l-am luat după {s.origin.guess}.</span>}
          </p>
          {bio && <p className="journey-bio">{bio.length > 600 ? `${bio.slice(0, 600).trimEnd()}…` : bio}</p>}
          <div className="era-chip">{w.era(s.era)} · {eraYears(s)}</div>
          <p className="times-life">{w.life(s)}</p>
          {s.before.length > 0 && (
            <>
              <div className="times-sub">Cu puțin înainte să vină pe lume</div>
              <ul className="times-list">
                {s.before.map((e) => <li key={e.id}><i style={{ background: toneColor(e.tone) }} title={TONE_LABEL[e.tone]} /><b>{e.to ? `${e.year}–${e.to}` : e.year}</b> {w.event(e)}</li>)}
              </ul>
            </>
          )}
          {s.lived.length > 0 && (
            <>
              <div className="times-sub">Cum i-a atins viața istoria</div>
              <ul className="times-list">
                {s.lived.map(({ event: e, age, ongoing }) => (
                  <li key={e.id}>
                    <i style={{ background: toneColor(e.tone) }} title={TONE_LABEL[e.tone]} />
                    <b>{e.to ? `${e.year}–${e.to}` : e.year}</b> <span className="muted">({ageWords(age, p.sex, ongoing)})</span> {w.event(e)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}
      <div className="times-sub">În {stop.year} mai trăiau din familie</div>
      {stop.contemporaries.length ? (
        <ul className="contemporaries">
          {stop.contemporaries.map((c) => (
            <li key={c.id}><b>{people[c.id]?.name}</b> <span className="muted">{c.relation} · {yearsWords(c.age)}</span></li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nu știm încă pe nimeni altcineva din familie care să fi trăit atunci. Frații, bunicii și verii trecuți în arbore, cu anul nașterii, apar aici.</p>
      )}
      {quiz && (
        <div className="journey-quiz">
          <div className="times-sub">Jocul opririi</div>
          <b>{quiz.question}</b>
          <div className="quiz-options">
            {quiz.options.map((o, i) => (
              <button key={o.id} className={`btn${answered === undefined ? "" : i === quiz.answer ? " right" : i === answered ? " wrong" : ""}`}
                disabled={answered !== undefined} onClick={() => onAnswer(i)}>{w.event(o)}</button>
            ))}
          </div>
          {answered !== undefined && <p role="status" style={{ margin: "6px 0 0" }}>{answered === quiz.answer ? "Corect: ai câștigat o filă de istorie." : "Nu chiar."} S-a întâmplat în {quiz.year}.</p>}
        </div>
      )}
      <p style={{ margin: "12px 0 0" }}><Link href={`/arbore/${treeId}/persoana/${p.id}`}>Deschide fișa lui {p.givenName || p.name}</Link></p>
    </article>
  );
}

/** Popasul din anii comunismului: istoria la vedere; versetul și întrebarea doar când cuvântul de credință e arătat. */
function RegimeCard({ faith }: { faith: boolean }) {
  return (
    <article className="card journey-card line-regime">
      <div className="stop-head"><span className="line-chip">Popas · {REGIME_TEXT.years}</span></div>
      <h2>{REGIME_TEXT.title}</h2>
      {REGIME_TEXT.paragraphs.map((t) => <p key={t} className="times-life">{t}</p>)}
      {faith && (
        <>
          <blockquote className="journey-verse"><p>„{REGIME_TEXT.verse}”</p><cite>{REGIME_TEXT.verseRef}</cite></blockquote>
          <p style={{ margin: 0, fontWeight: 600 }}>{REGIME_TEXT.question}</p>
        </>
      )}
    </article>
  );
}

function WordCard({ text, pages, total }: { text: string; pages: number; total: number }) {
  return (
    <article className="card journey-card word">
      {total > 0 && <p className="muted" style={{ marginTop: 0 }}>Ai adunat {pages} din {total} file de istorie pe drum.</p>}
      <WordBlocks text={text} />
      <p><a className="btn primary" href={READ_JOHN} target="_blank" rel="noopener noreferrer">Citește Evanghelia după Ioan</a> <Link className="btn" href="/istoria-bisericii">Istoria Bisericii prigonite</Link></p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Versetele sunt din Biblia tradusă de Dumitru Cornilescu.</p>
    </article>
  );
}

/** Proprietarul păstrează textul de bază, îl scrie cu vorbele lui sau îl ascunde pentru toți cei din arbore. */
function WordEditor({ treeId, stored, defaultWord, demo, onSaved }: { treeId: string; stored: string | null; defaultWord: string; demo: boolean; onSaved: (v: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(stored?.trim() ? stored : defaultWord);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = (mode: "default" | "off" | "custom") => start(async () => {
    const r = await setJourneyWord(treeId, mode, mode === "custom" ? text : "");
    if (r.error) { setMsg(r.error); return; }
    onSaved(mode === "default" ? null : mode === "off" ? "" : text.trim());
    if (mode === "default") setText(defaultWord);
    setMsg(mode === "off" ? "Cuvântul de la final e ascuns pentru toți." : mode === "default" ? "Am pus înapoi textul de bază." : "Am salvat textul tău.");
  });
  const state = stored === null ? "textul de bază" : stored.trim() ? "textul scris de tine" : "ascuns";
  return (
    <div className="card journey-card">
      <div className="toolbar" style={{ marginBottom: open ? 8 : 0 }}>
        <div><b>Cuvântul de la final</b> <span className="muted">· acum: {state}</span></div>
        <button className="btn" onClick={() => setOpen((o) => !o)}>{open ? "Închide" : "Schimbă"}</button>
      </div>
      {open && (
        <>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
            Doar tu, ca proprietar, îl poți schimba; îl văd toți cei din arbore. Un rând care începe cu „## ” e titlu, unul care începe cu „&gt; ” e verset
            (cu trimiterea după „ — ”), iar un rând gol începe un paragraf nou.
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} style={{ width: "100%", fontFamily: "inherit", fontSize: 15 }} disabled={demo || pending} />
          {demo && <p className="muted" style={{ fontSize: 14 }}>În contul de probă cuvântul de la final rămâne cel de bază.</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="btn primary" onClick={() => save("custom")} disabled={demo || pending}>Salvează textul</button>
            <button className="btn" onClick={() => save("default")} disabled={demo || pending || stored === null}>Pune textul de bază</button>
            <button className="btn danger" onClick={() => save("off")} disabled={demo || pending || stored === ""}>Ascunde pentru toți</button>
          </div>
        </>
      )}
      {msg && <p style={{ margin: "8px 0 0" }}>{msg}</p>}
    </div>
  );
}

/** Nava: o capsulă cu hublou, cu flacăra în spate, cu vârful spre stânga (spre trecut). */
function Ship() {
  return (
    <svg className="ship" viewBox="0 0 220 90" aria-hidden>
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f1ea" /><stop offset="1" stopColor="#b9c3cf" /></linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd27a" /><stop offset=".6" stopColor="#ff8a3d" /><stop offset="1" stopColor="#ff8a3d" stopOpacity="0" /></linearGradient>
      </defs>
      <path className="flame" d="M168 34 Q205 45 168 56 Q186 45 168 34Z" fill="url(#flame)" />
      <path d="M150 22 L178 10 L172 30Z" fill="#b9822a" />
      <path d="M150 68 L178 80 L172 60Z" fill="#b9822a" />
      <path d="M20 45 Q40 18 100 20 L160 24 Q172 45 160 66 L100 70 Q40 72 20 45Z" fill="url(#hull)" stroke="#6b7785" strokeWidth="1.5" />
      <circle cx="70" cy="45" r="12" fill="#1f5fa8" stroke="#e0b469" strokeWidth="3" />
      <circle cx="66" cy="41" r="4" fill="#dbe7f5" opacity=".8" />
      <rect x="100" y="38" width="44" height="14" rx="7" fill="#a8322a" opacity=".85" />
    </svg>
  );
}

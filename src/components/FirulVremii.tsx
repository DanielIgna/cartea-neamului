"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ZoomBox from "./ZoomBox";
import { END, LANES, MOMENTS, SPANS, START, packLane, spanText, yearText, type LaneId, type Moment, type Span } from "@/lib/firul-vremii";

const PX = 2.4, PAD = 24, ROW = 26, BAR = 20, HEAD = 22, LANE_GAP = 10, MOM_ROW = 18, LABEL_EVERY = 1100;
const x = (y: number) => PAD + (y - START) * PX;
/** Cât de lat iese un text de 12px, aproximativ (pentru a ști dacă încape într-o bară). */
const textW = (s: string, size = 12) => s.length * size * 0.56;

type Pick = { kind: "span"; s: Span } | { kind: "moment"; m: Moment };

/** Rândurile de pe axă: pentru fiecare rând, sub-rândul fiecărei bare și înălțimea. */
function useLayout() {
  return useMemo(() => {
    // Evenimentele, sus: fiecare etichetă pe primul rând unde nu se lovește de alta.
    const momEnds: number[] = [];
    const momRow = new Map<string, number>();
    for (const m of MOMENTS) {
      const a = x(m.year) - 4, b = x(m.year) + 10 + textW(m.label, 11.5);
      let r = momEnds.findIndex((e) => e + 6 <= a);
      if (r < 0) { r = momEnds.length; momEnds.push(b); } else momEnds[r] = b;
      momRow.set(m.id, r);
    }
    const top = 34, momH = momEnds.length * MOM_ROW + 8;
    let y = top + momH;
    const lanes = LANES.map((l) => {
      const spans = SPANS.filter((s) => s.lane === l.id);
      const { row, rows } = packLane(spans);
      const h = HEAD + rows * ROW + 6;
      const out = { ...l, spans, row, y, h };
      y += h + LANE_GAP;
      return out;
    });
    return { lanes, momRow, top, momH, width: x(END) + PAD + 140, height: y + 10 };
  }, []);
}

function overlapping(a: number, b: number, skip?: string) {
  return SPANS.filter((s) => s.id !== skip && s.from < b && s.to > a);
}

export default function FirulVremii() {
  const L = useLayout();
  const [pick, setPick] = useState<Pick | null>(null);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const laneOf = (id: LaneId) => LANES.find((l) => l.id === id)!;

  /** Mută fereastra desenului ca anul dat să fie la stânga (cu puțin loc înainte). */
  const goTo = (year: number) => {
    const el = box.current, svg = el?.querySelector("svg");
    if (!el || !svg) return;
    const scale = svg.getBoundingClientRect().width / L.width;
    el.scrollTo({ left: Math.max(0, x(year) * scale - 40), behavior: "smooth" });
  };
  // La început desenul pornește din stânga (de la Avraam), nu de la mijloc.
  useEffect(() => {
    const t = setTimeout(() => { if (box.current) box.current.scrollLeft = 0; }, 150);
    return () => clearTimeout(t);
  }, [full]);

  const choose = (p: Pick) => {
    setPick(p);
    requestAnimationFrame(() => card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const range = pick ? (pick.kind === "span" ? [pick.s.from, pick.s.to] : [pick.m.year - 0.5, pick.m.year + 0.5]) : null;
  const sameTime = pick ? overlapping(range![0], range![1], pick.kind === "span" ? pick.s.id : undefined) : [];
  const momentsIn = pick?.kind === "span" ? MOMENTS.filter((m) => m.year >= pick.s.from && m.year <= pick.s.to) : [];
  const selId = pick?.kind === "span" ? pick.s.id : pick?.m.id;

  const ticks: number[] = [];
  for (let y = Math.ceil(START / 100) * 100; y <= END; y += 100) ticks.push(y);

  return (
    <article className="card ch fv">
      <header className="ch-head">
        <div className="section-label" style={{ marginTop: 0 }}>Firul vremii</div>
        <h2>Istoria Bibliei și a lumii, pe aceeași axă</h2>
        <p className="ch-lead">Neamul lui Hristos n-a trăit într-o lume goală. Pe aceeași axă a anilor vezi, una sub alta, viața patriarhilor, împărații lui Iuda și ai lui Israel, proorocii, marile imperii (Egipt, Asiria, Babilon, Persia, Grecia, Roma) și ce se petrecea pe pământul nostru. Atinge orice bară și afli cine mai trăia în același timp.</p>
        <blockquote className="ch-verse"><p>„El schimbă vremurile și împrejurările; El răstoarnă și pune pe împărați”</p><cite>Daniel 2:21</cite></blockquote>
      </header>

      <div className="fv-jump" role="group" aria-label="Sari la">
        <span className="muted">Sari la:</span>
        {[["Avraam", -2166], ["Moise", -1526], ["David", -1040], ["Asiria", -900], ["Robia", -605], ["Perșii", -550], ["Hristos", -120]].map(([label, y]) => (
          <button key={label} type="button" className="chip" onClick={() => goTo(y as number)}>{label}</button>
        ))}
      </div>

      <div className={`card fv-tree${full ? " chart-full" : ""}`}>
        <ZoomBox boxRef={box} resetKey="firul-vremii" full={full} onFull={setFull} startZoom={0.9}>
          <svg viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label="Axa anilor, de la Avraam la Hristos" style={{ width: L.width, maxWidth: "none", display: "block" }} className="fv-svg">
            {L.lanes.map((l) => (
              <rect key={`bg${l.id}`} x={0} y={l.y} width={L.width} height={l.h} className={`fv-lane ${l.group}`} />
            ))}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={22} y2={L.height - 6} className={t % 500 === 0 ? "fv-grid strong" : "fv-grid"} />
                <text x={x(t)} y={16} textAnchor="middle" className={t % 500 === 0 ? "fv-tick strong" : "fv-tick"}>{t === 0 ? "1 d.Hr." : t < 0 ? `${-t} î.Hr.` : `${t} d.Hr.`}</text>
              </g>
            ))}
            {range && <rect x={x(range[0]) - 1} y={22} width={Math.max(3, (range[1] - range[0]) * PX) + 2} height={L.height - 28} className="fv-band" />}

            {MOMENTS.map((m) => {
              const r = L.momRow.get(m.id)!, ty = L.top + r * MOM_ROW + 12, on = selId === m.id;
              return (
                <g key={m.id} className={`fv-moment${on ? " on" : ""}`} role="button" tabIndex={0} aria-label={`${m.label}, ${yearText(m.year, m.approx)}`}
                  onClick={() => choose({ kind: "moment", m })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose({ kind: "moment", m }); } }}>
                  <line x1={x(m.year)} x2={x(m.year)} y1={ty} y2={L.height - 6} className="fv-mline" />
                  <rect x={x(m.year) - 4} y={ty - 9} width={14 + textW(m.label, 11.5)} height={MOM_ROW - 2} className="fv-mhit" />
                  <path d={`M${x(m.year)} ${ty - 7}l5 5-5 5-5-5z`} className="fv-dot" />
                  <text x={x(m.year) + 8} y={ty + 2} className="fv-mlabel">{m.label}</text>
                </g>
              );
            })}

            {L.lanes.map((l) => (
              <g key={l.id}>
                {Array.from({ length: Math.ceil((L.width - PAD) / LABEL_EVERY) }, (_, i) => (
                  <text key={i} x={PAD + i * LABEL_EVERY} y={l.y + 15} className={`fv-lane-label ${l.group}`}>{l.label}</text>
                ))}
                {l.spans.map((s) => {
                  const bx = x(s.from), bw = Math.max(5, (s.to - s.from) * PX), by = l.y + HEAD + l.row.get(s.id)! * ROW;
                  const fits = textW(s.label) + 10 <= bw, on = selId === s.id;
                  return (
                    <g key={s.id} className={`fv-bar ${l.group}${s.approx ? " approx" : ""}${on ? " on" : ""}`} role="button" tabIndex={0}
                      aria-label={`${s.label}, ${spanText(s.from, s.to, s.approx)}`}
                      onClick={() => choose({ kind: "span", s })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose({ kind: "span", s }); } }}>
                      <title>{`${s.label}, ${spanText(s.from, s.to, s.approx)}`}</title>
                      <rect x={bx} y={by} width={bw} height={BAR} rx={5} />
                      {fits && <text x={bx + 6} y={by + 14}>{s.label}</text>}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </ZoomBox>
        {full && pick && <div className="full-sel"><strong>{pick.kind === "span" ? pick.s.label : pick.m.label}</strong> {pick.kind === "span" ? spanText(pick.s.from, pick.s.to, pick.s.approx) : yearText(pick.m.year, pick.m.approx)}</div>}
      </div>

      <ul className="ah-legend fv-legend">
        <li><i className="k fv-k biblia" />Biblia</li>
        <li><i className="k fv-k lumea" />popoarele din jur</li>
        <li><i className="k fv-k noi" />pe pământul nostru</li>
        <li><i className="k fv-k approx" />ani nesiguri</li>
      </ul>

      <div ref={card} className="fv-card-wrap">
        {pick ? (
          <section className="ah-card fv-card" aria-live="polite">
            <div className="ch-w-top">
              <strong>{pick.kind === "span" ? pick.s.label : pick.m.label}</strong>
              <span className="muted">{pick.kind === "span" ? spanText(pick.s.from, pick.s.to, pick.s.approx) : yearText(pick.m.year, pick.m.approx)}</span>
            </div>
            {pick.kind === "span" && <div className="ah-alt">{laneOf(pick.s.lane).label}{pick.s.refs ? ` · ${pick.s.refs}` : ""}</div>}
            {pick.kind === "moment" && pick.m.refs && <div className="ah-alt">{pick.m.refs}</div>}
            {(pick.kind === "span" ? pick.s.note : pick.m.note) && <p>{pick.kind === "span" ? pick.s.note : pick.m.note}</p>}
            {sameTime.length > 0 && (
              <>
                <h4 className="fv-h">În același timp</h4>
                <div className="fv-chips">
                  {sameTime.map((s) => (
                    <button key={s.id} type="button" className={`chip fv-chip ${laneOf(s.lane).group}`} onClick={() => choose({ kind: "span", s })}>
                      {s.label}<span className="muted"> · {laneOf(s.lane).label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {momentsIn.length > 0 && (
              <>
                <h4 className="fv-h">Ce s-a întâmplat atunci</h4>
                <div className="fv-chips">
                  {momentsIn.map((m) => <button key={m.id} type="button" className="chip" onClick={() => choose({ kind: "moment", m })}>{yearText(m.year, m.approx)}: {m.label}</button>)}
                </div>
              </>
            )}
            {pick.kind === "span" && pick.s.person && (
              <p><Link className="btn" href={`/de-la-adam-la-hristos?p=${pick.s.person}`}>Vezi în arborele „De la Adam la Hristos”</Link></p>
            )}
          </section>
        ) : <p className="muted fv-hint">Atinge o bară sau un eveniment de pe axă ca să vezi ce se petrecea în același timp.</p>}
      </div>

      <section className="ch-part">
        <div className="section-label">Cum se citește</div>
        <h3 className="ch-part-title">O axă, mai multe rânduri</h3>
        <p>Anii merg de la stânga la dreapta, de la Avraam (în jurul anului 2000 î.Hr.) până la Domnul Isus. Fiecare rând e o poveste: sus, neamul lui Hristos și poporul lui Israel; la mijloc, popoarele din jur; jos, pământul nostru. Ce stă unul sub altul s-a petrecut în același timp: Daniel slujea la Babilon când în Grecia trăia Solon; Neemia rezidea zidurile Ierusalimului cam pe când la Atena se zidea Partenonul; iar Burebista domnea peste geto-daci pe când Roma se pregătea să devină imperiu, cu puțin înainte de nașterea Domnului.</p>
        <p>Pentru vremea dinainte de Avraam, de la Adam la potop și de la potop la Avraam, Biblia dă doar anii oamenilor, iar textele vechi nu dau aceleași cifre. Le găsești pe pagina <Link href="/de-la-adam-la-hristos">De la Adam la Hristos</Link>, la „Cine cu cine a trăit în același timp”.</p>
        <h4 className="ch-sub">De unde vin anii</h4>
        <ul className="ch-influence">
          <li>Pentru împărații lui Iuda și ai lui Israel folosim cronologia lui Edwin Thiele, pe care o urmează mulți istorici. Ea potrivește anii din Biblie cu listele asiriene, unde o eclipsă din 763 î.Hr. dă un an sigur. Unele domnii se suprapun, pentru că fiul domnea uneori alături de tatăl său.</li>
          <li>Pentru patriarhi și pentru ieșirea din Egipt, luăm literal cifrele din 1 Împărați 6:1 și Exodul 12:40. Mulți istorici pun ieșirea mai târziu, pe la 1260 î.Hr.</li>
          <li>Barele cu margini estompate au anii nesiguri: arată doar vremea, nu anul exact.</li>
        </ul>
      </section>

      <section className="ch-part" id="la-noi">
        <div className="section-label">Pe pământul nostru</div>
        <h3 className="ch-part-title">Cine a trăit aici înainte de daci</h3>
        <p>Pentru vremurile foarte vechi nu avem nume scrise, ci doar ce găsesc arheologii în pământ. Ei numesc fiecare lume după satul unde au dat prima dată de urmele ei. Rândul de jos al axei urmează firul acesta, de la ce e doar săpat în pământ până la oamenii pomeniți în cărți.</p>
        <ol className="fv-steps">
          <li><strong>Primii agricultori: Starčevo-Criș, Hamangia, Cucuteni.</strong> Arheologii găsesc pe pământul nostru sate foarte vechi, cu ceramică pictată (Cucuteni, în Moldova) și statuete ca „Gânditorul de la Hamangia” (Dobrogea). Datările lor, făcute cu carbon radioactiv, merg până înainte de anii pe care îi dă textul ebraic pentru potop. Credincioșii împacă lucrul acesta în feluri diferite, de aceea nu le punem pe aceeași axă cu anii Bibliei.</li>
          <li><strong>Epoca bronzului (c. 2000–1150 î.Hr.).</strong> Cetăți pe dealuri, aur din Munții Apuseni, arme de bronz. E vremea în care Avraam, Isaac și Iacov trăiau în Canaan și Israel era în Egipt.</li>
          <li><strong>Tracii (din c. 1150 î.Hr.).</strong> Odată cu fierul, de la Balcani până la Carpați trăiește un singur mare neam, tracii. E vremea judecătorilor și a lui David.</li>
          <li><strong>Geții și dacii (din c. 650 î.Hr.).</strong> Ramura de la nord de Dunăre a tracilor. Herodot îi pomenește pe geți în 514 î.Hr., cam pe când iudeii terminau al doilea Templu. Grecii își fac colonii pe țărmul Dobrogei: Histria, Tomis, Callatis.</li>
          <li><strong>Statul dac (din 82 î.Hr.).</strong> Burebista îi unește pe geto-daci, cu marele preot Deceneu, cu câteva zeci de ani înainte de nașterea Domnului Isus.</li>
        </ol>
        <p>Poporul român se naște mai târziu, după Hristos, din amestecul dacilor cu romanii, după cucerirea lui Traian din 106. Partea aceasta, cu Apostolul Andrei pe care tradiția îl pomenește în Sciția Mică (Dobrogea), cu primii creștini și martiri de la Dunăre, vine în continuarea axei.</p>
      </section>

      <section className="ch-part ch-end">
        <h3 className="ch-part-title">Și după Hristos?</h3>
        <p>Firul merge mai departe: Biserica pornește de la Ierusalim, ajunge la geto-daci prin Dobrogea și ține până azi. Până când axa aceasta va continua și după Hristos, povestea o găsești în Istoria Bisericii.</p>
        <p><Link className="btn primary" href="/istoria-bisericii">Istoria Bisericii, de la apostoli până azi</Link> <Link className="btn" href="/de-la-adam-la-hristos">Arborii de la Adam la Hristos</Link></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Scris de mână, din Biblie și din istorie. Versetele sunt din traducerea Dumitru Cornilescu. Anii înainte de Hristos sunt aproximativi.</p>
      </section>
    </article>
  );
}

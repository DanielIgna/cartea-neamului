"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ZoomBox from "./ZoomBox";
import { LANES, MOMENTS, SPANS, WINDOWS, packLane, spanText, yearText, type LaneId, type Moment, type Span, type WindowId } from "@/lib/firul-vremii";

const PX = 2.4, PAD = 24, ROW = 26, BAR = 20, HEAD = 22, LANE_GAP = 10, MOM_ROW = 18, LABEL_EVERY = 1100;
const KEY = "firul-vremii:bucata";
/** Cât de lat iese un text de 12px, aproximativ (pentru a ști dacă încape într-o bară). */
const textW = (s: string, size = 12) => s.length * size * 0.56;

type Pick = { kind: "span"; s: Span } | { kind: "moment"; m: Moment };

/** Rândurile de pe axă, pentru bucata aleasă: doar rândurile care au ceva în ea, fiecare cu sub-rândurile și înălțimea lui. */
function useLayout(win: WindowId) {
  return useMemo(() => {
    const W = WINDOWS[win];
    const x = (y: number) => PAD + (y - W.from) * PX;
    const inWin = (a: number, b: number) => a < W.to && b > W.from;
    const moments = MOMENTS.filter((m) => m.year >= W.from && m.year <= W.to);
    // Evenimentele, sus: fiecare etichetă pe primul rând unde nu se lovește de alta.
    const momEnds: number[] = [];
    const momRow = new Map<string, number>();
    for (const m of moments) {
      const a = x(m.year) - 4, b = x(m.year) + 10 + textW(m.label, 11.5);
      let r = momEnds.findIndex((e) => e + 6 <= a);
      if (r < 0) { r = momEnds.length; momEnds.push(b); } else momEnds[r] = b;
      momRow.set(m.id, r);
    }
    const top = 34, momH = momEnds.length * MOM_ROW + 8;
    let y = top + momH;
    const lanes = LANES.map((l) => ({ l, spans: SPANS.filter((s) => s.lane === l.id && inWin(s.from, s.to)) })).filter((v) => v.spans.length > 0 && (!("lanes" in W) || (W.lanes as readonly LaneId[]).includes(v.l.id))).map(({ l, spans }) => {
      const { row, rows } = packLane(spans);
      const h = HEAD + rows * ROW + 6;
      const out = { ...l, spans, row, y, h };
      y += h + LANE_GAP;
      return out;
    });
    return { x, from: W.from, to: W.to, moments, lanes, momRow, top, momH, width: x(W.to) + PAD + 140, height: y + 10 };
  }, [win]);
}

function overlapping(a: number, b: number, skip?: string) {
  return SPANS.filter((s) => s.id !== skip && s.from < b && s.to > a);
}

export default function FirulVremii() {
  const [win, setWin] = useState<WindowId>("inainte");
  const L = useLayout(win);
  const x = L.x;
  useEffect(() => {
    try { const w = localStorage.getItem(KEY); if (w && w in WINDOWS) setWin(w as WindowId); } catch { /* fără stocare */ }
  }, []);
  const pickWin = (w: WindowId) => { setWin(w); setPick(null); try { localStorage.setItem(KEY, w); } catch { /* nimic */ } };
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
  // La început desenul pornește din stânga (de la primele orașe), nu de la mijloc.
  useEffect(() => {
    const t = setTimeout(() => { if (box.current) box.current.scrollLeft = 0; }, 150);
    return () => clearTimeout(t);
  }, [full, win]);

  const choose = (p: Pick) => {
    setPick(p);
    requestAnimationFrame(() => card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const range = pick ? (pick.kind === "span" ? [pick.s.from, pick.s.to] : [pick.m.year - 0.5, pick.m.year + 0.5]) : null;
  const sameTime = pick ? overlapping(range![0], range![1], pick.kind === "span" ? pick.s.id : undefined) : [];
  const momentsIn = pick?.kind === "span" ? L.moments.filter((m) => m.year >= pick.s.from && m.year <= pick.s.to) : [];
  const selId = pick?.kind === "span" ? pick.s.id : pick?.m.id;

  const ticks: number[] = [];
  for (let y = Math.ceil(L.from / 100) * 100; y <= L.to; y += 100) ticks.push(y);

  return (
    <article className="card ch fv">
      <header className="ch-head">
        <h1 className="section-label" style={{ marginTop: 0 }}>Istoria umanității pe o axă</h1>
        <h2>Cinci mii de ani de istorie, pe un singur fir</h2>
        <p className="ch-lead">De la primele orașe și primele scrieri, în Sumer și în Egipt, până la internet. Pe aceeași axă a anilor vezi, una sub alta, marile civilizații ale lumii, de la Mesopotamia și China până la Maya și incași, Israelul vechi și începuturile creștinismului, Europa modernă cu ideile și descoperirile ei și ce se petrecea, în tot acest timp, pe pământul nostru. Atinge orice bară și afli ce mai era în același timp.</p>
      </header>

      <div className="seg fv-win" role="group" aria-label="Ce bucată din axă">
        {(Object.keys(WINDOWS) as WindowId[]).map((w) => (
          <button key={w} type="button" aria-pressed={win === w} onClick={() => pickWin(w)}>{WINDOWS[w].label}</button>
        ))}
      </div>
      <div className="fv-jump" role="group" aria-label="Sari la">
        <span className="muted">Sari la:</span>
        {WINDOWS[win].jumps.map(([label, y]) => (
          <button key={label} type="button" className="chip" onClick={() => goTo(y)}>{label}</button>
        ))}
      </div>

      <div className={`card fv-tree${full ? " chart-full" : ""}`}>
        <ZoomBox boxRef={box} resetKey={`firul-vremii-${win}`} full={full} onFull={setFull} startZoom={0.9}>
          <svg viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label={`Axa anilor: ${WINDOWS[win].label}`} style={{ width: L.width, maxWidth: "none", display: "block" }} className="fv-svg">
            {L.lanes.map((l) => (
              <rect key={`bg${l.id}`} x={0} y={l.y} width={L.width} height={l.h} className={`fv-lane ${l.group}`} />
            ))}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={22} y2={L.height - 6} className={t % 500 === 0 ? "fv-grid strong" : "fv-grid"} />
                <text x={x(t)} y={16} textAnchor="middle" className={t % 500 === 0 ? "fv-tick strong" : "fv-tick"}>{t === 0 ? "anul 1" : t < 0 ? `${-t} î.Hr.` : `${t} d.Hr.`}</text>
              </g>
            ))}
            {range && <rect x={x(range[0]) - 1} y={22} width={Math.max(3, (range[1] - range[0]) * PX) + 2} height={L.height - 28} className="fv-band" />}

            {L.moments.map((m) => {
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
                  const bx = x(Math.max(s.from, L.from)), bw = Math.max(5, (Math.min(s.to, L.to) - Math.max(s.from, L.from)) * PX - 1.5), by = l.y + HEAD + l.row.get(s.id)! * ROW;
                  const fits = textW(s.label) + 10 <= bw, on = selId === s.id;
                  return (
                    <g key={s.id} className={`fv-bar ${l.group}${s.approx ? " approx" : ""}${on ? " on" : ""}`} role="button" tabIndex={0}
                      aria-label={`${s.label}, ${spanText(s.from, s.to, s.approx)}`}
                      onClick={() => choose({ kind: "span", s })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose({ kind: "span", s }); } }}>
                      <title>{`${s.label}, ${spanText(s.from, s.to, s.approx)}`}</title>
                      <rect x={bx} y={by} width={bw} height={BAR} rx={5} />
                      {/* Pe barele lungi, numele se repetă, ca să se vadă oriunde ai derulat. */}
                      {fits && Array.from({ length: Math.max(1, Math.floor((bw - textW(s.label) - 12) / 600) + 1) }, (_, i) => <text key={i} x={bx + 6 + i * 600} y={by + 14}>{s.label}</text>)}
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
        <li><i className="k fv-k lumea" />lumea</li>
        <li><i className="k fv-k biblia" />Israelul vechi și creștinismul</li>
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
            {(pick.kind === "span" ? pick.s.href : pick.m.href) && (
              <p><Link className="btn" href={(pick.kind === "span" ? pick.s.href : pick.m.href)!}>Citește mai mult în „Libertatea de a crede”</Link></p>
            )}
            {pick.kind === "span" && pick.s.person && (
              <p><Link className="btn" href={`/genealogii-vechi?p=${pick.s.person}`}>Vezi în „Genealogii vechi”</Link></p>
            )}
          </section>
        ) : <p className="muted fv-hint">Atinge o bară sau un eveniment de pe axă ca să vezi ce se petrecea în același timp.</p>}
      </div>

      <section className="ch-part">
        <div className="section-label">Cum se citește</div>
        <h3 className="ch-part-title">O axă, mai multe rânduri</h3>
        <p>Anii merg de la stânga la dreapta. Alege mai sus bucata de axă: lumea veche (de la primele orașe, pe la 3500 î.Hr., până la anul 1), de la anul 1 până azi sau toată istoria. Fiecare rând e o poveste: sus, marile civilizații ale lumii; la mijloc, Israelul vechi și creștinismul; jos, pământul nostru. Ce stă unul sub altul s-a petrecut în același timp: piramidele Egiptului erau deja vechi când Hamurabi își scria legile; Buddha, Confucius și primii filozofi greci au trăit în același veac; Burebista îi unea pe geto-daci pe când Iulius Cezar cucerea Galia; iar Ștefan cel Mare domnea în Moldova când Columb ajungea în America.</p>
        <p>Pentru vremea dinainte de Avraam, cronologia biblică dă doar anii oamenilor, iar textele vechi nu dau aceleași cifre. Îi găsești pe pagina <Link href="/genealogii-vechi">Genealogii vechi</Link>, la „Cine cu cine a trăit în același timp”.</p>
        <h4 className="ch-sub">De unde vin anii</h4>
        <ul className="ch-influence">
          <li>Pentru civilizațiile foarte vechi, anii vin din arheologie (straturi, datări cu carbon radioactiv, liste de regi) și sunt aproximativi; pe măsură ce ne apropiem de noi, devin siguri.</li>
          <li>Pentru regii lui Iuda și ai lui Israel folosim cronologia lui Edwin Thiele, pe care o urmează mulți istorici. Ea potrivește anii din Biblie cu listele asiriene, unde o eclipsă din 763 î.Hr. dă un an sigur. Unele domnii se suprapun, pentru că fiul domnea uneori alături de tatăl său.</li>
          <li>Pentru Avraam, Moise și ieșirea din Egipt, singurul izvor e relatarea biblică. Rândul lor arată anii care ies dacă iei literal cifrele din 1 Împărați 6:1 și Exodul 12:40; mulți istorici pun ieșirea mai târziu, pe la 1260 î.Hr., iar alții cred că aceste vremuri nu se pot data.</li>
          <li>Barele cu margini estompate au anii nesiguri: arată doar vremea, nu anul exact.</li>
        </ul>
      </section>

      <section className="ch-part" id="la-noi">
        <div className="section-label">Pe pământul nostru</div>
        <h3 className="ch-part-title">Cine a trăit aici înainte de daci</h3>
        <p>Pentru vremurile foarte vechi nu avem nume scrise, ci doar ce găsesc arheologii în pământ. Ei numesc fiecare lume după satul unde au dat prima dată de urmele ei. Rândul de jos al axei urmează firul acesta, de la ce e doar săpat în pământ până la oamenii pomeniți în cărți.</p>
        <ol className="fv-steps">
          <li><strong>Primii agricultori: Starčevo-Criș, Hamangia, Cucuteni (c. 6000–3000 î.Hr.).</strong> Arheologii găsesc pe pământul nostru sate foarte vechi, cu ceramică pictată (Cucuteni, în Moldova) și statuete ca „Gânditorul de la Hamangia” (Dobrogea). Sfârșitul culturii Cucuteni e chiar la începutul axei.</li>
          <li><strong>Epoca bronzului (c. 2000–1150 î.Hr.).</strong> Cetăți pe dealuri, aur din Munții Apuseni, arme de bronz. E vremea Babilonului lui Hamurabi și a Cretei minoice.</li>
          <li><strong>Tracii (din c. 1150 î.Hr.).</strong> Odată cu fierul, de la Balcani până la Carpați trăiește un singur mare neam, tracii. E vremea în care cade Troia și se naște alfabetul fenician.</li>
          <li><strong>Geții și dacii (din c. 650 î.Hr.).</strong> Ramura de la nord de Dunăre a tracilor. Herodot îi pomenește pe geți în 514 î.Hr., cam pe când la Atena se năștea democrația. Grecii își fac colonii pe țărmul Dobrogei: Histria, Tomis, Callatis.</li>
          <li><strong>Statul dac (din 82 î.Hr.).</strong> Burebista îi unește pe geto-daci, cu marele preot Deceneu, în aceeași vreme cu Iulius Cezar.</li>
        </ol>
        <p>Poporul român se naște mai târziu, din amestecul dacilor cu romanii, după cucerirea lui Traian din 106. Partea aceasta e pe axă la „De la anul 1 până azi”.</p>
      </section>

      <section className="ch-part" id="credinta">
        <div className="section-label">De la anul 1</div>
        <h3 className="ch-part-title">Cum a ajuns creștinismul pe pământul nostru</h3>
        <p>Dintre toate firele axei, unul a schimbat felul în care numără lumea anii: viața lui Isus din Nazaret. Iată, pe scurt, cum a ajuns creștinismul până la noi, după izvoarele istorice și după tradiție, acolo unde textul o spune.</p>
        <ol className="fv-steps">
          <li><strong>Ierusalim, pe la anul 30.</strong> Isus este răstignit sub Ponțiu Pilat, iar ucenicii lui vestesc curând că a înviat. Prima comunitate creștină se formează la Ierusalim. Prigonirile îi risipesc pe credincioși, iar ei duc învățătura mai departe: Pavel în Asia Mică, Grecia și Roma, ceilalți apostoli în alte părți.</li>
          <li><strong>La gurile Dunării, în secolul I.</strong> Tradiția păstrată de Eusebiu spune că apostolului Andrei i-a revenit Sciția; mulți o leagă de Dobrogea. Nu putem dovedi lucrul acesta, dar Dobrogea era deja romană și legată de tot imperiul, iar creștinismul a ajuns aici foarte devreme.</li>
          <li><strong>Daco-romanii (secolele II–IV).</strong> După cucerirea lui Traian (106), soldații, negustorii și coloniștii aduc noua credință și la nord de Dunăre. Românii n-au avut un „botez” la o anumită dată, ca alte popoare; s-au făcut creștini odată cu nașterea lor ca popor. Mărturie stau cuvintele de bază, care sunt latinești: Dumnezeu, cruce, biserică, creștin, a boteza, Paște, rugăciune, sfânt.</li>
          <li><strong>Martiri și episcopi (secolele III–VI).</strong> În Dobrogea au fost uciși pentru credința lor Epictet și Astion la Halmyris și cei patru ale căror nume s-au găsit în cripta de la Niculițel. La Tomis apar episcopi, iar din Sciția Mică vine Dionisie cel Mic, cel care a dat lumii numărătoarea anilor folosită azi. În Ardeal, donariul de la Biertan arată creștini și după plecarea romanilor.</li>
          <li><strong>Slavona, apoi limba română (secolele X–XVII).</strong> Multă vreme slujba s-a ținut într-o limbă pe care poporul n-o înțelegea. Coresi, Noul Testament de la Bălgrad (1648) și Biblia de la București (1688) au fost printre primele cărți mari în românește și au ajutat la nașterea limbii române literare.</li>
          <li><strong>Prigoană și libertate (secolul XX).</strong> Sub comuniști, credincioșii de toate confesiunile au plătit cu închisoarea, iar după 1989 a venit libertatea.</li>
        </ol>
        <p>Povestea lor, cu oamenii fiecărei epoci, o găsești pe larg în <Link href="/libertatea-de-a-crede">Libertatea de a crede</Link>.</p>
      </section>

      <section className="ch-part ch-end">
        <h3 className="ch-part-title">Și familia ta e pe firul acesta</h3>
        <p>Fiecare bunic și străbunic din arborele tău a trăit undeva pe axa aceasta, sub unele dintre stăpânirile de aici, cu războaiele, foametea, descoperirile și speranțele vremii lui. Istoria mare e făcută din milioane de istorii mici, ca a lor.</p>
        <blockquote className="ch-verse"><p>„Învață-ne să ne numărăm bine zilele, ca să căpătăm o inimă înțeleaptă!”</p><cite>Psalmul 90:12</cite></blockquote>
        <p><Link className="btn primary" href="/genealogii-vechi">Genealogii vechi</Link> <Link className="btn" href="/libertatea-de-a-crede">Libertatea de a crede</Link></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Scris de mână, din izvoare istorice și arheologice, iar pentru Israelul vechi și din relatarea biblică, spusă ca atare. Anii foarte vechi sunt aproximativi; unde un lucru e doar tradiție, textul o spune.</p>
      </section>
    </article>
  );
}

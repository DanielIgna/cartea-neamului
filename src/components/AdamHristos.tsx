"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ZoomBox from "./ZoomBox";
import { EPOCHS, FLOOD_AM, VERSIONS, chainYears, fold, indexAll, subLine, years, type BNode, type Epoch } from "@/lib/adam-hristos";

const KEY = "adam-hristos:arbore";
const NW = 128, NH = 62, GX = 12, GY = 34, PAD = 16;

/** Câteva noduri apar în doi arbori (Noe, Sem, Terah, Iacov, Iosif): le legăm de rândul lor din linia anilor. */
const ALIASES: Record<string, string> = { "sem-0": "sem", "noe-2": "noe", "terah-2": "terah", "iacov-4": "iacov", "iosif-4": "iosif-eg" };

type Placed = { n: BNode; x: number; y: number; depth: number; parent?: Placed };

/**
 * Așază un arbore de sus în jos: fiecare frunză își ia locul ei pe orizontală, părintele stă la mijlocul copiilor.
 * Legăturile în plus (Eli → Iosif) coboară ținta sub sursă, ca cele două linii să se întâlnească în aceeași persoană.
 */
export function layoutEpoch(e: Epoch) {
  const placed = new Map<string, Placed>();
  let slot = 0;
  const place = (n: BNode, depth: number, parent?: Placed): Placed => {
    const p: Placed = { n, x: 0, y: 0, depth, parent };
    placed.set(n.id, p);
    const kids = (n.kids ?? []).map((k) => place(k, depth + 1, p));
    p.x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : PAD + slot++ * (NW + GX) + NW / 2;
    return p;
  };
  e.roots.forEach((r) => place(r, 0));
  for (const [from, to] of e.links ?? []) {
    const a = placed.get(from), b = placed.get(to);
    if (!a || !b) continue;
    const shift = a.depth + 1 - b.depth;
    if (shift <= 0) continue;
    const push = (n: BNode) => { const p = placed.get(n.id)!; p.depth += shift; (n.kids ?? []).forEach(push); };
    push(b.n);
  }
  let maxDepth = 0;
  for (const p of placed.values()) { p.y = PAD + p.depth * (NH + GY); maxDepth = Math.max(maxDepth, p.depth); }
  return { placed, width: PAD * 2 + slot * (NW + GX) - GX, height: PAD * 2 + (maxDepth + 1) * (NH + GY) - GY };
}

function nodeClass(n: BNode, sel: boolean) {
  return ["ah-node", n.main && "main", n.luke && "luke", n.woman && "woman", n.omitted && "omitted", n.gap && "gap", sel && "sel"].filter(Boolean).join(" ");
}

function EpochTree({ epoch, selected, onSelect }: { epoch: Epoch; selected: string | null; onSelect: (id: string) => void }) {
  const { placed, width, height } = useMemo(() => layoutEpoch(epoch), [epoch]);
  const all = [...placed.values()];
  const short = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Arborele: ${epoch.title}`} style={{ width, maxWidth: "none", display: "block" }} className="ah-svg">
      {all.filter((p) => p.parent).map((p) => {
        const a = p.parent!, my = p.y - GY / 2;
        const cls = p.n.omitted ? "ah-edge omitted" : p.n.main && a.n.main ? "ah-edge main" : p.n.luke ? "ah-edge luke" : "ah-edge";
        return <path key={`e${p.n.id}`} className={cls} d={`M${a.x} ${a.y + NH}V${my}H${p.x}V${p.y}`} />;
      })}
      {(epoch.links ?? []).map(([from, to]) => {
        const a = placed.get(from), b = placed.get(to);
        if (!a || !b) return null;
        const y = b.y - GY / 2;
        return (
          <g key={`l${from}-${to}`}>
            <path className="ah-edge link" d={`M${a.x} ${a.y + NH}V${y}H${b.x}V${b.y}`} />
            <text className="ah-link-label" x={(a.x + b.x) / 2} y={y - 5} textAnchor="middle">Luca 3:23</text>
          </g>
        );
      })}
      {all.map(({ n, x, y }) => {
        const sub = subLine(n);
        return (
          <g key={n.id} data-id={n.id} className={nodeClass(n, selected === n.id)} tabIndex={0} role="button" aria-label={n.name}
            onClick={() => onSelect(n.id)} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(n.id); } }}>
            <rect x={x - NW / 2} y={y} width={NW} height={NH} rx={10} />
            <text className="ah-name" x={x} y={y + (n.wife ? 21 : 26)} textAnchor="middle">{short(n.name, 16)}</text>
            {sub && <text className="ah-sub" x={x} y={y + (n.wife ? 37 : 44)} textAnchor="middle">{short(sub, 22)}</text>}
            {n.wife && <text className="ah-wife" x={x} y={y + 53} textAnchor="middle">{short(`+ ${n.wife}`, 22)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Viețile de la Adam la Iosif, una lângă alta, pe anii de la facerea lumii (textul ebraic). */
function Lifespans({ pick, onPick }: { pick: string | null; onPick: (id: string | null) => void }) {
  const rows = useMemo(() => chainYears(), []);
  // Pe telefon desenul e mai îngust (încape pe ecran fără derulare), cu mai puține repere și fără anii scriși lângă bare.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  const max = 2500, L = narrow ? 84 : 96, W = narrow ? 400 : 860, RH = 24, top = 26, step = narrow ? 500 : 200;
  const sx = (y: number) => L + ((W - L - 10) * y) / max;
  const H = top + rows.length * RH + 10;
  const chosen = rows.find((r) => r.id === pick);
  const overlap = chosen ? rows.filter((r) => r.id !== chosen.id && r.born < chosen.died && r.died > chosen.born) : [];
  return (
    <>
      <div className="ah-life-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="ah-life" role="img" aria-label="Anii de viață ai patriarhilor de la Adam la Iosif">
          {Array.from({ length: max / step + 1 }, (_, i) => i * step).map((y) => (
            <g key={y}>
              <line x1={sx(y)} x2={sx(y)} y1={top - 6} y2={H - 6} className="ah-grid" />
              <text x={sx(y)} y={top - 10} textAnchor="middle" className="ah-tick">{y}</text>
            </g>
          ))}
          <line x1={sx(FLOOD_AM)} x2={sx(FLOOD_AM)} y1={top - 6} y2={H - 6} className="ah-flood" />
          <text x={sx(FLOOD_AM) - 4} y={H - 10} textAnchor="end" className="ah-flood-label">potopul ({FLOOD_AM})</text>
          {rows.map((r, i) => {
            const y = top + i * RH, on = pick === r.id, near = overlap.some((o) => o.id === r.id);
            return (
              <g key={r.id} className={`ah-bar${on ? " on" : ""}${near ? " near" : ""}${pick && !on && !near ? " dim" : ""}`} role="button" tabIndex={0}
                aria-label={`${r.name}: ${r.born}–${r.died}`} onClick={() => onPick(on ? null : r.id)}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onPick(on ? null : r.id); } }}>
                <rect x={0} y={y} width={W} height={RH} className="ah-bar-hit" />
                <text x={L - 8} y={y + 16} textAnchor="end" className="ah-bar-name">{r.name}</text>
                <rect x={sx(r.born)} y={y + 5} width={Math.max(2, sx(r.died) - sx(r.born))} height={RH - 10} rx={4} className="ah-bar-fill" />
                {!narrow && <text x={sx(r.died) + 5} y={y + 16} className="ah-bar-years">{r.born}–{r.died}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="ah-life-note" aria-live="polite">
        {chosen
          ? <><strong>{chosen.name}</strong> s-a născut în anul {chosen.born} și a murit în anul {chosen.died} de la facerea lumii ({years(chosen.life)}). A trăit în același timp cu: {overlap.map((o) => o.name).join(", ")}.</>
          : "Atinge un nume ca să vezi cu cine a trăit în același timp."}
      </p>
    </>
  );
}

/** „Genealogii vechi” (fosta „De la Adam la Hristos”): genealogia lui Isus după textele biblice, în șase arbori, cu anii și locurile unde socotelile diferă. */
export default function AdamHristos() {
  const index = useMemo(() => indexAll(), []);
  const years0 = useMemo(() => new Map(chainYears().map((r) => [r.id, r])), []);
  const [epochId, setEpochId] = useState(EPOCHS[0].id);
  const [sel, setSel] = useState<string | null>(EPOCHS[0].roots[0].id);
  const [full, setFull] = useState(false);
  const [q, setQ] = useState("");
  const [lifePick, setLifePick] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const treeTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Din „Firul vremii” se poate veni direct la o persoană: ?p=<id>.
    const wanted = new URLSearchParams(window.location.search).get("p");
    const hit = wanted ? index.get(wanted) : undefined;
    if (hit) {
      setEpochId(hit.epoch);
      setSel(hit.node.id);
      reveal(hit.node.id, 600);
      setTimeout(() => box.current?.scrollIntoView({ block: "start" }), 650);
      return;
    }
    try {
      const saved = localStorage.getItem(KEY);
      const e = EPOCHS.find((x) => x.id === saved);
      if (e) { setEpochId(e.id); setSel(e.roots[e.roots.length - 1].id); }
    } catch { /* fără stocare: primul arbore */ }
  }, []);

  const epoch = EPOCHS.find((e) => e.id === epochId) ?? EPOCHS[0];
  const at = EPOCHS.indexOf(epoch);
  const openEpoch = (id: string, select?: string, scroll = false) => {
    const e = EPOCHS.find((x) => x.id === id);
    if (!e) return;
    setEpochId(id);
    setSel(select ?? e.roots[e.roots.length - 1].id);
    try { localStorage.setItem(KEY, id); } catch { /* nimic */ }
    if (scroll) treeTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  /** După o căutare, aducem persoana în mijlocul ferestrei desenului. */
  function reveal(id: string, wait = 250) { return setTimeout(() => {
    const el = box.current, g = el?.querySelector(`[data-id="${id}"]`);
    if (!el || !g) return;
    const r = g.getBoundingClientRect(), b = el.getBoundingClientRect();
    el.scrollLeft += r.left + r.width / 2 - (b.left + el.clientWidth / 2);
    el.scrollTop += r.top + r.height / 2 - (b.top + el.clientHeight / 2);
  }, wait); }

  // Pe un ecran îngust, desenul pornește cu linia lui Hristos la mijloc (nu cu mijlocul desenului, unde poate fi o ramură laterală).
  useEffect(() => {
    const root = epoch.roots[epoch.roots.length - 1];
    const target = root.kids?.find((k) => k.main) ?? root;
    const t = setTimeout(() => {
      const el = box.current, g = el?.querySelector(`[data-id="${target.id}"]`);
      if (!el || !g || el.scrollWidth <= el.clientWidth) return;
      const r = g.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.scrollLeft += r.left + r.width / 2 - (b.left + el.clientWidth / 2);
    }, 120);
    return () => clearTimeout(t);
  }, [epoch, full]);

  const hits = useMemo(() => {
    const s = fold(q.trim());
    if (s.length < 2) return [];
    return [...index.values()].flatMap((v) => {
      const { node } = v;
      if (node.gap) return [];
      if (fold(node.name).includes(s) || (node.alt && fold(node.alt).includes(s))) return [{ ...v, wifeOf: undefined as string | undefined }];
      // Soțiile (Eva, Sara, Rut, Rahav, Maria…) stau lângă soțul lor: le găsim prin el.
      if (node.wife && fold(node.wife).includes(s)) return [{ ...v, wifeOf: node.wife }];
      return [];
    }).slice(0, 12);
  }, [q, index]);

  const cur = sel ? index.get(sel) : undefined;
  const node = cur && cur.epoch === epoch.id ? cur.node : undefined;
  const life = node ? years0.get(ALIASES[node.id] ?? node.id) : undefined;
  /** Unde mai apare aceeași persoană (Noe, Sem, Terah, Iacov, Iosif, David, Iehonia, Neri). */
  const same = (id: string) => ALIASES[id] ?? id.replace(/-\d$/, "");
  const elsewhere = node ? [...index.values()].filter((v) => v.epoch !== epoch.id && same(v.node.id) === same(node.id)) : [];

  return (
    <article className="card ch ah">
      <header className="ch-head">
        <div className="section-label" style={{ marginTop: 0 }}>Genealogii vechi</div>
        <h2>O genealogie de patru mii de ani</h2>
        <p className="ch-lead">Puține popoare și-au păstrat strămoșii în scris atât de departe în urmă ca evreii. Textele biblice dau o genealogie neîntreruptă, de la Adam, primul om din relatarea Genezei, prin Noe, Avraam și regele David, până la Isus din Nazaret. Aici o găsești în șase arbori, unul după altul, cu anii de viață pe care îi dau textele, cu ramurile laterale (Cain, fiii lui Noe, cele 12 seminții, Moise și Aaron) și cu cele două liste din Evanghelii: a lui Matei, prin Solomon, și a lui Luca, prin Natan.</p>
        <blockquote className="ch-verse"><p>„Cartea neamului lui Isus Hristos, fiul lui David, fiul lui Avraam.”</p><cite>Matei 1:1</cite></blockquote>
      </header>

      <div ref={treeTop} className="ah-tabs" role="tablist" aria-label="Arborii">
        {EPOCHS.map((e, i) => (
          <button key={e.id} type="button" role="tab" aria-selected={e.id === epoch.id} className={`ah-tab${e.id === epoch.id ? " on" : ""}`} onClick={() => openEpoch(e.id)}>
            <span className="ah-tab-n">{i + 1}</span>{e.title}
          </button>
        ))}
      </div>

      <div className="ah-search">
        <input type="search" aria-label="Caută un nume" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Caută un nume: Rut, Enoh, Zorobabel…" />
        {hits.length > 0 && (
          <div className="ah-hits">
            {hits.map(({ node: n, epoch: eid, parent, wifeOf }) => (
              <button key={n.id} type="button" className="chip" onClick={() => { openEpoch(eid, n.id); setQ(""); reveal(n.id); }}>
                {wifeOf ? <>{wifeOf}<span className="muted"> · lângă {n.name}</span></> : <>{n.name}{parent ? <span className="muted"> · {n.woman ? "fiica" : "fiul"} lui {parent.name}</span> : null}</>}
              </button>
            ))}
          </div>
        )}
        {q.trim().length >= 2 && hits.length === 0 && <p className="muted ah-none">Nu am găsit numele acesta în arbori.</p>}
      </div>

      <section className="ah-epoch">
        <div className="ch-era-years">{epoch.span}</div>
        <h3 className="ch-part-title">{at + 1}. {epoch.title}</h3>
        <p>{epoch.intro}</p>
        <ul className="ah-legend" aria-label="Ce înseamnă culorile">
          <li><i className="k main" />linia lui Isus{epoch.roots.some((r) => JSON.stringify(r).includes("\"luke\":true")) ? " după Matei" : ""}</li>
          {JSON.stringify(epoch.roots).includes("\"luke\":true") && <li><i className="k luke" />linia după Luca</li>}
          {JSON.stringify(epoch.roots).includes("\"omitted\":true") && <li><i className="k omitted" />împărați pe care Matei nu-i numește</li>}
          <li><i className="k side" />ramuri laterale</li>
        </ul>
      </section>

      <div className={`card ah-tree${full ? " chart-full" : ""}`}>
        <ZoomBox boxRef={box} resetKey={epoch.id} full={full} onFull={setFull}>
          <EpochTree epoch={epoch} selected={sel} onSelect={setSel} />
        </ZoomBox>
        {full && node && <div className="full-sel"><strong>{node.name}</strong> {subLine(node)}</div>}
      </div>

      {node && (
        <section className="ah-card" aria-live="polite">
          <div className="ch-w-top"><strong>{node.name}</strong><span className="muted">{node.refs}</span></div>
          {node.alt && <div className="ah-alt">Numit și: {node.alt}</div>}
          <ul className="ah-facts">
            {node.wife && <li>{node.woman ? "Soțul" : "Soția"}: {node.wife}</li>}
            {node.life && <li>A trăit {years(node.life)}.</li>}
            {node.reign && <li>A domnit {node.reign}{node.when ? ` (${node.when})` : ""}.</li>}
            {!node.reign && node.when && <li>{node.when}</li>}
            {life && <li>După anii din textul ebraic: născut în anul {life.born}, mort în anul {life.died} de la facerea lumii.</li>}
            {cur?.parent && <li>Părintele: <button type="button" className="ah-link" onClick={() => setSel(cur.parent!.id)}>{cur.parent.name}</button></li>}
            {node.kids && node.kids.length > 0 && (
              <li>Copii în arbore: {node.kids.map((k, i) => <span key={k.id}>{i > 0 && ", "}<button type="button" className="ah-link" onClick={() => setSel(k.id)}>{k.name}</button></span>)}</li>
            )}
          </ul>
          {node.note && <p>{node.note}</p>}
          {elsewhere.length > 0 && (
            <p className="ah-more">
              {elsewhere.map((v) => {
                const e = EPOCHS.find((x) => x.id === v.epoch)!;
                return <button key={v.node.id} type="button" className="btn" onClick={() => openEpoch(e.id, v.node.id, true)}>Vezi pe {v.node.name} în „{e.title}”</button>;
              })}
            </p>
          )}
        </section>
      )}

      <nav className="ah-step">
        {at > 0 && <button type="button" className="btn" onClick={() => openEpoch(EPOCHS[at - 1].id, undefined, true)}>← {EPOCHS[at - 1].title}</button>}
        {at < EPOCHS.length - 1 && <button type="button" className="btn primary" onClick={() => openEpoch(EPOCHS[at + 1].id, EPOCHS[at + 1].roots[EPOCHS[at + 1].roots.length - 1].id, true)}>{EPOCHS[at + 1].title} →</button>}
      </nav>

      <section className="ch-part">
        <div className="section-label">Pe scara timpului</div>
        <h3 className="ch-part-title">Cine cu cine a trăit în același timp</h3>
        <p>Dacă aduni anii din Geneza 5 și 11 (câți ani avea fiecare tată la nașterea fiului), afli în ce an „de la facerea lumii” s-a născut fiecare. Așezate una lângă alta, viețile lungi se suprapun în chip neașteptat: Adam a trăit până când Lameh, tatăl lui Noe, avea 56 de ani; Metusala a murit în anul potopului; iar Sem a trăit mai mult decât Avraam. Socoteala aceasta folosește textul ebraic; mai jos vezi cum diferă celelalte.</p>
        <Lifespans pick={lifePick} onPick={setLifePick} />
        <p><Link className="btn" href="/istoria-umanitatii">Istoria umanității: toate civilizațiile pe aceeași axă</Link></p>
      </section>

      <section className="ch-part" id="socoteli">
        <div className="section-label">Cu băgare de seamă</div>
        <h3 className="ch-part-title">Unde socotelile diferă</h3>
        <p>Textele biblice dau anii oamenilor, dar nu un calendar cu ani „înainte de Hristos”. Orice dată pentru Adam sau pentru potop vine dintr-o socoteală, iar textele vechi nu dau aceleași cifre. De aceea arătăm aici unde diferă, fără să spunem că una dintre ele e sigur cea bună.</p>
        <h4 className="ch-sub">Trei texte vechi ale Genezei</h4>
        <p>Textul ebraic (masoretic), după care e tradusă Biblia Cornilescu, Septuaginta (traducerea greacă din secolele III–II î.Hr., citată des în Noul Testament și folosită de Bisericile ortodoxe) și Pentateuhul samaritean dau vârste diferite ale părinților la nașterea fiilor. Anii de viață, în total, sunt aproape aceiași; se schimbă doar când s-a născut fiul.</p>
        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead><tr><th>Tatăl</th><th>Ebraic</th><th>Septuaginta</th><th>Samaritean</th></tr></thead>
            <tbody>
              {VERSIONS.map((v, i) => (
                <tr key={i} className={v.mt === v.lxx && v.mt === v.sp ? "" : "diff"}>
                  <td>{v.name}</td><td>{v.mt ?? "—"}</td><td>{v.lxx ?? "—"}</td><td>{v.sp ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td>De la Adam la potop</td><td>1656</td><td>2242</td><td>1307</td></tr>
              <tr><td>De la potop la Avraam</td><td>292</td><td>1072</td><td>942</td></tr>
              <tr><td>De la Adam la Avraam</td><td>1948</td><td>3314</td><td>2249</td></tr>
            </tfoot>
          </table>
        </div>
        <p className="muted ah-small">Manuscrisele Septuagintei nu sunt nici ele toate la fel (de exemplu, unele dau la Metusala 187 de ani, nu 167). Luca 3:36 îl are pe Cainan între Arpacșad și Șelah, ca Septuaginta.</p>
        <h4 className="ch-sub">Ani „de la facerea lumii”</h4>
        <ul className="ch-influence">
          <li><strong>Calendarul bizantin</strong> socotea facerea lumii în 5509 î.Hr., după Septuaginta. Și la noi, cronicile și hrisoavele domnești din Țara Românească și Moldova sunt datate „de la facerea lumii”: anul 7000 a început în septembrie 1491.</li>
          <li><strong>Arhiepiscopul James Ussher</strong> (1650), după textul ebraic, a ajuns la 4004 î.Hr.; mulți au folosit socoteala lui pe marginea Bibliilor.</li>
          <li><strong>Calendarul evreiesc</strong> de azi pornește din 3761 î.Hr.</li>
        </ul>
        <h4 className="ch-sub">După Avraam</h4>
        <p>Dacă iei literal 1 Împărați 6:1 (480 de ani de la ieșirea din Egipt până la Templul lui Solomon, în jurul anului 966 î.Hr.) și Exodul 12:40 (430 de ani în Egipt), ieșirea din Egipt cade pe la 1446 î.Hr., iar nașterea lui Avraam pe la 2166 î.Hr. Mulți istorici pun ieșirea pe la 1260 î.Hr. Iar Septuaginta socotește cei 430 de ani din Exodul 12:40 împreună cu șederea în Canaan, nu doar în Egipt. Anii împăraților lui Iuda sunt mai siguri, dar și ei sunt aproximativi, cu câțiva ani în plus sau în minus.</p>
        <h4 className="ch-sub">Matei și Luca</h4>
        <p>Matei scrie pentru iudei și pornește de la Avraam; își împarte lista în trei grupe de câte 14 generații (Matei 1:17) și, ca să le potrivească, lasă deoparte câțiva împărați (Ahazia, Ioas, Amația, Ioiachim). Luca pornește de la Isus și urcă până la Adam, „fiul lui Dumnezeu”, prin Natan, nu prin Solomon. Cele două liste se ating la Salatiel și Zorobabel și se întâlnesc la Iosif. Biserica a dat de-a lungul vremii două explicații: fie Luca dă linia Mariei, fie una dintre liste urmează tatăl după naștere și cealaltă tatăl după lege.</p>
      </section>

      <section className="ch-part ch-end">
        <h3 className="ch-part-title">Oameni obișnuiți, într-o genealogie neobișnuită</h3>
        <p>Lista aceasta nu e plină doar de regi și de eroi. În ea stau și o femeie din Ierihon, Rahav, o străină săracă, Rut moabita, și un rege ca Manase, care a greșit mult și s-a întors. Ca în orice familie adevărată. Fiecare arbore, și al tău, e făcut din oameni așa.</p>
        <p><Link className="btn primary" href="/istoria-umanitatii">Istoria umanității</Link> <Link className="btn" href="/libertatea-de-a-crede">Libertatea de a crede</Link></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Scris de mână, după textele biblice, așa cum sunt scrise. Numele sunt din traducerea Dumitru Cornilescu; unde Matei sau Luca scriu un nume altfel, forma lor e trecută lângă. Anii de viață sunt cei din texte; anii î.Hr. sunt aproximativi.</p>
      </section>
    </article>
  );
}


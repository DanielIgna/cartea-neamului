"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapKind, MapPlace, TreeMap } from "@/lib/map-data";
import type { Spot } from "@/lib/places";
import { findPlaces, pinPlace, placeChoices, unpinPlace } from "@/app/harta-actions";

type Filter = "all" | MapKind;
const KINDS: { k: MapKind; label: string; here: string; color: string }[] = [
  { k: "born", label: "Născuți", here: "S-au născut aici", color: "--accent" },
  { k: "died", label: "Decedați", here: "Au murit aici", color: "--ochre" },
  { k: "lives", label: "Trăiesc acum", here: "Trăiesc aici acum", color: "--good" },
];
type Fix = { keys: { key: string; text: string; country: string | null }[]; label: string };
type Drawn = { L: typeof Leaflet; map: Leaflet.Map; routes: Leaflet.LayerGroup; marks: Leaflet.LayerGroup; temp: Leaflet.LayerGroup; ro: ResizeObserver };

/** „5 persoane”, dar „24 de persoane”: în română, de la 20 în sus numărul cere „de”. */
const de = (n: number) => (n % 100 >= 20 || (n >= 100 && n % 100 === 0) ? `${n} de` : `${n}`);
const persoane = (n: number) => (n === 1 ? "o persoană" : `${de(n)} persoane`);
const locuri = (n: number) => (n === 1 ? "un loc" : `${de(n)} locuri`);
const radius = (n: number) => 5 + 3.2 * Math.sqrt(n);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** Un arc ușor între două locuri, ca drumurile care pleacă și cele care vin să nu se suprapună. */
function arc(a: [number, number], b: [number, number]): [number, number][] {
  const [y1, x1] = a, [y2, x2] = b, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const cx = mx + (y2 - y1) * 0.18, cy = my - (x2 - x1) * 0.18;
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16, u = 1 - t;
    return [u * u * y1 + 2 * u * t * cy + t * t * y2, u * u * x1 + 2 * u * t * cx + t * t * x2];
  });
}

export default function FamilyMap({ treeId, treeName, data, canEdit, focus }: { treeId: string; treeName: string; data: TreeMap; canEdit: boolean; focus: string | null }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const drawn = useRef<Drawn | null>(null);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [routesOn, setRoutesOn] = useState(true);
  // Locul ales îl ținem minte după cum e scris în fișe (cheia), nu după punct: așa rămâne ales și după ce îl muți pe hartă.
  const [sel, setSel] = useState<string | null>(focus);
  const [picking, setPicking] = useState<Fix | null>(null);
  const [pickAt, setPickAt] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pickingRef = useRef(picking);
  useEffect(() => { pickingRef.current = picking; }, [picking]);

  const shown = useMemo(() => data.places.map((p) => ({ ...p, n: p.people.filter((x) => filter === "all" || x.kind === filter).length })).filter((p) => p.n > 0), [data, filter]);
  const selected = sel ? data.places.find((p) => p.keys.some((k) => k.key === sel)) ?? null : null;
  const isSel = (p: MapPlace) => !!sel && p.keys.some((k) => k.key === sel);
  // Mijlocul neamului, ca alegerile dintre sate cu același nume să înceapă cu cel mai apropiat.
  const home = useMemo(() => {
    const sure = data.places.filter((p) => p.how === "found" || p.how === "pin");
    return sure.length ? { lat: median(sure.map((p) => p.lat)), lng: median(sure.map((p) => p.lng)) } : null;
  }, [data]);

  // Locurile de acasă: cele din jurul satelor neamului (până la ~300 km). Harta pornește de la ele, dacă acolo e mai mult de jumătate
  // din neam; cei plecați departe (Torino, Madrid) se văd cu „Tot neamul”.
  const nearHome = useMemo(() => {
    if (!home) return [];
    const close = shown.filter((p) => p.how !== "country" && Math.hypot(p.lat - home.lat, (p.lng - home.lng) * Math.cos((home.lat * Math.PI) / 180)) < 2.7);
    const n = (xs: typeof shown) => xs.reduce((t, p) => t + p.n, 0);
    return close.length < shown.length && n(close) * 2 > n(shown) ? close : [];
  }, [home, shown]);

  // Harta se încarcă o singură dată, doar în browser (Leaflet nu merge pe server).
  useEffect(() => {
    let gone = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const judete = (await import("@/data/places/judete.json")).default as { c: string; n: string; g: [number, number][][] }[];
      if (gone || !box.current) return;
      const map = L.map(box.current, { worldCopyJump: true, zoomSnap: 0.5 }).setView([45.9, 24.97], 6);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · sate: SIRUTA (INS) · orașe: GeoNames',
      }).addTo(map);
      // Contururile județelor rămân și când plăcile hărții nu se încarcă (fără internet, sau un server ocupat).
      const css = getComputedStyle(document.documentElement);
      for (const j of judete) for (const ring of j.g) L.polyline(ring.map(([x, y]) => [y, x] as [number, number]), { color: css.getPropertyValue("--muted").trim() || "#5b6673", weight: 0.8, opacity: 0.45, interactive: false }).addTo(map);
      const routes = L.layerGroup().addTo(map), marks = L.layerGroup().addTo(map), temp = L.layerGroup().addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => { if (pickingRef.current) setPickAt({ lat: e.latlng.lat, lng: e.latlng.lng }); });
      map.on("zoomend", () => setZoom(map.getZoom()));
      // Pe telefon cutia hărții își schimbă mărimea după încărcare (fonturi, bara de sus): harta trebuie anunțată.
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(box.current);
      drawn.current = { L, map, routes, marks, temp, ro };
      setReady(true);
    })();
    return () => { gone = true; drawn.current?.ro.disconnect(); drawn.current?.map.remove(); drawn.current = null; };
  }, []);

  // Cercurile locurilor și drumurile, la fiecare schimbare de filtru, de loc ales sau de date.
  useEffect(() => {
    const d = drawn.current;
    if (!ready || !d) return;
    const { L, map, routes, marks } = d;
    const css = getComputedStyle(document.documentElement);
    const col = (v: string) => css.getPropertyValue(v).trim() || "#1f5fa8";
    const fill = col(KINDS.find((k) => k.k === filter)?.color ?? "--accent");
    routes.clearLayers();
    marks.clearLayers();
    const byId = new Map(data.places.map((p) => [p.id, p]));
    if (routesOn && filter !== "born") {
      for (const r of data.routes) {
        const who = r.people.filter((id) => filter === "all" || (filter === "lives") === data.people[id]?.living);
        const a = byId.get(r.from), b = byId.get(r.to);
        if (!who.length || !a || !b) continue;
        L.polyline(arc([a.lat, a.lng], [b.lat, b.lng]), { color: col("--ochre"), weight: 1.2 + 1.4 * Math.sqrt(who.length), opacity: 0.6, interactive: true })
          .bindTooltip(`${a.name} → ${b.name}: ${who.map((id) => data.people[id]?.name).join(", ")}`, { sticky: true })
          .addTo(routes);
      }
    }
    // Numele satelor stau scrise lângă cerc doar unde au loc: întâi cele cu mai mulți oameni, fără să se calce unul pe altul.
    const order = [...shown].sort((a, b) => b.n - a.n);
    type Box = { x1: number; y1: number; x2: number; y2: number };
    const pt = (p: { lat: number; lng: number }) => map.latLngToContainerPoint([p.lat, p.lng]);
    const dots: Box[] = order.map((p) => { const c = pt(p), r = radius(p.n); return { x1: c.x - r, y1: c.y - r, x2: c.x + r, y2: c.y + r }; });
    const taken: Box[] = [];
    const size = map.getSize();
    const clash = (b: Box, own: number) => b.x1 < 2 || b.y1 < 2 || b.x2 > size.x - 2 || b.y2 > size.y - 2 ||
      [...taken, ...dots.filter((_, i) => i !== own)].some((o) => !(b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2));
    const side = new Map<string, "right" | "left">();
    order.forEach((p, i) => {
      const c = pt(p), r = radius(p.n), w = p.name.length * 6.8 + 6, h = 15;
      const right = { x1: c.x + r + 2, y1: c.y - h / 2, x2: c.x + r + 2 + w, y2: c.y + h / 2 };
      const left = { x1: c.x - r - 2 - w, y1: c.y - h / 2, x2: c.x - r - 2, y2: c.y + h / 2 };
      if (!clash(right, i)) { taken.push(right); side.set(p.id, "right"); }
      else if (!clash(left, i)) { taken.push(left); side.set(p.id, "left"); }
    });
    for (const p of order) {
      const r = radius(p.n);
      const m = L.circleMarker([p.lat, p.lng], {
        radius: r, color: isSel(p) ? col("--ink") : col("--surface"), weight: isSel(p) ? 3 : 1.5,
        fillColor: fill, fillOpacity: p.how === "country" ? 0.45 : 0.85, dashArray: p.how === "country" ? "3 3" : undefined,
      });
      const s = side.get(p.id);
      if (s) m.bindTooltip(p.name, { permanent: true, direction: s, offset: [s === "right" ? r : -r, 0], className: "map-label" });
      else m.bindTooltip(`${p.name} · ${persoane(p.n)}`, { direction: "top" });
      if (s) m.on("mouseover", () => m.setTooltipContent(`${p.name} · ${persoane(p.n)}`)).on("mouseout", () => m.setTooltipContent(p.name));
      m.on("click", (e: Leaflet.LeafletMouseEvent) => { if (pickingRef.current) return; L.DomEvent.stopPropagation(e); setSel(p.keys[0].key); });
      m.addTo(marks);
    }
    if (!fitted.current) {
      fitted.current = true;
      if (selected) map.setView([selected.lat, selected.lng], 10);
      else fit(nearHome.length ? nearHome : shown);
    }
  }, [ready, data, shown, filter, routesOn, sel, zoom]);

  /** Încadrează harta pe locurile date (fără să mărească până la uliță când e un singur sat). */
  function fit(list: { lat: number; lng: number }[]) {
    const d = drawn.current;
    if (!d || !list.length) return;
    d.map.invalidateSize();
    if (list.length === 1) d.map.setView([list[0].lat, list[0].lng], 9);
    else d.map.fitBounds(d.L.latLngBounds(list.map((p) => [p.lat, p.lng] as [number, number])), { paddingTopLeft: [50, 40], paddingBottomRight: [90, 40], maxZoom: 10 });
  }

  // Semnul de „aici” când pui un loc de mână.
  useEffect(() => {
    const d = drawn.current;
    if (!ready || !d) return;
    d.temp.clearLayers();
    if (pickAt) d.L.circleMarker([pickAt.lat, pickAt.lng], { radius: 9, color: "#a8322a", weight: 3, fillOpacity: 0.2 }).addTo(d.temp);
  }, [ready, pickAt]);

  // Când locul ales e mutat (ales alt sat sau pus de mână), harta merge după el.
  const selPos = selected ? `${selected.lat},${selected.lng}` : "";
  const last = useRef<{ key: string | null; pos: string }>({ key: null, pos: "" });
  useEffect(() => {
    const prev = last.current;
    last.current = { key: sel, pos: selPos };
    if (ready && drawn.current && selected && prev.key === sel && prev.pos && prev.pos !== selPos) {
      drawn.current.map.flyTo([selected.lat, selected.lng], Math.max(drawn.current.map.getZoom(), 8), { duration: 0.6 });
    }
  }, [ready, sel, selPos]);

  function choose(p: MapPlace) {
    setSel(p.keys[0].key);
    if (drawn.current) drawn.current.map.flyTo([p.lat, p.lng], Math.max(drawn.current.map.getZoom(), 9), { duration: 0.6 });
  }

  async function save(fix: Fix, s: { placeId: string | null; name: string; detail: string | null; lat: number; lng: number }) {
    setBusy(true); setErr(null);
    for (const k of fix.keys) {
      const res = await pinPlace({ treeId, key: k.key, ...s });
      if (res.error) { setErr(res.error); setBusy(false); return; }
    }
    setBusy(false); setPicking(null); setPickAt(null);
    setSel(fix.keys[0]?.key ?? null);
    router.refresh();
  }

  async function forget(p: MapPlace) {
    setBusy(true); setErr(null);
    for (const k of p.keys) await unpinPlace(treeId, k.key);
    setBusy(false);
    router.refresh();
  }

  const groups = useMemo(() => {
    const g = new Map<string, { name: string; n: number; places: typeof shown }>();
    for (const p of shown) {
      const x = g.get(p.group) ?? { name: p.group, n: 0, places: [] };
      x.n += p.n; x.places.push(p); g.set(p.group, x);
    }
    for (const x of g.values()) x.places.sort((a, b) => b.n - a.n);
    return [...g.values()].sort((a, b) => b.n - a.n);
  }, [shown]);
  const most = Math.max(1, ...shown.map((p) => p.n));
  const total = new Set(shown.flatMap((p) => p.people.filter((x) => filter === "all" || x.kind === filter).map((x) => x.id))).size;
  const counties = groups.filter((g) => shown.some((p) => p.group === g.name && p.cc === "RO")).length;
  const abroad = new Set(shown.filter((p) => p.cc && p.cc !== "RO").map((p) => p.cc)).size;

  return (
    <div className="layout">
      <div className="card">
        <div className="toolbar">
          <div className="title">Harta neamului · {treeName}</div>
          <Link className="btn" href={`/arbore/${treeId}`}>Înapoi la arbore</Link>
        </div>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Ce arată harta">
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Toți</button>
            {KINDS.map((k) => <button key={k.k} aria-pressed={filter === k.k} onClick={() => setFilter(k.k)}>{k.label}</button>)}
          </div>
          {nearHome.length > 0 && (
            <span className="actions" style={{ margin: 0 }}>
              <button className="btn" onClick={() => fit(nearHome)}>Locurile de acasă</button>
              <button className="btn" onClick={() => fit(shown)}>Tot neamul</button>
            </span>
          )}
          {data.routes.length > 0 && (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" checked={routesOn} onChange={(e) => setRoutesOn(e.target.checked)} /> Drumurile neamului
            </label>
          )}
        </div>
        {picking && (
          <div className="confirm" style={{ marginBottom: 8 }}>
            {pickAt ? <>Pun <b>„{picking.label}”</b> în punctul marcat cu roșu?{" "}
              <span className="actions" style={{ display: "inline-flex", marginTop: 6 }}>
                <button className="btn primary" disabled={busy} onClick={() => save(picking, { placeId: null, name: picking.label, detail: "pus de mână pe hartă", lat: pickAt.lat, lng: pickAt.lng })}>{busy ? "Se salvează…" : "Da, pune-l aici"}</button>
                <button className="btn" onClick={() => setPickAt(null)}>Alt punct</button>
                <button className="btn" onClick={() => { setPicking(null); setPickAt(null); }}>Renunță</button>
              </span></>
              : <>Dă click pe hartă acolo unde e <b>„{picking.label}”</b>. Poți mări harta cu rotița sau cu +. <button className="btn" onClick={() => setPicking(null)}>Renunță</button></>}
          </div>
        )}
        <div ref={box} className={`mapbox${picking ? " picking" : ""}`} role="application" aria-label={`Harta locurilor din neamul ${treeName}`} />
        <div className="legend">
          <span>{shown.length ? `${locuri(shown.length)}${counties ? ` în ${counties} ${counties === 1 ? "județ" : "județe"}` : ""}${abroad ? ` și ${abroad} ${abroad === 1 ? "țară străină" : "țări străine"}` : ""} · ${persoane(total)}` : "Niciun loc încă."}</span>
          <span>Cercul e mai mare unde sunt mai mulți oameni.</span>
          {routesOn && data.routes.length > 0 && filter !== "born" && <span><i className="sw" style={{ background: "var(--ochre)", height: 4, borderRadius: 2 }} />De unde au plecat și unde au ajuns</span>}
        </div>
      </div>

      <aside className="stack">
        {selected ? (
          <PlaceCard key={selected.id} place={selected} treeId={treeId} data={data} canEdit={canEdit} home={home} busy={busy}
            onBack={() => setSel(null)} onSave={save} onForget={forget} onPick={(fix) => { setPicking(fix); setPickAt(null); }} />
        ) : (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>Locurile neamului</div>
            {!shown.length && <p className="muted" style={{ margin: 0 }}>Când treci în fișe locul nașterii, al morții sau unde locuiește cineva acum, satul apare aici, pe hartă.</p>}
            {groups.map((g) => (
              <div key={g.name} style={{ marginBottom: 10 }}>
                <div className="meta" style={{ fontWeight: 700 }}>{g.name} · {g.n}</div>
                <div className="place-list">
                  {g.places.map((p) => (
                    <button key={p.id} className="place-row" onClick={() => choose(p)}>
                      <span>{p.name}{p.how === "country" ? " (doar țara)" : ""}</span>
                      <span className="bar" style={{ width: Math.max(4, (60 * p.n) / most) }} />
                      <span className="n">{p.n}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {err && <div className="card"><p className="err" style={{ margin: 0 }}>{err}</p></div>}
        {data.missing.length > 0 && (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>Locuri pe care harta nu le-a găsit ({data.missing.length})</div>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Poate sunt scrise altfel, au alt nume azi sau nu mai există. {canEdit ? "Caută-le sau pune-le de mână pe hartă; se schimbă pentru toate fișele care le au." : ""}</p>
            <div className="stack" style={{ gap: 10 }}>
              {data.missing.map((m) => (
                <div key={m.key}>
                  <b>{m.text}</b>{m.country && !/^rom[aâ]nia$/i.test(m.country) && !m.text.includes(m.country) ? `, ${m.country}` : ""}
                  <div className="meta">{m.people.map((x) => data.people[x.id]?.name).join(", ")}</div>
                  {canEdit && <Fixer treeId={treeId} fix={{ keys: [{ key: m.key, text: m.text, country: m.country }], label: m.text }} initial={m.text} country={m.country} near={home} busy={busy}
                    onSave={save} onPick={(fix) => { setPicking(fix); setPickAt(null); }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function PlaceCard({ place: p, treeId, data, canEdit, home, busy, onBack, onSave, onForget, onPick }: {
  place: MapPlace; treeId: string; data: TreeMap; canEdit: boolean; home: { lat: number; lng: number } | null; busy: boolean;
  onBack: () => void; onSave: (fix: Fix, s: { placeId: string | null; name: string; detail: string | null; lat: number; lng: number }) => void;
  onForget: (p: MapPlace) => void; onPick: (fix: Fix) => void;
}) {
  const [fixing, setFixing] = useState(false);
  const fix: Fix = { keys: p.keys, label: p.keys[0]?.text || p.name };
  return (
    <div className="card panel">
      <button className="btn" onClick={onBack} style={{ marginBottom: 10 }}>← Toate locurile</button>
      <h2>{p.name}</h2>
      <div className="meta">{p.detail}</div>
      {p.how === "guess" && <p className="muted" style={{ fontSize: 14 }}>În România sunt {de(p.choices ?? 0)} locuri cu numele „{p.name}”. Am ales pe cel mai apropiat de restul neamului.</p>}
      {p.how === "country" && <p className="muted" style={{ fontSize: 14 }}>În fișă e trecută doar țara, așa că cercul stă la mijlocul ei.</p>}
      {p.keys.some((k) => k.text && k.text !== p.name) && <p className="muted" style={{ fontSize: 13 }}>În fișe: {p.keys.map((k) => `„${k.text || k.country}”`).join(", ")}</p>}
      {KINDS.map((k) => {
        const who = p.people.filter((x) => x.kind === k.k).map((x) => data.people[x.id]).filter(Boolean);
        if (!who.length) return null;
        return (
          <div key={k.k}>
            <div className="section-label"><i className="dot" style={{ background: `var(${k.color})` }} />{k.here} ({who.length})</div>
            <ul className="people-list">
              {who.map((x) => <li key={x.id}><Link href={`/arbore/${treeId}?p=${x.id}`}>{x.name}</Link> {x.years && <small>{x.years}</small>}</li>)}
            </ul>
          </div>
        );
      })}
      {canEdit && (
        <div style={{ marginTop: 14 }}>
          {p.how === "pin" ? (
            <div className="actions">
              <button className="btn" disabled={busy} onClick={() => setFixing((f) => !f)}>Mută locul</button>
              <button className="btn" disabled={busy} onClick={() => onForget(p)}>Lasă harta să-l caute singură</button>
            </div>
          ) : (
            <button className="btn" onClick={() => setFixing((f) => !f)}>{p.how === "guess" ? "Nu e acesta? Alege satul" : "Nu e aici? Mută locul"}</button>
          )}
          {fixing && <Fixer treeId={treeId} fix={fix} initial={p.keys[0]?.text || p.name} country={p.keys[0]?.country ?? null} near={home} busy={busy}
            sameName={p.how === "guess" ? p.keys[0] : undefined} onSave={onSave} onPick={onPick} />}
        </div>
      )}
    </div>
  );
}

/** Caută locul după nume (cu satele care se potrivesc) sau pune-l cu un click pe hartă. */
function Fixer({ treeId, fix, initial, country, near, busy, sameName, onSave, onPick }: {
  treeId: string; fix: Fix; initial: string; country: string | null; near: { lat: number; lng: number } | null; busy: boolean;
  sameName?: { text: string; country: string | null };
  onSave: (fix: Fix, s: { placeId: string | null; name: string; detail: string | null; lat: number; lng: number }) => void; onPick: (fix: Fix) => void;
}) {
  const [q, setQ] = useState(initial);
  const [found, setFound] = useState<Spot[] | null>(null);
  const [open, setOpen] = useState(!!sameName);
  useEffect(() => {
    if (!open) return;
    let live = true;
    const t = setTimeout(async () => {
      const res = sameName && q === initial ? await placeChoices(treeId, sameName.text, sameName.country, near) : await findPlaces(q, country);
      if (live) setFound(res);
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, open]);
  if (!open) {
    return (
      <div className="actions" style={{ marginTop: 6 }}>
        <button className="btn" onClick={() => setOpen(true)}>Caută locul</button>
        <button className="btn" onClick={() => onPick(fix)}>Pune-l de mână pe hartă</button>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Numele satului sau al orașului" placeholder="satul, comuna sau orașul"
        style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 10px", background: "var(--surface)" }} />
      <div className="suggest">
        {found === null && <small className="muted">Caut…</small>}
        {found?.length === 0 && <small className="muted">Nu găsesc „{q}”. Încearcă alt nume sau pune-l de mână pe hartă.</small>}
        {found?.map((s) => (
          <button key={s.id} disabled={busy} onClick={() => onSave(fix, { placeId: s.id, name: s.name, detail: s.detail, lat: s.lat, lng: s.lng })}>
            {s.name}<small>{s.detail}</small>
          </button>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 6 }}>
        <button className="btn" onClick={() => onPick(fix)}>Pune-l de mână pe hartă</button>
      </div>
    </div>
  );
}

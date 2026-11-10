"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapKind, MapPlace, TreeMap } from "@/lib/map-data";
import type { PlaceMemory } from "@/lib/lada-db";
import type { Spot } from "@/lib/places";
import { findPlaces, pinPlace, placeChoices, unpinPlace } from "@/app/harta-actions";
import NearbyFamilies, { type Nearby } from "./NearbyFamilies";

type Filter = "all" | MapKind | "memories"; // „memories”: locurile amintirilor din lăzi, în loc de oameni
const KINDS: { k: MapKind; color: string }[] = [
  { k: "born", color: "--accent" },
  { k: "died", color: "--ochre" },
  { k: "lives", color: "--good" },
];
type Fix = { keys: { key: string; text: string; country: string | null }[]; label: string };
type Drawn = { L: typeof Leaflet; map: Leaflet.Map; routes: Leaflet.LayerGroup; marks: Leaflet.LayerGroup; temp: Leaflet.LayerGroup; ro: ResizeObserver };

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

export default function FamilyMap({ treeId, treeName, data, canEdit, focus, nearby, treeTotal }: {
  treeId: string; treeName: string; data: TreeMap; canEdit: boolean; focus: string | null; nearby: Nearby;
  /** Câți oameni are arborele de tot (cifra din arbore și de pe prima pagină), ca să spunem de ce pe hartă sunt mai puțini. */
  treeTotal: number;
}) {
  const router = useRouter();
  const t = useTranslations("Map");
  const box = useRef<HTMLDivElement>(null);
  const drawn = useRef<Drawn | null>(null);
  const fitted = useRef(false);
  const cleanup = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  // Venit de la o amintire (`?loc=`) într-un loc fără oameni din fișe: harta pornește cu amintirile.
  const [filter, setFilter] = useState<Filter>(() => {
    const p = focus ? data.places.find((x) => x.keys.some((k) => k.key === focus)) : null;
    return (p && !p.people.length) || data.memoryMissing.some((x) => x.key === focus) ? "memories" : "all";
  });
  const [routesOn, setRoutesOn] = useState(true);
  // Locul ales îl ținem minte după cum e scris în fișe (cheia), nu după punct: așa rămâne ales și după ce îl muți pe hartă.
  const [sel, setSel] = useState<string | null>(focus);
  const [picking, setPicking] = useState<Fix | null>(null);
  const [pickAt, setPickAt] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pickingRef = useRef(picking);
  useEffect(() => { pickingRef.current = picking; }, [picking]);

  const shown = useMemo(() => data.places.map((p) => ({ ...p, n: filter === "memories" ? p.memories.length : p.people.filter((x) => filter === "all" || x.kind === filter).length }))
    .filter((p) => p.n > 0), [data, filter]);
  const selected = sel ? data.places.find((p) => p.keys.some((k) => k.key === sel)) ?? null : null;
  const lostMemory = sel && !selected ? data.memoryMissing.find((x) => x.key === sel) ?? null : null;
  const hasMemories = data.memoryMissing.length > 0 || data.places.some((p) => p.memories.length > 0);
  const count = (n: number) => t(filter === "memories" ? "memories" : "people", { count: n });
  const isSel = (p: MapPlace) => !!sel && p.keys.some((k) => k.key === sel);
  // Mijlocul neamului, ca alegerile dintre sate cu același nume să înceapă cu cel mai apropiat.
  const home = useMemo(() => {
    const sure = data.places.filter((p) => p.people.length > 0 && (p.how === "found" || p.how === "pin"));
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
      // Pe telefon un deget derulează pagina, două degete mută și măresc harta. Pe calculator rotița mărește harta doar cu Ctrl
      // (sau Cmd) apăsat ori după un clic pe hartă; altfel derulează pagina, ca de obicei.
      const touch = window.matchMedia("(pointer: coarse)").matches || ("ontouchstart" in window && navigator.maxTouchPoints > 0);
      const map = L.map(box.current, { worldCopyJump: true, zoomSnap: 0.5, scrollWheelZoom: false, dragging: !touch, touchZoom: true }).setView([45.9, 24.97], 6);
      const el = box.current;
      let clicked = false, hintTimer = 0;
      const showHint = (on: boolean) => { el.classList.toggle("map-hint-on", on); };
      const flash = () => { showHint(true); window.clearTimeout(hintTimer); hintTimer = window.setTimeout(() => showHint(false), 1400); };
      const wheelOn = () => { if (!map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable(); };
      const wheelOff = () => { if (!clicked) map.scrollWheelZoom.disable(); };
      const keys = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey) wheelOn(); else wheelOff(); };
      window.addEventListener("keydown", keys);
      window.addEventListener("keyup", keys);
      // Ctrl ținut apăsat dinainte: rotița vine deja cu ctrlKey; fără Ctrl și fără clic, arătăm cum se mărește.
      el.addEventListener("wheel", (e) => {
        if (map.scrollWheelZoom.enabled()) return;
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); wheelOn(); map.setZoomAround(map.mouseEventToContainerPoint(e as unknown as MouseEvent), map.getZoom() + (e.deltaY < 0 ? 0.5 : -0.5)); }
        else flash();
      }, { passive: false });
      el.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { clicked = true; wheelOn(); } });
      el.addEventListener("mouseleave", () => { clicked = false; map.scrollWheelZoom.disable(); });
      // Pe telefon, un singur deget pe hartă: o clipă, ce faci ca s-o miști.
      if (touch) {
        el.addEventListener("touchmove", (e) => { if (e.touches.length === 1) flash(); }, { passive: true });
        el.addEventListener("touchstart", (e) => { if (e.touches.length > 1) showHint(false); }, { passive: true });
      }
      el.dataset.hint = touch ? t("hintTouch") : t("hintWheel");
      cleanup.current = () => { window.removeEventListener("keydown", keys); window.removeEventListener("keyup", keys); window.clearTimeout(hintTimer); };
      map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · ${t("attribution")}`,
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
    return () => { gone = true; cleanup.current?.(); drawn.current?.ro.disconnect(); drawn.current?.map.remove(); drawn.current = null; };
  }, []);

  // Cercurile locurilor și drumurile, la fiecare schimbare de filtru, de loc ales sau de date.
  useEffect(() => {
    const d = drawn.current;
    if (!ready || !d) return;
    const { L, map, routes, marks } = d;
    const css = getComputedStyle(document.documentElement);
    const col = (v: string) => css.getPropertyValue(v).trim() || "#1f5fa8";
    const fill = col(filter === "memories" ? "--plum" : KINDS.find((k) => k.k === filter)?.color ?? "--accent");
    routes.clearLayers();
    marks.clearLayers();
    const byId = new Map(data.places.map((p) => [p.id, p]));
    if (routesOn && filter !== "born" && filter !== "memories") {
      for (const r of data.routes) {
        const who = r.people.filter((id) => filter === "all" || (filter === "lives") === data.people[id]?.living);
        const a = byId.get(r.from), b = byId.get(r.to);
        if (!who.length || !a || !b) continue;
        L.polyline(arc([a.lat, a.lng], [b.lat, b.lng]), { color: col("--ochre"), weight: 1.2 + 1.4 * Math.sqrt(who.length), opacity: 0.6, interactive: true })
          .bindTooltip(`${a.name} → ${b.name}: ${who.map((id) => data.people[id]?.name).join(", ")}`, { sticky: true })
          .addTo(routes);
      }
    }
    // Locurile apropiate (de pildă satele din jurul Clujului, la zoom mic) se adună într-un singur cerc cu numărul lor;
    // un clic pe el mărește harta pe ele. Locul ales rămâne mereu singur.
    const pt = (p: { lat: number; lng: number }) => map.latLngToContainerPoint([p.lat, p.lng]);
    const sorted = [...shown].sort((a, b) => b.n - a.n);
    type Group = { places: typeof shown; n: number; x: number; y: number };
    const groups: Group[] = [];
    const clusterOn = map.getZoom() < 13;
    for (const p of sorted) {
      const c = pt(p);
      const g = clusterOn && !isSel(p) ? groups.find((g) => !g.places.some(isSel) && Math.hypot(g.x - c.x, g.y - c.y) < radius(g.n) + radius(p.n) - 2) : undefined;
      if (g) { g.places.push(p); g.n += p.n; } else groups.push({ places: [p], n: p.n, x: c.x, y: c.y });
    }
    // Numele satelor stau scrise lângă cerc doar unde au loc: întâi cele cu mai mulți oameni, fără să se calce unul pe altul.
    const order = [...groups].sort((a, b) => b.n - a.n);
    type Box = { x1: number; y1: number; x2: number; y2: number };
    const nameOf = (g: Group) => (g.places.length > 1 ? `${g.places[0].name} +${g.places.length - 1}` : g.places[0].name);
    const dots: Box[] = order.map((g) => { const r = radius(g.n); return { x1: g.x - r, y1: g.y - r, x2: g.x + r, y2: g.y + r }; });
    const taken: Box[] = [];
    const size = map.getSize();
    const clash = (b: Box, own: number) => b.x1 < 2 || b.y1 < 2 || b.x2 > size.x - 2 || b.y2 > size.y - 2 ||
      [...taken, ...dots.filter((_, i) => i !== own)].some((o) => !(b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2));
    const side = new Map<Group, "right" | "left">();
    order.forEach((g, i) => {
      const r = radius(g.n), w = nameOf(g).length * 6.8 + 6, h = 15;
      const right = { x1: g.x + r + 2, y1: g.y - h / 2, x2: g.x + r + 2 + w, y2: g.y + h / 2 };
      const left = { x1: g.x - r - 2 - w, y1: g.y - h / 2, x2: g.x - r - 2, y2: g.y + h / 2 };
      if (!clash(right, i)) { taken.push(right); side.set(g, "right"); }
      else if (!clash(left, i)) { taken.push(left); side.set(g, "left"); }
    });
    for (const g of order) {
      const r = radius(g.n), s = side.get(g);
      if (g.places.length > 1) {
        const lead = g.places[0];
        const told = filter !== "memories" && g.places.some((p) => p.memories.length > 0);
        const m = L.marker([lead.lat, lead.lng], {
          icon: L.divIcon({ className: "map-cluster", html: `<span style="--r:${r}px;--f:${fill};--b:${told ? col("--plum") : col("--surface")}">${g.places.length}</span>`, iconSize: [r * 2, r * 2] }),
          keyboard: true, title: t("clusterTitle", { count: g.places.length }),
        });
        const list = `${g.places.map((p) => p.name).join(", ")} · ${count(g.n)}`;
        if (s) m.bindTooltip(nameOf(g), { permanent: true, direction: s, offset: [s === "right" ? r : -r, 0], className: "map-label" });
        else m.bindTooltip(list, { direction: "top" });
        if (s) m.on("mouseover", () => m.setTooltipContent(list)).on("mouseout", () => m.setTooltipContent(nameOf(g)));
        m.on("click", (e: Leaflet.LeafletMouseEvent) => {
          if (pickingRef.current) return;
          L.DomEvent.stopPropagation(e);
          map.fitBounds(L.latLngBounds(g.places.map((p) => [p.lat, p.lng] as [number, number])), { padding: [60, 60], maxZoom: Math.max(map.getZoom() + 2, 13) });
        });
        m.addTo(marks);
        continue;
      }
      const p = g.places[0];
      // Când harta arată oamenii, locurile cu amintiri au marginea mov.
      const told = filter !== "memories" && p.memories.length > 0;
      const m = L.circleMarker([p.lat, p.lng], {
        radius: r, color: isSel(p) ? col("--ink") : told ? col("--plum") : col("--surface"), weight: isSel(p) ? 3 : told ? 2.5 : 1.5,
        fillColor: fill, fillOpacity: p.how === "country" ? 0.45 : 0.85, dashArray: p.how === "country" ? "3 3" : undefined,
      });
      if (s) m.bindTooltip(p.name, { permanent: true, direction: s, offset: [s === "right" ? r : -r, 0], className: "map-label" });
      else m.bindTooltip(`${p.name} · ${count(p.n)}`, { direction: "top" });
      if (s) m.on("mouseover", () => m.setTooltipContent(`${p.name} · ${count(p.n)}`)).on("mouseout", () => m.setTooltipContent(p.name));
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
  // Câte neamuri din alți arbori au strămoși chiar în acest sat („Din aceleași locuri”).
  const also = useMemo(() => {
    const n = new Map<string, number>();
    for (const m of nearby.matches) for (const id of new Set(m.places.filter((c) => c.same).map((c) => c.placeId))) n.set(id, (n.get(id) ?? 0) + 1);
    return n;
  }, [nearby.matches]);
  const total = filter === "memories" ? shown.reduce((t, p) => t + p.memories.length, 0)
    : new Set(shown.flatMap((p) => p.people.filter((x) => filter === "all" || x.kind === filter).map((x) => x.id))).size;
  const counties = groups.filter((g) => shown.some((p) => p.group === g.name && p.cc === "RO")).length;
  const abroad = new Set(shown.filter((p) => p.cc && p.cc !== "RO").map((p) => p.cc)).size;

  return (
    <div className="layout">
      <div className="card">
        <div className="toolbar">
          <div className="title">{t("title", { tree: treeName })}</div>
          <Link className="btn" href={`/arbore/${treeId}`}>{t("back")}</Link>
        </div>
        <div className="toolbar">
          <div className="seg map-filter" role="group" aria-label={t("filterAria")}>
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{t("all")}</button>
            {KINDS.map((k) => <button key={k.k} aria-pressed={filter === k.k} onClick={() => setFilter(k.k)}>{t(`kind.${k.k}`)}</button>)}
            {hasMemories && <button aria-pressed={filter === "memories"} onClick={() => { if (filter !== "memories") fit(data.places.filter((p) => p.memories.length > 0)); setFilter("memories"); }}>{t("memoriesFilter")}</button>}
          </div>
          {nearHome.length > 0 && (
            <span className="actions" style={{ margin: 0 }}>
              <button className="btn" onClick={() => fit(nearHome)}>{t("homePlaces")}</button>
              <button className="btn" onClick={() => fit(shown)}>{t("wholeFamily")}</button>
            </span>
          )}
          {data.routes.length > 0 && filter !== "memories" && (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" checked={routesOn} onChange={(e) => setRoutesOn(e.target.checked)} /> {t("routes")}
            </label>
          )}
        </div>
        {picking && (
          <div className="confirm" style={{ marginBottom: 8 }}>
            {pickAt ? <>{t.rich("pinAsk", { label: picking.label, b: (c) => <b>{c}</b> })}{" "}
              <span className="actions" style={{ display: "inline-flex", marginTop: 6 }}>
                <button className="btn primary" disabled={busy} onClick={() => save(picking, { placeId: null, name: picking.label, detail: null, lat: pickAt.lat, lng: pickAt.lng })}>{busy ? t("saving") : t("pinYes")}</button>
                <button className="btn" onClick={() => setPickAt(null)}>{t("otherPoint")}</button>
                <button className="btn" onClick={() => { setPicking(null); setPickAt(null); }}>{t("cancel")}</button>
              </span></>
              : <>{t.rich("pinHelp", { label: picking.label, b: (c) => <b>{c}</b> })} <button className="btn" onClick={() => setPicking(null)}>{t("cancel")}</button></>}
          </div>
        )}
        <div ref={box} className={`mapbox${picking ? " picking" : ""}`} role="application" aria-label={t("mapAria", { tree: treeName })} />
        <div className="legend">
          <span>{shown.length ? t("legend", { places: shown.length, counties, abroad, total: count(total) }) : t("noPlaces")}</span>
          {filter === "all" && treeTotal > total && (
            <span className="muted">{[
              t("ofTree", { shown: total, all: treeTotal }),
              Object.keys(data.people).length > total ? t("noPlaceKnown", { count: Object.keys(data.people).length - total }) : "",
              treeTotal > Object.keys(data.people).length ? t("discreetLeftOut", { count: treeTotal - Object.keys(data.people).length }) : "",
            ].filter(Boolean).join(" · ")}</span>
          )}
          <span>{filter === "memories" ? t("circleMemories") : t("circlePeople")}</span>
          {filter !== "memories" && shown.some((p) => p.memories.length > 0) && <span><i className="sw" style={{ background: "transparent", border: "2.5px solid var(--plum)", borderRadius: "50%" }} />{t("placesWithMemories")}</span>}
          {routesOn && data.routes.length > 0 && filter !== "born" && filter !== "memories" && <span><i className="sw" style={{ background: "var(--ochre)", height: 4, borderRadius: 2 }} />{t("routesLegend")}</span>}
        </div>
      </div>

      <aside className="stack">
        {selected ? (
          <PlaceCard key={selected.id} place={selected} treeId={treeId} data={data} canEdit={canEdit} home={home} busy={busy} memoriesFirst={filter === "memories"}
            onBack={() => setSel(null)} onSave={save} onForget={forget} onPick={(fix) => { setPicking(fix); setPickAt(null); }} />
        ) : lostMemory ? (
          <div className="card panel">
            <button className="btn" onClick={() => setSel(null)} style={{ marginBottom: 10 }}>{t("allPlaces")}</button>
            <h2>{lostMemory.text}</h2>
            <p className="muted" style={{ fontSize: 14 }}>{canEdit ? t("unknownPlaceEdit") : t("unknownPlace")}</p>
            <div className="section-label"><i className="dot" style={{ background: "var(--plum)" }} />{t("memoriesHere", { count: lostMemory.memories.length })}</div>
            <MemoryLinks treeId={treeId} list={lostMemory.memories} />
            {canEdit && <Fixer treeId={treeId} fix={{ keys: [{ key: lostMemory.key, text: lostMemory.text, country: null }], label: lostMemory.text }} initial={lostMemory.text} country={null}
              near={home} busy={busy} onSave={save} onPick={(fix) => { setPicking(fix); setPickAt(null); }} />}
          </div>
        ) : (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>{filter === "memories" ? t("memoryPlaces") : t("familyPlaces")}</div>
            {!shown.length && <p className="muted" style={{ margin: 0 }}>{filter === "memories" ? t("noMemoryPlaces") : t("noPlacesHelp")}</p>}
            {groups.map((g) => (
              <div key={g.name} style={{ marginBottom: 10 }}>
                <div className="meta" style={{ fontWeight: 700 }}>{g.name} · {g.n}</div>
                <div className="place-list">
                  {g.places.map((p) => (
                    <button key={p.id} className="place-row" onClick={() => choose(p)}>
                      <span>{p.name}{p.how === "country" ? ` ${t("countryOnlyShort")}` : ""}{also.get(p.id) ? <small className="also" title={t("alsoTitle")}>{t("alsoCount", { count: also.get(p.id)! })}</small> : null}
                        {filter !== "memories" && p.memories.length > 0 ? <small className="mem-n" title={t("memHereTitle")}>{t("memories", { count: p.memories.length })}</small> : null}</span>
                      <span className="bar" style={{ width: Math.max(4, (60 * p.n) / most), ...(filter === "memories" ? { background: "var(--plum)" } : {}) }} />
                      <span className="n">{p.n}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {err && <div className="card"><p className="err" style={{ margin: 0 }}>{err}</p></div>}
        {filter !== "memories" && <NearbyFamilies treeId={treeId} nearby={nearby} shared={data.shared} onAll={() => setSel(null)}
          place={selected && selected.how !== "country" ? { id: selected.id, area: selected.area, name: selected.name } : null} />}
        {filter === "memories" && data.memoryMissing.some((m) => m !== lostMemory) && (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>{t("memoryMissingTitle", { count: data.memoryMissing.filter((m) => m !== lostMemory).length })}</div>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{canEdit ? t("memoryMissingEdit") : t("memoryMissingText")}</p>
            <div className="stack" style={{ gap: 12 }}>
              {data.memoryMissing.filter((m) => m !== lostMemory).map((m) => (
                <div key={m.key}>
                  <b>{m.text}</b>
                  <MemoryLinks treeId={treeId} list={m.memories} />
                  {canEdit && <Fixer treeId={treeId} fix={{ keys: [{ key: m.key, text: m.text, country: null }], label: m.text }} initial={m.text} country={null} near={home} busy={busy}
                    onSave={save} onPick={(fix) => { setPicking(fix); setPickAt(null); }} />}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.missing.length > 0 && filter !== "memories" && (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>{t("missingTitle", { count: data.missing.length })}</div>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{canEdit ? t("missingEdit") : t("missingText")}</p>
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

function PlaceCard({ place: p, treeId, data, canEdit, home, busy, memoriesFirst, onBack, onSave, onForget, onPick }: {
  place: MapPlace; treeId: string; data: TreeMap; canEdit: boolean; home: { lat: number; lng: number } | null; busy: boolean; memoriesFirst: boolean;
  onBack: () => void; onSave: (fix: Fix, s: { placeId: string | null; name: string; detail: string | null; lat: number; lng: number }) => void;
  onForget: (p: MapPlace) => void; onPick: (fix: Fix) => void;
}) {
  const t = useTranslations("Map");
  const [fixing, setFixing] = useState(false);
  const fix: Fix = { keys: p.keys, label: p.keys[0]?.text || p.name };
  const told = p.memories.length > 0 && (
    <div>
      <div className="section-label"><i className="dot" style={{ background: "var(--plum)" }} />{t("memoriesHere", { count: p.memories.length })}</div>
      <MemoryLinks treeId={treeId} list={p.memories} />
    </div>
  );
  return (
    <div className="card panel">
      <button className="btn" onClick={onBack} style={{ marginBottom: 10 }}>{t("allPlaces")}</button>
      <h2>{p.name}</h2>
      <div className="meta">{p.detail}</div>
      {p.how === "guess" && <p className="muted" style={{ fontSize: 14 }}>{t("guessText", { count: p.choices ?? 0, name: p.name })}</p>}
      {p.how === "country" && <p className="muted" style={{ fontSize: 14 }}>{t("countryText")}</p>}
      {p.keys.some((k) => !k.memory && k.text && k.text !== p.name) && <p className="muted" style={{ fontSize: 13 }}>{t("inProfiles", { list: p.keys.filter((k) => !k.memory).map((k) => t("quote", { text: k.text || k.country || "" })).join(", ") })}</p>}
      {memoriesFirst && told}
      {KINDS.map((k) => {
        const who = p.people.filter((x) => x.kind === k.k).map((x) => data.people[x.id]).filter(Boolean);
        if (!who.length) return null;
        return (
          <div key={k.k}>
            <div className="section-label"><i className="dot" style={{ background: `var(${k.color})` }} />{t(`here.${k.k}`, { count: who.length })}</div>
            <ul className="people-list">
              {who.map((x) => <li key={x.id}><Link href={`/arbore/${treeId}?p=${x.id}`}>{x.name}</Link> {x.years && <small>{x.years}</small>}</li>)}
            </ul>
          </div>
        );
      })}
      {!memoriesFirst && told}
      {canEdit && (
        <div style={{ marginTop: 14 }}>
          {p.how === "pin" ? (
            <div className="actions">
              <button className="btn" disabled={busy} onClick={() => setFixing((f) => !f)}>{t("move")}</button>
              <button className="btn" disabled={busy} onClick={() => onForget(p)}>{t("letMapFind")}</button>
            </div>
          ) : (
            <button className="btn" onClick={() => setFixing((f) => !f)}>{p.how === "guess" ? t("notThisChoose") : t("notHereMove")}</button>
          )}
          {fixing && <Fixer treeId={treeId} fix={fix} initial={p.keys[0]?.text || p.name} country={p.keys[0]?.country ?? null} near={home} busy={busy}
            sameName={p.how === "guess" ? p.keys[0] : undefined} onSave={onSave} onPick={onPick} />}
        </div>
      )}
    </div>
  );
}

/** Amintirile dintr-un loc: titlul (sau întrebarea, sau începutul) duce la amintire, în lada celui care a povestit-o. */
function MemoryLinks({ treeId, list }: { treeId: string; list: PlaceMemory[] }) {
  const t = useTranslations("Map");
  return (
    <ul className="people-list map-memories">
      {list.map((m) => (
        <li key={m.id}>
          <Link href={`/arbore/${treeId}/persoana/${m.personId}#amintire-${m.id}`}>{m.title}</Link>
          <small>{[t("toldBy", { name: m.teller }), m.when, m.audio ? t("withVoice") : null].filter(Boolean).join(" · ")}</small>
        </li>
      ))}
    </ul>
  );
}

/** Caută locul după nume (cu satele care se potrivesc) sau pune-l cu un click pe hartă. */
function Fixer({ treeId, fix, initial, country, near, busy, sameName, onSave, onPick }: {
  treeId: string; fix: Fix; initial: string; country: string | null; near: { lat: number; lng: number } | null; busy: boolean;
  sameName?: { text: string; country: string | null };
  onSave: (fix: Fix, s: { placeId: string | null; name: string; detail: string | null; lat: number; lng: number }) => void; onPick: (fix: Fix) => void;
}) {
  const t = useTranslations("Map");
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
        <button className="btn" onClick={() => setOpen(true)}>{t("search")}</button>
        <button className="btn" onClick={() => onPick(fix)}>{t("pinByHand")}</button>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("searchAria")} placeholder={t("searchPlaceholder")}
        style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 10px", background: "var(--surface)" }} />
      <div className="suggest">
        {found === null && <small className="muted">{t("searching")}</small>}
        {found?.length === 0 && <small className="muted">{t("notFound", { q })}</small>}
        {found?.map((s) => (
          <button key={s.id} disabled={busy} onClick={() => onSave(fix, { placeId: s.id, name: s.name, detail: s.detail, lat: s.lat, lng: s.lng })}>
            {s.name}<small>{s.detail}</small>
          </button>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 6 }}>
        <button className="btn" onClick={() => onPick(fix)}>{t("pinByHand")}</button>
      </div>
    </div>
  );
}

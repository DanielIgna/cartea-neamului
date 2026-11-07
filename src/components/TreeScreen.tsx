"use client";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "use-intl";
import { degreeWord, kinLabel } from "@/lib/kin-words";
import { FanChart, ClassicTree, DescendantsChart, type Side, type Slots, type DescNode } from "./charts";
import { LineageTree, DescendantFan, Hourglass, TwinTree, hourglassUp } from "./lineage-charts";
import { twinParts, lineRoot } from "@/lib/tree-layout";
import { twinForest, type Seed } from "@/lib/tree360";
import { where, type PersonView } from "@/lib/tree-data";
import { placeKey } from "@/lib/place-key";
import type { TreeLive } from "@/lib/realtime";
import { buildGraph, family, kinship, relativesByDegree, oldestAncestor, ancestorsOf, unionsOf, CLOSE_KIN_DEGREE, type Graph, type Kinship, type Rel } from "@/lib/kinship";
import InvitePanel from "./InvitePanel";
import LiveTree from "./LiveTree";
import PersonForm, { type RelKind } from "./PersonForm";
import { DocumentUpload, BiographySuggest } from "./PersonTools";
import { Album } from "./Album";
import { Avatar } from "./Avatar";
import { descendants, childrenByUnion, likelyDuplicates, sameLooking, normName, isPlaceholder, isAncestor, parentsFromSiblings, type Duplicate } from "@/lib/family";
import Duplicates, { MergeWith } from "./Duplicates";
import { setDiscreet, setParent } from "@/app/actions";
import ParentChange from "./ParentChange";
import DeletePerson from "./DeletePerson";
import SpouseChildren from "./SpouseChildren";
import SiblingsParents from "./SiblingsParents";
import RaisedBy from "./RaisedBy";
import ZoomBox from "./ZoomBox";
import PhotoPick from "./PhotoPick";
import { carerCandidates, raisedLinks, type Raised } from "@/lib/raised";
import { DATE_WORDS, lifeDates } from "@/lib/person-text";
import Tree360 from "./Tree360";
import TimesStory, { originFor } from "./TimesStory";
import { treeOrigins } from "@/app/vremuri-actions";
import type { Origin } from "@/lib/vremuri";

type Live = TreeLive & { url: string; userId: string };
type Props = {
  treeId: string; treeName: string; slots: Record<number, string>; people: Record<string, PersonView>; rels: Rel[]; raised: Raised[]; centerId: string; generations: number;
  meId: string; isEditor: boolean; isRoot: boolean; canAdd: boolean; canInvite: boolean; live: Live | null; aiEnabled: boolean; storageEnabled: boolean;
};
type View = "fan" | "classic" | "tree" | "360" | "desc" | "hour";
type Sel = { n: number } | { id: string };

/** Desenele, cu cheia numelui lor în texte (Tree.views). */
const VIEWS = [["hour", "hour"], ["fan", "fan"], ["classic", "classic"], ["tree", "tree"], ["360", "round"], ["desc", "desc"]] as const satisfies readonly [View, string][];

/** La „+ Tată”/„+ Mamă”: frații care nu au încă un asemenea părinte; la „+ Soț/soție”: copiii fără al doilea părinte. */
function shareFor(g: Graph, people: Record<string, PersonView>, id: string, k: RelKind): PersonView[] {
  const fam = family(g, id);
  const by = (ids: string[]) => ids.map((x) => people[x]).filter(Boolean);
  if (k === "father" || k === "mother") {
    const sex = k === "father" ? "M" : "F";
    return by(fam.siblings).filter((x) => !(g.parents.get(x.id) ?? []).some((pid) => people[pid]?.sex === sex));
  }
  return k === "spouse" ? by(fam.children).filter((x) => (g.parents.get(x.id) ?? []).length === 1) : [];
}

export default function TreeScreen(props: Props) {
  const { treeId, treeName, people, rels, centerId, generations, isRoot, canAdd, canInvite, live } = props;
  const t = useTranslations("Tree");
  const locale = useLocale();
  const [view, setView] = useState<View>("hour");
  const [fanDir, setFanDir] = useState<"up" | "down">("up");
  const [trunk, setTrunk] = useState<string | null>(null);
  // Copacul cu două rădăcini: null = ales singur (ambele spițe, când tata și mama au amândoi strămoși trecuți).
  const [twin, setTwin] = useState<boolean | null>(null);
  const [patRoot, setPatRoot] = useState<string | null>(null);
  const [matRoot, setMatRoot] = useState<string | null>(null);
  // Spița aleasă, a tatălui sau a mamei, rămâne aleasă și când treci de la un desen la altul (null = amândouă).
  const [side, setSide] = useState<Side | null>(null);
  const [sel, setSel] = useState<Sel>({ n: 1 });
  const [notice, setNotice] = useState<string | null>(null);
  // Desenul pe tot ecranul, cu zoom: pentru arborii mari.
  const [full, setFull] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  // Pentru „cât folosesc oamenii site-ul” (doar cu acordul lor, src/components/UsageBeat.tsx): ce desen al arborelui e deschis.
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.sectiune = `arbore-${view}`;
    el.dataset.sectiuneCale = `/arbore/${treeId}`;
    window.dispatchEvent(new Event("cn:sectiune"));
  }, [view, treeId]);
  useEffect(() => () => {
    delete document.documentElement.dataset.sectiune;
    delete document.documentElement.dataset.sectiuneCale;
  }, []);
  const go = (changes: Record<string, string | null>) => {
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) v === null ? q.delete(k) : q.set(k, v);
    router.push(q.size ? `${path}?${q}` : path);
  };
  const center = (id: string) => { setSel({ n: 1 }); go({ p: id }); };
  useEffect(() => setSel({ n: 1 }), [centerId]);
  const box = useRef<HTMLDivElement>(null);
  // Din ce ținut istoric e fiecare om (după satul nașterii), pentru povestea vremurilor. Se caută pe server, după ce se arată arborele.
  const [origins, setOrigins] = useState<Record<string, Origin> | null>(null);
  useEffect(() => {
    let live = true;
    treeOrigins(treeId).then((o) => live && setOrigins(o)).catch(() => live && setOrigins({}));
    return () => { live = false; };
  }, [treeId, people]);

  const slots: Slots = useMemo(() => Object.fromEntries(Object.entries(props.slots).map(([n, id]) => [n, people[id]]).filter(([, p]) => p)), [props.slots, people]);
  const graph = useMemo(() => buildGraph(Object.values(people), rels), [people, rels]);
  const selectedId = "id" in sel ? sel.id : props.slots[sel.n] ?? null;
  const selectedN = "n" in sel ? sel.n : Number(Object.entries(props.slots).find(([, id]) => id === sel.id)?.[0] ?? 0);
  const chartProps = { slots, selected: selectedN, onSelect: (n: number) => setSel({ n }), onCenter: center, generations };
  const ego = people[centerId];
  // Trunchiul copacului: implicit cel mai vechi strămoș din tată în tată; fiecare poate alege oricare ascendent sau chiar persoana din centru.
  const ancestors = useMemo(() => ancestorsOf(graph, centerId), [graph, centerId]);
  const egoPath = useMemo(() => new Set(ancestors.map(([id]) => id)), [ancestors]);
  const placeholder = useMemo(() => (id: string) => isPlaceholder(people[id]?.givenName ?? ""), [people]);
  const firstLine = useMemo(() => {
    const top = lineRoot(graph, centerId, placeholder), parent = (graph.parents.get(centerId) ?? []).find((p) => !placeholder(p));
    return top === centerId && parent ? lineRoot(graph, parent, placeholder) : top;
  }, [graph, centerId, placeholder]);
  const trunkId = trunk && egoPath.has(trunk) ? trunk : firstLine;
  // În desene apar soții care nu sunt discreți; copiii celor discreți pornesc doar din părintele din neam.
  const drawn = useMemo(() => (id: string) => !!people[id] && !people[id].discreet, [people]);
  const lineage = useMemo(() => descendants(graph, drawn, trunkId), [graph, drawn, trunkId]);
  const mine = useMemo(() => descendants(graph, drawn, centerId), [graph, drawn, centerId]);
  // Neamul tatălui și neamul mamei, legate prin părinți: fiecare spiță de la strămoșul ei (implicit cel mai vechi pe linia bărbătească).
  const parts = useMemo(() => twinParts(graph, drawn, centerId, patRoot, matRoot, placeholder), [graph, drawn, centerId, patRoot, matRoot, placeholder]);
  // Pornit singur doar când fiecare părinte are strămoși adevărați (un „Tată necunoscut” fără părinți nu face o spiță).
  const bothSides = !!parts && lineRoot(graph, parts.father, placeholder) !== parts.father && lineRoot(graph, parts.mother, placeholder) !== parts.mother;
  const twinOn = (view === "tree" || view === "360") && !!parts && (twin ?? bothSides);
  const twinKey = twinOn && parts ? `${parts.patRoot}+${parts.matRoot}` : "";
  // Neamul cuiva poartă numele cu care s-a născut (o femeie măritată își duce mai departe neamul de fată).
  const sur = (id: string) => people[id]?.birthSurname?.trim() || people[id]?.surname || "";
  const twinTitle = parts && sur(parts.patRoot) && sur(parts.matRoot) && sur(parts.patRoot) !== sur(parts.matRoot)
    ? t("twinTitleNames", { a: sur(parts.patRoot), b: sur(parts.matRoot) }) : t("twinTitle", { name: ego?.givenName ?? "" });
  // „Spița Igna” / „Spița Todea”: o singură spiță. În Copac, trunchiul ei pornește de la strămoșul ei și coboară prin părintele acela
  // până la persoana din centru; în Clasic, Evantai și Clepsidră se desenează doar strămoșii de pe ea.
  const ancestorView = view === "classic" || view === "hour" || (view === "fan" && fanDir === "up");
  const lineOf = (who: Side) => props.slots[who === "father" ? 2 : 3] as string | undefined;
  const sidesKnown = !!lineOf("father") && !!lineOf("mother");
  const shownSide = ancestorView && sidesKnown ? side : null;
  const rootOf = (who: Side) => {
    if (parts) return who === "father" ? parts.patRoot : parts.matRoot;
    const x = lineOf(who), own = who === "father" ? patRoot : matRoot;
    return !x ? null : own && (own === x || isAncestor(graph, own, x)) ? own : lineRoot(graph, x, placeholder);
  };
  const roots = { father: rootOf("father"), mother: rootOf("mother") };
  const named = !!roots.father && !!roots.mother && !!sur(roots.father) && !!sur(roots.mother) && sur(roots.father) !== sur(roots.mother);
  const sideName = (who: Side) => (named ? t("lineOf", { surname: sur(roots[who]!) }) : who === "father" ? t("lineFather") : t("lineMother"));
  const onLine = (who: Side) => { const x = parts?.[who] ?? lineOf(who); return !!x && !twinOn && (trunkId === x || isAncestor(graph, trunkId, x)); };
  // În Copac butonul apăsat arată ce e desenat; în celelalte desene, spița aleasă.
  const treeLike = view === "tree" || view === "360";
  const pressed = (who: Side | null) => (view === "360" ? (who ? !twinOn && (side === who || (side === null && onLine(who))) : twinOn)
    : treeLike ? (who ? onLine(who) : twinOn) : side === who);
  const chooseSide = (who: Side | null) => {
    setSide(who);
    if (!who) setTwin(true);
    else if (sidesKnown) { setTwin(false); setTrunk(rootOf(who)); }
  };
  // De la ce strămoș pornește fiecare spiță e alegerea fiecăruia: o ținem minte pentru cine se uită, de la persoana din centru.
  const picksKey = `spite:${treeId}:${props.meId}:${centerId}`;
  const picksLoaded = useRef<string | null>(null);
  useEffect(() => {
    if (picksLoaded.current !== picksKey) return;
    try {
      if (trunk || patRoot || matRoot || twin !== null || side) localStorage.setItem(picksKey, JSON.stringify({ trunk, patRoot, matRoot, twin, side }));
      else localStorage.removeItem(picksKey);
    } catch { /* fără localStorage rămâne alegerea doar până la închiderea paginii */ }
  }, [picksKey, trunk, patRoot, matRoot, twin, side]);
  useEffect(() => {
    let saved: { trunk?: string | null; patRoot?: string | null; matRoot?: string | null; twin?: boolean | null; side?: Side | null } = {};
    try { saved = JSON.parse(localStorage.getItem(picksKey) ?? "{}") ?? {}; } catch { /* alegerile implicite */ }
    setTrunk(saved.trunk ?? null); setPatRoot(saved.patRoot ?? null); setMatRoot(saved.matRoot ?? null); setTwin(saved.twin ?? null); setSide(saved.side ?? null);
    picksLoaded.current = picksKey;
  }, [picksKey]);
  const resetPicks = () => { setTrunk(null); setPatRoot(null); setMatRoot(null); setTwin(null); setSide(null); };
  /** Pe ce spiță e un strămoș al persoanei din centru (null pentru ea însăși). */
  const sideOfAncestor = (id: string): Side | null =>
    (["father", "mother"] as const).find((who) => { const x = lineOf(who); return !!x && (id === x || isAncestor(graph, id, x)); }) ?? null;
  const line = shownSide ?? "both";
  // Fișe care par aceeași persoană trecută de două ori (doar proprietarul și editorii le pot uni).
  const pairs = useMemo(() => (props.isEditor ? likelyDuplicates(graph, people) : []), [graph, people, props.isEditor]);
  // Unde se rupe o spiță: părintele fără părinți (spița se oprește la el), ori fără tată când tatăl lui pare să fie deja în arbore.
  const cut = useMemo(() => {
    const discreetOf = (id: string) => !!people[id]?.discreet;
    return (["father", "mother"] as const).flatMap((who) => {
      const start = parts?.[who] ?? props.slots[who === "father" ? 2 : 3];
      if (!start) return [];
      const top = lineRoot(graph, start, placeholder), x = people[top];
      if (!x) return [];
      const found = parentsFromSiblings(graph, x.id, placeholder, discreetOf).length > 0 || pairs.some((d) => d.keep === x.id || d.drop === x.id);
      const hasParents = (graph.parents.get(x.id) ?? []).some((q) => !placeholder(q));
      return top === start || found || hasParents ? [{ who, x, stops: !hasParents, found }] : [];
    });
  }, [parts, props.slots, people, graph, placeholder, pairs]);
  // Doi tați (sau două mame) trecuți la același strămoș, ori un părinte fără sex ales: desenul nu știe pe ce parte să-i pună,
  // așa că spunem pe față, cu fișele de deschis, în loc să se încurce spițele pe tăcute.
  const mixups = useMemo(() => {
    const out: { child: PersonView; who: PersonView[]; kind: "M" | "F" | "U" }[] = [];
    for (const id of new Set(Object.values(props.slots))) {
      const ps = (graph.parents.get(id) ?? []).map((x) => people[x]).filter((x): x is PersonView => !!x && !isPlaceholder(x.givenName));
      const kind = (["M", "F", "U"] as const).find((k) => ps.filter((x) => x.sex === k).length > (k === "U" ? 0 : 1));
      if (kind && people[id]) out.push({ child: people[id], who: ps.filter((x) => x.sex === kind), kind });
    }
    return out.slice(0, 3);
  }, [props.slots, graph, people]);
  // Desenele mari se derulează: pornim cu persoana din centru la vedere, nu cu colțul gol din stânga sus.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = view === "desc" ? 0 : view === "tree" || view === "hour" ? (view === "tree" ? el.scrollHeight : (el.scrollHeight - el.clientHeight) / 2) : (el.scrollHeight - el.clientHeight) * (view === "fan" ? 0.75 : 0.5);
    // În copacul cu două rădăcini, la vedere stă locul unde se unesc cele două trunchiuri: căsătoria părinților.
    // La cadrul următor, după ce desenul și-a luat mărimea (zoom-ul se potrivește din nou la fiecare desen nou).
    const frame = requestAnimationFrame(() => {
      const focus = el.querySelector("[data-focus]");
      if (!focus) return;
      const r = focus.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.scrollLeft += r.left + r.width / 2 - (b.left + el.clientWidth / 2);
      el.scrollTop += r.top + r.height / 2 - (b.top + el.clientHeight * 0.4);
    });
    return () => cancelAnimationFrame(frame);
  }, [view, generations, centerId, fanDir, trunk, twinKey, shownSide]);
  // Copacul 360°: amândouă spițele, fiecare pe jumătatea ei de cerc, sau spița aleasă. Spița aleasă pornește sigur de la
  // strămoșul ei (rădăcina din twinParts, care ține cont de tatăl trecut de două ori), chiar dacă trunchiul a rămas pe altă linie.
  const seeds360 = useMemo((): { seeds: Seed[]; links: [string, string][] } => {
    if (view !== "360") return { seeds: [{ node: lineage, depth: 0 }], links: [] };
    if (twinOn && parts) return twinForest(parts);
    const want = parts && side ? (side === "father" ? parts.patRoot : parts.matRoot) : null;
    const onWanted = !!want && !!parts && (trunkId === parts[side!] || isAncestor(graph, trunkId, parts[side!]));
    return { seeds: [{ node: want && !onWanted ? descendants(graph, drawn, want) : lineage, depth: 0 }], links: [] };
  }, [view, twinOn, parts, side, trunkId, graph, drawn, lineage]);
  const originOf = (id: string) => originFor(id, graph, origins ?? {}, people);
  const showsLineage = view === "tree" || view === "360" || view === "desc" || (view === "fan" && fanDir === "down");
  const kidsCount = (id: string) => graph.children.get(id)?.length ?? 0;
  const merged = (msg: string, keptId: string) => { setNotice(msg); setSel({ id: keptId }); router.refresh(); };
  const lineageProps = { root: lineage, people, selectedId, egoPath, onSelectPerson: (id: string) => setSel({ id }), onCenter: center };
  /** „Ion Igna, cca. 1870 · gen. 5” în listele de strămoși. */
  const ancestorOption = (x: PersonView, gen: number) => [x.name, x.birthYear ? `, ${x.approx ? DATE_WORDS[locale].approx : ""}${x.birthYear}` : "", " · ", t("genShort", { gen })].join("");

  return (
    <section className="layout">
      <div className="stack">
        <div className={`card${full ? " chart-full" : ""}`}>
          <div className="toolbar">
            <div className="title">{view === "hour" ? t("titleHour", { name: ego?.name ?? "", line }) : twinOn ? twinTitle : showsLineage ? t("titleDescendants", { name: people[trunkId]?.name ?? "" }) : t("titleAncestors", { name: ego?.name ?? "", line })}</div>
            <div className="seg seg-wrap" role="group" aria-label={t("viewsLabel")}>
              {VIEWS.map(([v, key]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{t(`views.${key}`)}</button>)}
            </div>
            {view === "fan" && (
              <div className="seg" role="group" aria-label={t("directionLabel")}>
                <button aria-pressed={fanDir === "up"} onClick={() => setFanDir("up")}>{t("ancestors")}</button>
                <button aria-pressed={fanDir === "down"} onClick={() => setFanDir("down")}>{t("descendants")}</button>
              </div>
            )}
            {(treeLike || ancestorView) && sidesKnown && (
              <div className="seg seg-wrap" role="group" aria-label={t("linesLabel")}>
                <button aria-pressed={pressed("father")} onClick={() => chooseSide("father")}>{sideName("father")}</button>
                <button aria-pressed={pressed("mother")} onClick={() => chooseSide("mother")}>{sideName("mother")}</button>
                {(!treeLike || !!parts) && <button aria-pressed={pressed(null)} onClick={() => chooseSide(null)}>{t("both")}</button>}
              </div>
            )}
            {twinOn && parts && ([["father", setPatRoot], ["mother", setMatRoot]] as const).map(([who, set]) => (
              <label key={who} className="gen-select">{who === "father" ? t("fatherRootFrom") : t("motherRootFrom")}
                <select value={who === "father" ? parts.patRoot : parts.matRoot} onChange={(e) => set(e.target.value)}>
                  {ancestorsOf(graph, parts[who]).map(([id, gen]) => people[id] && (
                    <option key={id} value={id}>{gen === 0 ? t("rootSelf", { name: people[id].name, who }) : ancestorOption(people[id], gen + 1)}</option>
                  ))}
                </select>
              </label>
            ))}
            {showsLineage && !twinOn && (
              <label className="gen-select">{t("trunk")}
                <select value={trunkId} onChange={(e) => {
                  const id = e.target.value, on = sideOfAncestor(id);
                  setTrunk(id); setSide(on);
                  if (on === "father") setPatRoot(id); else if (on === "mother") setMatRoot(id);
                }}>
                  {ancestors.map(([id, gen]) => people[id] && (
                    <option key={id} value={id}>{gen === 0 ? t("trunkSelf", { name: people[id].name }) : ancestorOption(people[id], gen)}</option>
                  ))}
                </select>
              </label>
            )}
            {(patRoot || matRoot) && <button className="btn" onClick={resetPicks}>{t("resetLines")}</button>}
            {!showsLineage && view !== "hour" && (
              <label className="gen-select">{t("generations")}
                <select value={generations} onChange={(e) => go({ g: e.target.value })}>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((g) => <option key={g} value={g}>{g >= 8 ? t("generationsOld", { count: g }) : g}</option>)}
                </select>
              </label>
            )}
            {!isRoot && <button className="btn" onClick={() => go({ p: null })}>{t("backToMe")}</button>}
            {live && <LiveTree key={live.sealedQuery.queryFingerprint} url={live.url} treeId={treeId} userId={live.userId} sealedQuery={live.sealedQuery} initialData={live.initialData} />}
          </div>
          {view === "360" ? (
            <Tree360 seeds={seeds360.seeds} links={seeds360.links} people={people} selectedId={selectedId} egoPath={egoPath} onSelectPerson={(id) => setSel({ id })} onCenter={center} originOf={originOf} />
          ) : <ZoomBox boxRef={box} resetKey={`${view}|${fanDir}|${generations}|${centerId}|${trunkId}|${twinKey}|${shownSide}`} full={full} onFull={setFull}>
            {view === "fan" && fanDir === "up" && <FanChart {...chartProps} side={shownSide} />}
            {view === "fan" && fanDir === "down" && <DescendantFan {...lineageProps} />}
            {view === "classic" && <ClassicTree {...chartProps} side={shownSide} />}
            {view === "tree" && (twinOn && parts
              ? <TwinTree parts={parts} people={people} selectedId={selectedId} egoPath={egoPath} onSelectPerson={(id) => setSel({ id })} onCenter={center} />
              : <LineageTree {...lineageProps} />)}
            {view === "hour" && <Hourglass slots={slots} generations={generations} down={mine} people={people} selectedId={selectedId}
              onSelectPerson={(id) => setSel({ id })} onSelectSlot={(n) => setSel({ n })} onCenter={center} side={shownSide} />}
            {view === "desc" && <DescendantsChart root={lineage} people={people} selectedId={selectedId} onSelectPerson={(id) => setSel({ id })} onCenter={center} />}
          </ZoomBox>}
          {full && selectedId && people[selectedId] && (
            <div className="full-sel">
              <span><b>{people[selectedId].name}</b> <span className="muted">{lifeDates(people[selectedId], locale)}</span></span>
              <button className="btn" onClick={() => { setFull(false); requestAnimationFrame(() => document.querySelector("aside.panel")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{t("seeCard")}</button>
              {selectedId !== centerId && <button className="btn" onClick={() => center(selectedId)}>{t("putInCentre")}</button>}
            </div>
          )}
          <div className="legend">
            {view === "360" ? (
              <>
                <span><i className="sw" style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent)" }} />{t("legendPathTo", { name: ego?.givenName ?? "" })}</span>
                {twinOn && <span><i className="sw" style={{ border: "2px dashed var(--ochre)" }} />{t("legend360Twin")}</span>}
                <span>{t("legend360Help")}</span>
              </>
            ) : view === "desc" ? (
              <>
                <span><i className="sw" style={{ background: "var(--desc)" }} />{t("legendDescendant")}</span>
                <span><i className="sw" style={{ border: "1.5px dashed var(--line)" }} />⚭ {t("legendSpouse")}</span>
                <span>{t("legendDescHelp")}</span>
              </>
            ) : view === "hour" ? (
              <>
                {shownSide !== "mother" && <span><i className="sw" style={{ background: "var(--pat-1)" }} />{t("legendFatherLine")}</span>}
                {shownSide !== "father" && <span><i className="sw" style={{ background: "var(--mat-1)" }} />{t("legendMotherLine")}</span>}
                <span><i className="sw" style={{ background: "var(--desc)" }} />{t("descendants")}</span>
                <span>{t("legendHourUp", { count: hourglassUp(generations, shownSide) })}</span>
              </>
            ) : twinOn ? (
              <>
                <span><i className="sw" style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent)" }} />{t("legendTwinRoots", { name: ego?.givenName ?? "" })}</span>
                <span>{t("legendTwinHelp")}</span>
              </>
            ) : showsLineage ? (
              <>
                <span><i className="sw" style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent)" }} />{t("legendPathTo", { name: ego?.givenName ?? "" })}</span>
                <span>{view === "tree" ? t("legendTreeHelp") : t("legendFanDownHelp")}</span>
              </>
            ) : (
              <>
                {shownSide !== "mother" && <span><i className="sw" style={{ background: "var(--pat-1)" }} />{t("legendFatherLine")}</span>}
                {shownSide !== "father" && <span><i className="sw" style={{ background: "var(--mat-1)" }} />{t("legendMotherLine")}</span>}
                <span><i className="sw" style={{ border: "1.5px dashed var(--muted)" }} />{t("legendEmpty")}</span>
              </>
            )}
            {view !== "360" && <span>{t("legendHowTo")}</span>}
          </div>
          {/* O spiță care se oprește la părinte, sau îi lipsește tatăl: de obicei părinții lui au fost legați doar de frații lui, ori e trecut de două ori. */}
          {treeLike && cut.map(({ who, x, stops, found }) => {
            const v = { name: x.givenName, sex: x.sex, side: who, stops: stops ? "yes" : "no" };
            const open = (chunks: React.ReactNode) => <button className="linklike" onClick={() => setSel({ id: x.id })}>{chunks}</button>;
            return (
              <p key={who} className="notice" style={{ margin: "10px 0 0" }}>
                {stops ? t("cutStops", v) : t("cutNoFather", v)}{" "}
                {found ? t.rich("cutFound", { ...v, open }) : t.rich("cutOpen", { ...v, open })}
              </p>
            );
          })}
          {view !== "desc" && mixups.map(({ child, who, kind }) => {
            const names = () => who.map((x, i) => (
              <span key={x.id}>{i === 0 ? "" : i === who.length - 1 ? ` ${t("and")} ` : ", "}<button className="linklike" onClick={() => setSel({ id: x.id })}>{x.name}</button></span>
            ));
            return (
              <p key={`${child.id}-${kind}`} className="notice" style={{ margin: "10px 0 0" }}>
                {t.rich(kind === "M" ? "mixTwoFathers" : kind === "F" ? "mixTwoMothers" : "mixNoSex", { child: child.givenName, names })}
              </p>
            );
          })}
        </div>
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="title" style={{ fontSize: 17 }}>{t("treeCount", { tree: treeName, count: Object.keys(people).length })}</div>
            {/* Legătură obișnuită, nu <Link>: cartea se așază pe pagini într-un document proaspăt. */}
            <a className="btn primary" href={`/arbore/${treeId}/carte?p=${centerId}`}>{t("book")}</a>
            <Link className="btn" href={`/arbore/${treeId}/harta`}>{t("map")}</Link>
            <Link className="btn" href={`/arbore/${treeId}/cronologie`}>{t("timeline")}</Link>
            <Link className="btn" href={`/arbore/${treeId}/calatorie?p=${centerId}`}>{t("journey")}</Link>
            <Link className="btn" href="/istoria-bisericii">{t("churchHistory")}</Link>
            <a className="btn" href={`/api/arbore/${treeId}/gedcom`}>{t("exportGedcom")}</a>
          </div>
        </div>
        {notice && <div className="card"><p style={{ margin: 0 }}>{notice}</p></div>}
        {pairs.length > 0 && <Duplicates treeId={treeId} pairs={pairs} people={people} kids={kidsCount} onDone={merged} />}
        {ego && <KinByDegree graph={graph} people={people} ego={ego} onSelect={(id) => setSel({ id })} />}
        {canInvite && (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>{t("inviteRelative")}</div>
            <InvitePanel treeId={treeId} />
          </div>
        )}
      </div>
      <aside className="card panel" aria-live="polite">
        {selectedId && people[selectedId]
          ? <PersonPanel key={selectedId} p={people[selectedId]} {...props} origin={originOf(selectedId)} originsLoading={origins === null} graph={graph} ego={ego} pairs={pairs} onMerged={merged} onSelect={(id) => setSel({ id })} onCenter={center} onChanged={() => router.refresh()} />
          : canAdd && "n" in sel && slots[Math.floor(sel.n / 2)]
            ? <PersonForm key={sel.n} mode="add" kind={sel.n % 2 === 0 ? "father" : "mother"} treeId={treeId} anchor={slots[Math.floor(sel.n / 2)]}
                shareWith={shareFor(graph, people, slots[Math.floor(sel.n / 2)].id, sel.n % 2 === 0 ? "father" : "mother")} onDone={() => router.refresh()} />
            : <p className="muted">{canAdd ? t("pickPerson") : t("viewerOnly")}</p>}
      </aside>
    </section>
  );
}

type PanelProps = Props & {
  p: PersonView; graph: Graph; ego?: PersonView; pairs: Duplicate[]; origin: Origin | null; originsLoading: boolean;
  onSelect: (id: string) => void; onCenter: (id: string) => void; onChanged: () => void; onMerged: (msg: string, keptId: string) => void;
};

/** Pentru „Unește cu altă fișă”: oamenii de același sex care nu sunt rude directe cu persoana, întâi cei care arată la fel, apoi cei cu aceeași inițială. */
function mergeCandidates(g: Graph, people: Record<string, PersonView>, p: PersonView): PersonView[] {
  const skip = new Set<string>([p.id, ...(g.partners.get(p.id) ?? [])]);
  for (const [dir, start] of [[g.parents, p.id], [g.children, p.id]] as const)
    for (let frontier = [start]; frontier.length; ) {
      const next: string[] = [];
      for (const x of frontier) for (const y of dir.get(x) ?? []) if (!skip.has(y)) { skip.add(y); next.push(y); }
      frontier = next;
    }
  const first = normName(p.givenName)[0];
  const rank = (x: PersonView) => (sameLooking(p, x) ? 0 : normName(x.givenName)[0] === first ? 1 : 2);
  return Object.values(people).filter((x) => !skip.has(x.id) && (x.sex === p.sex || x.sex === "U" || p.sex === "U"))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function PersonPanel({ p, graph, ego, people, raised, treeId, meId, isEditor, canInvite, canAdd, aiEnabled, storageEnabled, pairs, origin, originsLoading, onSelect, onCenter, onChanged, onMerged }: PanelProps) {
  const t = useTranslations("Person");
  const locale = useLocale();
  const [form, setForm] = useState<"edit" | RelKind | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [toggling, startToggle] = useTransition();
  const fam = family(graph, p.id);
  const kin = ego && ego.id !== p.id ? kinship(graph, ego.id, p.id) : null;
  const canEdit = isEditor || (canAdd && (p.createdBy === meId || p.claimedBy === meId));
  const by = (ids: string[]) => ids.map((id) => people[id]).filter(Boolean);
  const hasFather = fam.parents.some((id) => people[id]?.sex === "M"), hasMother = fam.parents.some((id) => people[id]?.sex === "F");
  const father = by(fam.parents).find((x) => x.sex === "M"), mother = by(fam.parents).find((x) => x.sex === "F");
  // Pentru „Schimbă mama”: soțiile tatălui (și invers), ca să alegi mama copiilor din altă căsătorie.
  const partnersOf = (x: PersonView | undefined, sex: "M" | "F") => (x ? by(graph.partners.get(x.id) ?? []).filter((y) => y.sex === sex) : []);
  const finished = (msg: string) => { setForm(null); setDone(msg); onChanged(); };
  // Soții în ordinea căsătoriilor; cei discreți nu se numesc aici, copiii lor apar „din altă relație”.
  const drawn = (id: string) => !!people[id] && !people[id].discreet;
  const spouseIds = unionsOf(graph, p.id).map((u) => u.spouse).filter((s): s is string => !!s && !!people[s]);
  const shownSpouses = by(spouseIds.filter(drawn));
  const kidsBy = childrenByUnion(graph, drawn, p.id);
  // „A crescut-o”: cine l-a crescut pe lângă părinți (mama vitregă, bunicii) și pe cine a crescut el.
  const rl = raisedLinks(graph, raised, p.id);
  const raisedFor = () => {
    const c = carerCandidates(graph, p.id, drawn);
    const step = c.step.map((id) => ({ p: people[id], via: by(fam.parents).find((par) => (graph.partners.get(par.id) ?? []).includes(id))! })).filter((s) => s.p && s.via);
    const near = new Set([...c.step, ...c.grand, ...c.aunts]);
    const skip = new Set([p.id, ...fam.parents, ...rl.carers]);
    const others = Object.values(people).filter((x) => !near.has(x.id) && !skip.has(x.id) && !x.discreet).sort((a, b) => a.name.localeCompare(b.name));
    return { step, family: by([...c.grand, ...c.aunts].filter((x) => !skip.has(x))), others };
  };
  // Pentru „+ Copil”: întâi soțul/soția de acum (ultima căsătorie desenată), apoi ceilalți.
  const childPartners = [...by(spouseIds.filter(drawn)).reverse(), ...by(spouseIds.filter((s) => !drawn(s))).reverse()];
  // O mamă (un tată) nouă, adăugată ca persoană nouă lângă un tată (o mamă) care are deja soție (soț) în desen, e dintr-o altă relație: o propunem discretă.
  // (Soția de acum se alege din „Schimbă mama”, nu se adaugă din nou.)
  const discreetFor = (k: RelKind) => {
    const op = k === "mother" ? father : k === "father" ? mother : undefined;
    return !!op && (graph.partners.get(op.id) ?? []).some((sp) => drawn(sp) && sp !== p.id);
  };
  const half = (x: PersonView) => {
    const mine = graph.parents.get(p.id) ?? [], theirs = graph.parents.get(x.id) ?? [], shared = mine.filter((y) => theirs.includes(y));
    if (mine.length !== 2 || theirs.length !== 2 || shared.length !== 1) return "";
    return t("halfVia", { via: people[shared[0]]?.sex ?? "U" });
  };
  // Cine ar putea fi deja în arbore când adaugi o rudă: soțiile tatălui (mamele fraților) la „+ Mamă”, soții la „+ Soț”, copiii la „+ Copil”, frații la „+ Frate”.
  const lookalikesFor = (k: RelKind): PersonView[] => {
    if (k === "mother" || k === "father") {
      const ids = new Set<string>();
      for (const par of fam.parents) for (const c of [...(graph.partners.get(par) ?? []), ...(graph.children.get(par) ?? []).flatMap((x) => graph.parents.get(x) ?? [])]) ids.add(c);
      for (const sib of fam.siblings) for (const pp of graph.parents.get(sib) ?? []) ids.add(pp);
      return by([...ids]).filter((x) => x.sex === (k === "mother" ? "F" : "M") && !fam.parents.includes(x.id) && x.id !== p.id);
    }
    if (k === "spouse") return by([...new Set([...fam.partners, ...fam.children.flatMap((c) => graph.parents.get(c) ?? [])])].filter((x) => x !== p.id));
    return by(k === "child" ? fam.children : fam.siblings);
  };
  const useExistingFor = (k: RelKind) => (k === "mother" || k === "father")
    ? async (x: PersonView) => (await setParent(treeId, p.id, k, x.id)).error ?? null
    : undefined;
  const toggleDiscreet = () => startToggle(async () => {
    const r = await setDiscreet(treeId, p.id, !p.discreet);
    if (r.error) setDone(r.error);
    else finished(p.discreet ? t("discreetOff", { name: p.givenName }) : t("discreetOn", { name: p.givenName, sex: p.sex }));
  });

  if (form) {
    return form === "edit"
      ? <PersonForm mode="edit" treeId={treeId} person={p} onDone={() => finished(t("saved"))} onCancel={() => setForm(null)} />
      : <PersonForm mode="add" kind={form} treeId={treeId} anchor={p} partners={childPartners} shareWith={shareFor(graph, people, p.id, form)} discreet={discreetFor(form)}
          lookalikes={lookalikesFor(form)} useExisting={useExistingFor(form)}
          onDone={(msg) => finished(msg ?? t("added"))} onCancel={() => setForm(null)} />;
  }

  const group = (label: string, list: PersonView[], note?: (x: PersonView, i: number) => string) => list.length > 0 && (
    <div key={label} style={{ display: "contents" }}><dt>{label}</dt><dd>{list.map((x, i) => {
      const n = note?.(x, i);
      return <button key={x.id} onClick={() => onSelect(x.id)}>{x.name}{x.birthYear ? ` (${x.birthYear})` : ""}{n ? ` · ${n}` : ""}</button>;
    })}</dd></div>
  );

  return (
    <>
      <div className="section-label" style={{ marginTop: 0 }}>{t("cardTitle")}</div>
      <div className="person-head">
        <Avatar p={p} size={72} />
        <div>
          <h2>{p.name}</h2>
          <div className="meta">{p.birthSurname ? `${t("bornAs", { sex: p.sex, surname: p.birthSurname })} · ` : ""}{lifeDates(p, locale)}</div>
          <Link href={`/arbore/${treeId}/persoana/${p.id}`} style={{ fontSize: 14 }}>{p.living ? t("openProfileLiving") : t("openProfile")}</Link>
          {storageEnabled && (canEdit || (canAdd && !p.photoId)) && (
            <div style={{ fontSize: 14 }}><PhotoPick key={p.id} treeId={treeId} p={p} onDone={() => { setDone(t("photoSet", { name: p.givenName })); onChanged(); }} /></div>
          )}
        </div>
      </div>
      <div className="chips">
        {p.living ? <span className="chip priv">{t("chipLiving")}</span> : <span className="chip">{t("chipDeceased", { sex: p.sex })}</span>}
        {p.claimed && <span className="chip ok">{t("chipClaimed")}</span>}
        {p.approx && <span className="chip">{t("chipApprox")}</span>}
        {p.discreet && <span className="chip">{t("chipDiscreet", { sex: p.sex })}</span>}
        {canEdit && fam.partners.length > 0 && (p.discreet || fam.children.length > 0) && (
          <button className="linklike" style={{ fontSize: 13 }} disabled={toggling} onClick={toggleDiscreet}
            title={p.discreet ? t("showAgainTitle") : t("hideTitle")}>
            {p.discreet ? t("showAgain") : t("hide")}
          </button>
        )}
      </div>
      {kin && ego && (
        <div className="kin">
          {t.rich("kinFor", { name: ego.givenName, kin: kinLabel(kin.term, kin.sex, locale), b: (c) => <b>{c}</b> })}
          {kin.degree ? ` · ${t("kinDegree", { degree: degreeWord(kin.degree, locale) })}` : kin.degree === null ? ` · ${t("kinAffinity")}` : ""}
          {kin.degree !== null && kin.degree > CLOSE_KIN_DEGREE && ` · ${t("kinBeyondSeventh")}`}
          {kin.ancestor && kin.up > 0 && kin.down > 0 && people[kin.ancestor] && (
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {t("commonAncestor")} <button className="linklike" onClick={() => onSelect(kin.ancestor!)}>{people[kin.ancestor].name}</button>
              {people[kin.ancestor].birthPlace ? `, ${t("fromPlace", { place: people[kin.ancestor].birthPlace! })}` : ""}{people[kin.ancestor].birthYear ? `, ${t("bornYear", { year: String(people[kin.ancestor].birthYear), sex: people[kin.ancestor].sex })}` : ""}
            </div>
          )}
        </div>
      )}
      {!kin && ego && ego.id !== p.id && <div className="kin">{t("noKin", { name: ego.givenName })}</div>}
      <dl className="facts" style={{ marginTop: 10 }}>
        {(() => {
          // Locul duce pe harta neamului, la satul acela, cu toți cei de acolo.
          const place = (text: string | null, country: string | null, fallback = "") => {
            const w = where(text, country) || fallback, k = placeKey(text, country);
            return w && k ? <Link href={`/arbore/${treeId}/harta?loc=${encodeURIComponent(k)}`} title={t("placeOnMap")}>{w}</Link> : w;
          };
          const fact = (date: string | null, pl: React.ReactNode) => (date || pl ? <>{date}{date && pl ? ", " : ""}{pl}</> : null);
          const born = fact(p.birthText, place(p.birthPlace, p.birthCountry));
          const died = fact(p.deathText, place(p.deathPlace, p.deathCountry));
          const lives = p.living ? place(p.residencePlace, p.residenceCountry, p.residenceCountry ?? "") : null;
          return <>{born && <><dt>{t("born", { sex: p.sex })}</dt><dd>{born}</dd></>}{died && <><dt>{t("died", { sex: p.sex })}</dt><dd>{died}</dd></>}{lives && <><dt>{t("livesIn")}</dt><dd>{lives}</dd></>}</>;
        })()}
        {p.occupation && <><dt>{t("occupation")}</dt><dd>{p.occupation}</dd></>}
      </dl>
      <div className="section-label">{t("whatWeKnow", { name: p.givenName })}</div>
      {p.biography ? <p className="bio">{p.biography}</p> : <p className="muted" style={{ margin: 0, fontSize: 14 }}>{canEdit ? t("nothingYetEdit") : t("nothingYet")}</p>}
      {p.notes && <><div className="section-label">{t("notes")}</div><p className="notes">{p.notes}</p></>}
      <TimesStory p={p} origin={origin} loading={originsLoading} />
      <div className="actions">
        {canEdit && <button className="btn primary" onClick={() => setForm("edit")}>{t("edit")}</button>}
        {ego?.id !== p.id && <button className="btn" onClick={() => onCenter(p.id)}>{t("putInCentre")}</button>}
        {(isEditor || (canAdd && p.createdBy === meId)) && (!p.claimed || p.claimedBy === meId) && ego?.id !== p.id &&
          <DeletePerson key={`del${p.id}`} treeId={treeId} p={p} onDeleted={() => { onSelect(ego?.id ?? p.id); finished(t("deleted", { name: p.name, sex: p.sex })); }} />}
        {isEditor && <MergeWith key={`mg${p.id}`} treeId={treeId} p={p} candidates={mergeCandidates(graph, people, p)} onDone={onMerged} />}
      </div>
      {done && <p className="muted" style={{ fontSize: 14 }}>{done}</p>}
      {aiEnabled && canAdd && !p.living && <BiographySuggest key={`bio-${p.id}`} treeId={treeId} personId={p.id} canSave={isEditor} onSaved={onChanged} />}

      <div className="section-label">{t("relatives")}</div>
      <dl className="rel-group rel">
        {group(t("parents"), by(fam.parents))}
        {group(t("raisedBy", { sex: p.sex }), by(rl.carers))}
        {group(t("spouses", { count: shownSpouses.length, sex: p.sex }), shownSpouses,
          shownSpouses.length > 1 ? (_, i) => t("marriageNth", { n: i + 1 }) : undefined)}
        {kidsBy.named.length > 0
          ? <>
              {kidsBy.named.map((u) => group(t("childrenWith", { name: people[u.spouse]?.givenName ?? "", count: u.children.length }), by(u.children)))}
              {group(t("otherRelation", { count: kidsBy.other.length }), by(kidsBy.other))}
            </>
          : group(t("children", { count: fam.children.length }), by(kidsBy.other))}
        {group(fam.children.length ? t("raisedAlso") : t("raised"), by(rl.raised))}
        {group(t("siblings", { count: fam.siblings.length }), by(fam.siblings), half)}
      </dl>
      {canAdd && parentsFromSiblings(graph, p.id, (id) => isPlaceholder(people[id]?.givenName ?? ""), (id) => !!people[id]?.discreet).map((s) => people[s.id] && (
        <SiblingsParents key={`sp${p.id}${s.role}`} treeId={treeId} p={p} role={s.role} parent={people[s.id]} current={s.current ? people[s.current] : undefined}
          alsoFor={s.current ? by((graph.children.get(s.current) ?? []).filter((c) => c !== p.id)) : []} onDone={finished} />
      ))}
      {canAdd && by(fam.partners).map((sp) => {
        // Copiii soțului/soției care au un singur părinte trecut: propunem să fie și ai acestei persoane.
        const kids = by(graph.children.get(sp.id) ?? []).filter((c) => (graph.parents.get(c.id) ?? []).length === 1 && c.id !== p.id);
        return kids.length > 0 && <SpouseChildren key={`sc${sp.id}`} treeId={treeId} p={p} spouse={sp} kids={kids} onDone={finished} />;
      })}
      {!fam.parents.length && !fam.partners.length && !fam.children.length && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t("noRelatives")}</p>}
      {isEditor && <Duplicates inline treeId={treeId} pairs={pairs.filter((d) => d.keep === p.id || d.drop === p.id)} people={people}
        kids={(id) => graph.children.get(id)?.length ?? 0} onDone={onMerged} />}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {!hasFather && <button className="btn" onClick={() => setForm("father")}>+ {t("addFather")}</button>}
          {!hasMother && <button className="btn" onClick={() => setForm("mother")}>+ {t("addMother")}</button>}
          <button className="btn" onClick={() => setForm("spouse")}>+ {t("addSpouse")}</button>
          <button className="btn" onClick={() => setForm("child")}>+ {t("addChild")}</button>
          <button className="btn" onClick={() => setForm("sibling")}>+ {t("addSibling")}</button>
        </div>
      )}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {(mother || father) && <ParentChange key={`m${p.id}`} treeId={treeId} p={p} role="mother" current={mother} candidates={partnersOf(father, "F")} onAddNew={() => setForm("mother")} onChanged={finished} />}
          {(father || mother) && <ParentChange key={`f${p.id}`} treeId={treeId} p={p} role="father" current={father} candidates={partnersOf(mother, "M")} onAddNew={() => setForm("father")} onChanged={finished} />}
          <RaisedBy key={`r${p.id}`} treeId={treeId} p={p} carers={by(rl.carers)} {...raisedFor()} onChanged={finished} />
        </div>
      )}

      <div className="section-label">{t("album")}</div>
      <Album p={p} treeId={treeId} canEdit={canAdd} onChanged={onChanged} />
      {storageEnabled && canAdd && <DocumentUpload key={`doc-${p.id}`} treeId={treeId} personId={p.id} personName={p.givenName} onUploaded={onChanged} />}
      {p.living && !p.claimed && canInvite && (
        <>
          <div className="section-label">{t("unclaimed")}</div>
          <p className="muted" style={{ margin: "0 0 8px", fontSize: 14 }}>{t("unclaimedText", { name: p.givenName, sex: p.sex })}</p>
          <InvitePanel key={p.id} treeId={treeId} personId={p.id} personName={p.givenName} />
        </>
      )}
    </>
  );
}

/** Neamul persoanei din centru pe grade de rudenie: I–VII nominal, dincolo de VII grupat după ascendentul comun și locul lui. */
function KinByDegree({ graph, people, ego, onSelect }: { graph: Graph; people: Record<string, PersonView>; ego: PersonView; onSelect: (id: string) => void }) {
  const t = useTranslations("Tree");
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  // Rudele prin alianță fără cei discreți (o fostă soție apare doar în fișele copiilor ei).
  const { byDegree, affinity } = useMemo(() => {
    const r = relativesByDegree(graph, ego.id);
    return { byDegree: r.byDegree, affinity: r.affinity.filter((x) => !people[x.id]?.discreet) };
  }, [graph, ego.id, people]);
  const degrees = [...byDegree.keys()].sort((a, b) => a - b);
  const close = degrees.filter((d) => d <= CLOSE_KIN_DEGREE);
  const far = degrees.filter((d) => d > CLOSE_KIN_DEGREE).flatMap((d) => byDegree.get(d)!);
  const farGroups = new Map<string, number>();
  for (const { k } of far) {
    const a = k.ancestor && people[k.ancestor];
    if (!a) continue;
    const key = a.birthPlace ? t("nameFrom", { name: a.name, place: a.birthPlace }) : a.name;
    farGroups.set(key, (farGroups.get(key) ?? 0) + 1);
  }
  const chips = (list: { id: string; k: Kinship }[]) => (
    <dd>{list.filter((x) => people[x.id]).map((x) => {
      const label = kinLabel(x.k.term, x.k.sex, locale);
      return <button key={x.id} onClick={() => onSelect(x.id)} title={label}>{people[x.id].name} · {label}</button>;
    })}</dd>
  );
  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>{t("byDegreeTitle", { name: ego.name })}</div>
      <dl className="rel-group rel">
        {close.map((d) => (
          <div key={d} style={{ display: "contents" }}>
            <dt><button className="linklike" onClick={() => setOpen(open === d ? null : d)}>{t("degreeCount", { degree: degreeWord(d, locale), count: byDegree.get(d)!.length })}</button></dt>
            {open === d ? chips(byDegree.get(d)!) : <dd className="muted" style={{ fontSize: 13, paddingTop: 4 }}>{byDegree.get(d)!.slice(0, 4).map((x) => people[x.id]?.givenName).join(", ")}{byDegree.get(d)!.length > 4 ? "…" : ""}</dd>}
          </div>
        ))}
        {affinity.length > 0 && (
          <>
            <dt><button className="linklike" onClick={() => setOpen(open === 0 ? null : 0)}>{t("affinityCount", { count: affinity.length })}</button></dt>
            {open === 0 ? chips(affinity) : <dd className="muted" style={{ fontSize: 13, paddingTop: 4 }}>{t("affinityHint")}</dd>}
          </>
        )}
      </dl>
      {far.length > 0 && (
        <p className="muted" style={{ fontSize: 14, margin: "10px 0 0" }}>
          {t("beyond", { count: far.length, groups: [...farGroups].map(([k, n]) => t("beyondGroup", { name: k, count: n })).join("; ") })}
        </p>
      )}
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>{t("degreeHelp")}</p>
    </div>
  );
}

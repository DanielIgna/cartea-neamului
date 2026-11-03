"use client";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FanChart, ClassicTree, DescendantsChart, years, type Slots, type DescNode } from "./charts";
import { LineageTree, DescendantFan, Hourglass } from "./lineage-charts";
import { where, type PersonView } from "@/lib/tree-data";
import { placeKey } from "@/lib/place-key";
import type { TreeLive } from "@/lib/realtime";
import { buildGraph, family, kinship, romanDegree, relativesByDegree, oldestAncestor, ancestorsOf, unionsOf, ordinalOf, CLOSE_KIN_DEGREE, type Graph, type Rel } from "@/lib/kinship";
import InvitePanel from "./InvitePanel";
import LiveTree from "./LiveTree";
import PersonForm, { type RelKind } from "./PersonForm";
import { DocumentUpload, BiographySuggest } from "./PersonTools";
import { Album, Avatar } from "./Album";
import { descendants, childrenByUnion, likelyDuplicates, sameLooking, normName, type Duplicate } from "@/lib/family";
import Duplicates, { MergeWith } from "./Duplicates";
import { setDiscreet, setParent } from "@/app/actions";
import ParentChange from "./ParentChange";
import DeletePerson from "./DeletePerson";
import SpouseChildren from "./SpouseChildren";
import RaisedBy from "./RaisedBy";
import { carerCandidates, raisedLinks, type Raised } from "@/lib/raised";

type Live = TreeLive & { url: string; userId: string };
type Props = {
  treeId: string; treeName: string; slots: Record<number, string>; people: Record<string, PersonView>; rels: Rel[]; raised: Raised[]; centerId: string; generations: number;
  meId: string; isEditor: boolean; isRoot: boolean; canAdd: boolean; canInvite: boolean; live: Live | null; aiEnabled: boolean; storageEnabled: boolean;
};
type View = "fan" | "classic" | "tree" | "desc" | "hour";
type Sel = { n: number } | { id: string };

const VIEWS: [View, string][] = [["hour", "Clepsidră"], ["fan", "Evantai"], ["classic", "Clasic"], ["tree", "Copac"], ["desc", "Descendenți"]];

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
  const [view, setView] = useState<View>("hour");
  const [fanDir, setFanDir] = useState<"up" | "down">("up");
  const [trunk, setTrunk] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel>({ n: 1 });
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  const go = (changes: Record<string, string | null>) => {
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) v === null ? q.delete(k) : q.set(k, v);
    router.push(q.size ? `${path}?${q}` : path);
  };
  const center = (id: string) => { setSel({ n: 1 }); go({ p: id }); };
  useEffect(() => setSel({ n: 1 }), [centerId]);
  // Desenele mari se derulează: pornim cu persoana din centru la vedere, nu cu colțul gol din stânga sus.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = view === "desc" ? 0 : view === "tree" || view === "hour" ? (view === "tree" ? el.scrollHeight : (el.scrollHeight - el.clientHeight) / 2) : (el.scrollHeight - el.clientHeight) * (view === "fan" ? 0.75 : 0.5);
  }, [view, generations, centerId, fanDir, trunk]);

  const slots: Slots = useMemo(() => Object.fromEntries(Object.entries(props.slots).map(([n, id]) => [n, people[id]]).filter(([, p]) => p)), [props.slots, people]);
  const graph = useMemo(() => buildGraph(Object.values(people), rels), [people, rels]);
  const selectedId = "id" in sel ? sel.id : props.slots[sel.n] ?? null;
  const selectedN = "n" in sel ? sel.n : Number(Object.entries(props.slots).find(([, id]) => id === sel.id)?.[0] ?? 0);
  const chartProps = { slots, selected: selectedN, onSelect: (n: number) => setSel({ n }), onCenter: center, generations };
  const ego = people[centerId];
  // Trunchiul copacului: implicit cel mai vechi strămoș cunoscut pe linia tatălui; se poate alege oricare ascendent sau chiar persoana din centru.
  const ancestors = useMemo(() => ancestorsOf(graph, centerId), [graph, centerId]);
  const egoPath = useMemo(() => new Set(ancestors.map(([id]) => id)), [ancestors]);
  const trunkId = trunk && egoPath.has(trunk) ? trunk : oldestAncestor(graph, centerId);
  // În desene apar soții care nu sunt discreți; copiii celor discreți pornesc doar din părintele din neam.
  const drawn = useMemo(() => (id: string) => !!people[id] && !people[id].discreet, [people]);
  const lineage = useMemo(() => descendants(graph, drawn, trunkId), [graph, drawn, trunkId]);
  const mine = useMemo(() => descendants(graph, drawn, centerId), [graph, drawn, centerId]);
  const showsLineage = view === "tree" || view === "desc" || (view === "fan" && fanDir === "down");
  // Fișe care par aceeași persoană trecută de două ori (doar proprietarul și editorii le pot uni).
  const pairs = useMemo(() => (props.isEditor ? likelyDuplicates(graph, people) : []), [graph, people, props.isEditor]);
  const kidsCount = (id: string) => graph.children.get(id)?.length ?? 0;
  const merged = (msg: string, keptId: string) => { setNotice(msg); setSel({ id: keptId }); router.refresh(); };
  const lineageProps = { root: lineage, people, selectedId, egoPath, onSelectPerson: (id: string) => setSel({ id }), onCenter: center };

  return (
    <section className="layout">
      <div className="stack">
        <div className="card">
          <div className="toolbar">
            <div className="title">{view === "hour" ? `Înainte și după ${ego?.name}` : showsLineage ? `Urmașii lui ${people[trunkId]?.name}` : `Ascendenții lui ${ego?.name}`}</div>
            <div className="seg" role="group" aria-label="Vizualizare">
              {VIEWS.map(([v, label]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>)}
            </div>
            {view === "fan" && (
              <div className="seg" role="group" aria-label="Direcție">
                <button aria-pressed={fanDir === "up"} onClick={() => setFanDir("up")}>Strămoși</button>
                <button aria-pressed={fanDir === "down"} onClick={() => setFanDir("down")}>Urmași</button>
              </div>
            )}
            {showsLineage && (
              <label className="gen-select">Trunchiul
                <select value={trunkId} onChange={(e) => setTrunk(e.target.value)}>
                  {ancestors.map(([id, gen]) => people[id] && (
                    <option key={id} value={id}>{gen === 0 ? `${people[id].name} (de la mine în jos)` : `${people[id].name}${people[id].birthYear ? `, ${people[id].approx ? "cca. " : ""}${people[id].birthYear}` : ""} · gen. ${gen}`}</option>
                  ))}
                </select>
              </label>
            )}
            {!showsLineage && view !== "hour" && (
              <label className="gen-select">Generații
                <select value={generations} onChange={(e) => go({ g: e.target.value })}>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((g) => <option key={g} value={g}>{g}{g >= 8 ? " (până pe la 1700)" : ""}</option>)}
                </select>
              </label>
            )}
            {!isRoot && <button className="btn" onClick={() => go({ p: null })}>Înapoi la mine</button>}
            {live && <LiveTree key={live.sealedQuery.queryFingerprint} url={live.url} treeId={treeId} userId={live.userId} sealedQuery={live.sealedQuery} initialData={live.initialData} />}
          </div>
          <div ref={box} className={`chartbox${view !== "fan" || generations >= 7 || fanDir === "down" ? " scroll" : ""}`}>
            {view === "fan" && fanDir === "up" && <FanChart {...chartProps} />}
            {view === "fan" && fanDir === "down" && <DescendantFan {...lineageProps} />}
            {view === "classic" && <ClassicTree {...chartProps} />}
            {view === "tree" && <LineageTree {...lineageProps} />}
            {view === "hour" && <Hourglass slots={slots} generations={generations} down={mine} people={people} selectedId={selectedId}
              onSelectPerson={(id) => setSel({ id })} onSelectSlot={(n) => setSel({ n })} onCenter={center} />}
            {view === "desc" && <DescendantsChart root={lineage} people={people} selectedId={selectedId} onSelectPerson={(id) => setSel({ id })} onCenter={center} />}
          </div>
          <div className="legend">
            {view === "desc" ? (
              <>
                <span><i className="sw" style={{ background: "var(--desc)" }} />Urmaș</span>
                <span><i className="sw" style={{ border: "1.5px dashed var(--line)" }} />⚭ Soț / soție</span>
                <span>Copiii unei căsătorii coboară din linia dintre soți; cei dintr-o altă relație, doar din părinte.</span>
              </>
            ) : view === "hour" ? (
              <>
                <span><i className="sw" style={{ background: "var(--pat-1)" }} />Linia tatălui</span>
                <span><i className="sw" style={{ background: "var(--mat-1)" }} />Linia mamei</span>
                <span><i className="sw" style={{ background: "var(--desc)" }} />Urmași</span>
                <span>Sus: 3 generații de strămoși. Pentru mai multe, alege Evantai sau Copac.</span>
              </>
            ) : showsLineage ? (
              <>
                <span><i className="sw" style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent)" }} />Drumul de la trunchi până la {ego?.givenName}</span>
                <span>{view === "tree" ? "Trunchiul e linia neamului. Soțul și soția (⚭) se unesc într-un nod, iar din el pornesc ramurile copiilor; copiii dintr-o altă relație pornesc doar din părinte, pe o ramură mai subțire. Vârfurile cu lăstari sunt cei mai tineri." : "Fiecare inel e o generație, iar fiecare felie e cât urmașii acelei ramuri."}</span>
              </>
            ) : (
              <>
                <span><i className="sw" style={{ background: "var(--pat-1)" }} />Linia tatălui</span>
                <span><i className="sw" style={{ background: "var(--mat-1)" }} />Linia mamei</span>
                <span><i className="sw" style={{ border: "1.5px dashed var(--muted)" }} />Loc liber, de completat</span>
              </>
            )}
            <span>Click pentru fișă, dublu click pune persoana în centru.</span>
          </div>
        </div>
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="title" style={{ fontSize: 17 }}>{treeName} · {Object.keys(people).length} persoane</div>
            <Link className="btn" href={`/arbore/${treeId}/harta`}>Harta neamului</Link>
            <Link className="btn" href={`/arbore/${treeId}/cronologie`}>Cronologie</Link>
            <a className="btn" href={`/api/arbore/${treeId}/gedcom`}>Exportă GEDCOM</a>
          </div>
        </div>
        {notice && <div className="card"><p style={{ margin: 0 }}>{notice}</p></div>}
        {pairs.length > 0 && <Duplicates treeId={treeId} pairs={pairs} people={people} kids={kidsCount} onDone={merged} />}
        {ego && <KinByDegree graph={graph} people={people} ego={ego} onSelect={(id) => setSel({ id })} />}
        {canInvite && (
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>Invită o rudă în arbore</div>
            <InvitePanel treeId={treeId} />
          </div>
        )}
      </div>
      <aside className="card panel" aria-live="polite">
        {selectedId && people[selectedId]
          ? <PersonPanel key={selectedId} p={people[selectedId]} {...props} graph={graph} ego={ego} pairs={pairs} onMerged={merged} onSelect={(id) => setSel({ id })} onCenter={center} onChanged={() => router.refresh()} />
          : canAdd && "n" in sel && slots[Math.floor(sel.n / 2)]
            ? <PersonForm key={sel.n} mode="add" kind={sel.n % 2 === 0 ? "father" : "mother"} treeId={treeId} anchor={slots[Math.floor(sel.n / 2)]}
                shareWith={shareFor(graph, people, slots[Math.floor(sel.n / 2)].id, sel.n % 2 === 0 ? "father" : "mother")} onDone={() => router.refresh()} />
            : <p className="muted">{canAdd ? "Alege o persoană din arbore." : "Ca vizitator poți vedea arborele, dar nu poți adăuga persoane."}</p>}
      </aside>
    </section>
  );
}

type PanelProps = Props & {
  p: PersonView; graph: Graph; ego?: PersonView; pairs: Duplicate[];
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
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "ro"));
}

function PersonPanel({ p, graph, ego, people, raised, treeId, meId, isEditor, canInvite, canAdd, aiEnabled, storageEnabled, pairs, onSelect, onCenter, onChanged, onMerged }: PanelProps) {
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
    const others = Object.values(people).filter((x) => !near.has(x.id) && !skip.has(x.id) && !x.discreet).sort((a, b) => a.name.localeCompare(b.name, "ro"));
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
    return people[shared[0]]?.sex === "M" ? "după tată" : people[shared[0]]?.sex === "F" ? "după mamă" : "după un părinte";
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
    else finished(p.discreet ? `${p.givenName} apare din nou în desenele arborelui.` : `${p.givenName} nu mai apare în desene; ${p.sex === "M" ? "îl" : "o"} văd doar copiii ${p.sex === "M" ? "lui" : "ei"}, în fișele lor.`);
  });

  if (form) {
    return form === "edit"
      ? <PersonForm mode="edit" treeId={treeId} person={p} onDone={() => finished("Fișa a fost salvată.")} onCancel={() => setForm(null)} />
      : <PersonForm mode="add" kind={form} treeId={treeId} anchor={p} partners={childPartners} shareWith={shareFor(graph, people, p.id, form)} discreet={discreetFor(form)}
          lookalikes={lookalikesFor(form)} useExisting={useExistingFor(form)}
          onDone={(msg) => finished(msg ?? "Persoana a fost adăugată.")} onCancel={() => setForm(null)} />;
  }

  const group = (label: string, list: PersonView[], note?: (x: PersonView, i: number) => string) => list.length > 0 && (
    <div key={label} style={{ display: "contents" }}><dt>{label}</dt><dd>{list.map((x, i) => {
      const n = note?.(x, i);
      return <button key={x.id} onClick={() => onSelect(x.id)}>{x.name}{x.birthYear ? ` (${x.birthYear})` : ""}{n ? ` · ${n}` : ""}</button>;
    })}</dd></div>
  );

  return (
    <>
      <div className="section-label" style={{ marginTop: 0 }}>Fișa persoanei</div>
      <div className="person-head">
        <Avatar p={p} size={72} />
        <div>
          <h2>{p.name}</h2>
          <div className="meta">{p.birthSurname ? `născut(ă) ${p.birthSurname} · ` : ""}{years(p)}</div>
          <Link href={`/arbore/${treeId}/persoana/${p.id}`} style={{ fontSize: 14 }}>Deschide profilul și albumul →</Link>
        </div>
      </div>
      <div className="chips">
        {p.living ? <span className="chip priv">în viață · vizibil doar în acest arbore</span> : <span className="chip">decedat(ă)</span>}
        {p.claimed && <span className="chip ok">profil revendicat</span>}
        {p.approx && <span className="chip">dată aproximativă</span>}
        {p.discreet && <span className="chip">discret(ă) · apare doar în fișele copiilor</span>}
        {canEdit && fam.partners.length > 0 && (p.discreet || fam.children.length > 0) && (
          <button className="linklike" style={{ fontSize: 13 }} disabled={toggling} onClick={toggleDiscreet}
            title={p.discreet ? "Va apărea din nou în desene, lângă soțul/soția din neam" : "Nu mai apare în desenele arborelui; copiii pornesc doar din celălalt părinte"}>
            {p.discreet ? "Arată din nou în desene" : "Ascunde din desene (doar în fișele copiilor)"}
          </button>
        )}
      </div>
      {kin && ego && (
        <div className="kin">
          Pentru {ego.givenName}: <b>{kin.label}</b>
          {kin.degree ? ` · rudă de gradul ${romanDegree(kin.degree)}` : kin.degree === null ? " · rudă prin alianță, fără grad de sânge" : ""}
          {kin.degree !== null && kin.degree > CLOSE_KIN_DEGREE && " · neam mai îndepărtat de al șaptelea"}
          {kin.ancestor && kin.up > 0 && kin.down > 0 && people[kin.ancestor] && (
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Ascendent comun: <button className="linklike" onClick={() => onSelect(kin.ancestor!)}>{people[kin.ancestor].name}</button>
              {people[kin.ancestor].birthPlace ? `, din ${people[kin.ancestor].birthPlace}` : ""}{people[kin.ancestor].birthYear ? `, n. ${people[kin.ancestor].birthYear}` : ""}
            </div>
          )}
        </div>
      )}
      {!kin && ego && ego.id !== p.id && <div className="kin">Nu am găsit încă o legătură de sânge cu {ego.givenName} în arbore.</div>}
      <dl className="facts" style={{ marginTop: 10 }}>
        {(() => {
          // Locul duce pe harta neamului, la satul acela, cu toți cei de acolo.
          const place = (text: string | null, country: string | null, fallback = "") => {
            const w = where(text, country) || fallback, k = placeKey(text, country);
            return w && k ? <Link href={`/arbore/${treeId}/harta?loc=${encodeURIComponent(k)}`} title="Vezi locul pe harta neamului">{w}</Link> : w;
          };
          const fact = (date: string | null, pl: React.ReactNode) => (date || pl ? <>{date}{date && pl ? ", " : ""}{pl}</> : null);
          const born = fact(p.birthText, place(p.birthPlace, p.birthCountry));
          const died = fact(p.deathText, place(p.deathPlace, p.deathCountry));
          const lives = p.living ? place(p.residencePlace, p.residenceCountry, p.residenceCountry ?? "") : null;
          return <>{born && <><dt>Născut(ă)</dt><dd>{born}</dd></>}{died && <><dt>Decedat(ă)</dt><dd>{died}</dd></>}{lives && <><dt>Locuiește în</dt><dd>{lives}</dd></>}</>;
        })()}
        {p.occupation && <><dt>Ocupație</dt><dd>{p.occupation}</dd></>}
      </dl>
      <div className="section-label">Ce se știe despre {p.givenName}</div>
      {p.biography ? <p className="bio">{p.biography}</p> : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nimic scris încă.{canEdit ? " Apasă „Editează” și scrie câteva rânduri." : ""}</p>}
      {p.notes && <><div className="section-label">Note suplimentare</div><p className="notes">{p.notes}</p></>}
      <div className="actions">
        {canEdit && <button className="btn primary" onClick={() => setForm("edit")}>Editează</button>}
        {ego?.id !== p.id && <button className="btn" onClick={() => onCenter(p.id)}>Pune în centru</button>}
        {(isEditor || (canAdd && p.createdBy === meId)) && (!p.claimed || p.claimedBy === meId) && ego?.id !== p.id &&
          <DeletePerson key={`del${p.id}`} treeId={treeId} p={p} onDeleted={() => { onSelect(ego?.id ?? p.id); finished(`${p.name} a fost ștearsă din arbore.`); }} />}
        {isEditor && <MergeWith key={`mg${p.id}`} treeId={treeId} p={p} candidates={mergeCandidates(graph, people, p)} onDone={onMerged} />}
      </div>
      {done && <p className="muted" style={{ fontSize: 14 }}>{done}</p>}
      {aiEnabled && canAdd && !p.living && <BiographySuggest key={`bio-${p.id}`} treeId={treeId} personId={p.id} canSave={isEditor} onSaved={onChanged} />}

      <div className="section-label">Rude</div>
      <dl className="rel-group rel">
        {group("Părinți", by(fam.parents))}
        {group(p.sex === "F" ? "Crescută de" : p.sex === "M" ? "Crescut de" : "Crescut(ă) de", by(rl.carers))}
        {group(shownSpouses.length > 1 ? (p.sex === "F" ? "Soți" : "Soții") : p.sex === "F" ? "Soț" : p.sex === "M" ? "Soție" : "Soț / soție", shownSpouses,
          shownSpouses.length > 1 ? (_, i) => `${ordinalOf(i + 1)} căsătorie` : undefined)}
        {kidsBy.named.length > 0
          ? <>
              {kidsBy.named.map((u) => group(`Copii cu ${people[u.spouse]?.givenName} (${u.children.length})`, by(u.children)))}
              {group(`Din altă relație (${kidsBy.other.length})`, by(kidsBy.other))}
            </>
          : group(`Copii (${fam.children.length})`, by(kidsBy.other))}
        {group(fam.children.length ? "A crescut și pe" : "A crescut pe", by(rl.raised))}
        {group(`Frați (${fam.siblings.length})`, by(fam.siblings), half)}
      </dl>
      {canAdd && by(fam.partners).map((sp) => {
        // Copiii soțului/soției care au un singur părinte trecut: propunem să fie și ai acestei persoane.
        const kids = by(graph.children.get(sp.id) ?? []).filter((c) => (graph.parents.get(c.id) ?? []).length === 1 && c.id !== p.id);
        return kids.length > 0 && <SpouseChildren key={`sc${sp.id}`} treeId={treeId} p={p} spouse={sp} kids={kids} onDone={finished} />;
      })}
      {!fam.parents.length && !fam.partners.length && !fam.children.length && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nicio rudă legată încă.</p>}
      {isEditor && <Duplicates inline treeId={treeId} pairs={pairs.filter((d) => d.keep === p.id || d.drop === p.id)} people={people}
        kids={(id) => graph.children.get(id)?.length ?? 0} onDone={onMerged} />}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {!hasFather && <button className="btn" onClick={() => setForm("father")}>+ Tată</button>}
          {!hasMother && <button className="btn" onClick={() => setForm("mother")}>+ Mamă</button>}
          <button className="btn" onClick={() => setForm("spouse")}>+ Soț / soție</button>
          <button className="btn" onClick={() => setForm("child")}>+ Copil</button>
          <button className="btn" onClick={() => setForm("sibling")}>+ Frate / soră</button>
        </div>
      )}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {(mother || father) && <ParentChange key={`m${p.id}`} treeId={treeId} p={p} role="mother" current={mother} candidates={partnersOf(father, "F")} onAddNew={() => setForm("mother")} onChanged={finished} />}
          {(father || mother) && <ParentChange key={`f${p.id}`} treeId={treeId} p={p} role="father" current={father} candidates={partnersOf(mother, "M")} onAddNew={() => setForm("father")} onChanged={finished} />}
          <RaisedBy key={`r${p.id}`} treeId={treeId} p={p} carers={by(rl.carers)} {...raisedFor()} onChanged={finished} />
        </div>
      )}

      <div className="section-label">Album: poze și documente</div>
      <Album p={p} treeId={treeId} canEdit={canAdd} onChanged={onChanged} />
      {storageEnabled && canAdd && <DocumentUpload key={`doc-${p.id}`} treeId={treeId} personId={p.id} personName={p.givenName} onUploaded={onChanged} />}
      {p.living && !p.claimed && canInvite && (
        <>
          <div className="section-label">Profil nerevendicat</div>
          <p className="muted" style={{ margin: "0 0 8px", fontSize: 14 }}>
            Trimite-i lui {p.givenName} un link. După ce își face cont, intră direct în arbore cu propria fișă în centru și poate continua arborele pe familia lui.
          </p>
          <InvitePanel key={p.id} treeId={treeId} personId={p.id} personName={p.givenName} />
        </>
      )}
    </>
  );
}

/** Neamul persoanei din centru pe grade de rudenie: I–VII nominal, dincolo de VII grupat după ascendentul comun și locul lui. */
function KinByDegree({ graph, people, ego, onSelect }: { graph: Graph; people: Record<string, PersonView>; ego: PersonView; onSelect: (id: string) => void }) {
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
    const key = `${a.name}${a.birthPlace ? ` din ${a.birthPlace}` : ""}`;
    farGroups.set(key, (farGroups.get(key) ?? 0) + 1);
  }
  const chips = (list: { id: string; k: { label: string } }[]) => (
    <dd>{list.filter((x) => people[x.id]).map((x) => <button key={x.id} onClick={() => onSelect(x.id)} title={x.k.label}>{people[x.id].name} · {x.k.label}</button>)}</dd>
  );
  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>Neamul lui {ego.name}, pe grade de rudenie</div>
      <dl className="rel-group rel">
        {close.map((d) => (
          <div key={d} style={{ display: "contents" }}>
            <dt><button className="linklike" onClick={() => setOpen(open === d ? null : d)}>Gradul {romanDegree(d)} · {byDegree.get(d)!.length}</button></dt>
            {open === d ? chips(byDegree.get(d)!) : <dd className="muted" style={{ fontSize: 13, paddingTop: 4 }}>{byDegree.get(d)!.slice(0, 4).map((x) => people[x.id]?.givenName).join(", ")}{byDegree.get(d)!.length > 4 ? "…" : ""}</dd>}
          </div>
        ))}
        {affinity.length > 0 && (
          <>
            <dt><button className="linklike" onClick={() => setOpen(open === 0 ? null : 0)}>Prin alianță · {affinity.length}</button></dt>
            {open === 0 ? chips(affinity) : <dd className="muted" style={{ fontSize: 13, paddingTop: 4 }}>soți, soții și neamurile lor</dd>}
          </>
        )}
      </dl>
      {far.length > 0 && (
        <p className="muted" style={{ fontSize: 14, margin: "10px 0 0" }}>
          Dincolo de al șaptelea neam: {far.length} {far.length === 1 ? "persoană" : "persoane"}, din {[...farGroups].map(([k, n]) => `neamul lui ${k} (${n})`).join("; ")}.
        </p>
      )}
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>Gradul se numără ca în Codul civil: generațiile urcate până la ascendentul comun plus cele coborâte până la rudă.</p>
    </div>
  );
}

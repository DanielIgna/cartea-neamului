"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FanChart, ClassicTree, DescendantsChart, years, type Slots, type DescNode } from "./charts";
import { LineageTree, DescendantFan, Hourglass } from "./lineage-charts";
import type { PersonView } from "@/lib/tree-data";
import type { TreeLive } from "@/lib/realtime";
import { buildGraph, family, kinship, romanDegree, relativesByDegree, oldestAncestor, ancestorsOf, CLOSE_KIN_DEGREE, type Graph, type Rel } from "@/lib/kinship";
import InvitePanel from "./InvitePanel";
import LiveTree from "./LiveTree";
import PersonForm, { type RelKind } from "./PersonForm";
import { DocumentUpload, BiographySuggest } from "./PersonTools";
import { Album, Avatar } from "./Album";

type Live = TreeLive & { url: string; userId: string };
type Props = {
  treeId: string; treeName: string; slots: Record<number, string>; people: Record<string, PersonView>; rels: Rel[]; centerId: string; generations: number;
  meId: string; isEditor: boolean; isRoot: boolean; canAdd: boolean; canInvite: boolean; live: Live | null; aiEnabled: boolean; storageEnabled: boolean;
};
type View = "fan" | "classic" | "tree" | "desc" | "hour";
type Sel = { n: number } | { id: string };

const VIEWS: [View, string][] = [["hour", "Clepsidră"], ["fan", "Evantai"], ["classic", "Clasic"], ["tree", "Copac"], ["desc", "Descendenți"]];

/** Urmașii unei persoane, pe oricâte generații, copiii în ordinea nașterii. */
function descendants(g: Graph, people: Record<string, PersonView>, id: string, depth = 0, seen = new Set<string>()): DescNode {
  seen.add(id);
  const born = (x: string) => people[x]?.birthYear ?? 9999;
  const kids = depth >= 30 ? [] : (g.children.get(id) ?? []).filter((c) => !seen.has(c)).sort((a, b) => born(a) - born(b));
  return { id, partners: g.partners.get(id) ?? [], children: kids.map((c) => descendants(g, people, c, depth + 1, seen)) };
}

export default function TreeScreen(props: Props) {
  const { treeId, treeName, people, rels, centerId, generations, isRoot, canAdd, canInvite, live } = props;
  const [view, setView] = useState<View>("hour");
  const [fanDir, setFanDir] = useState<"up" | "down">("up");
  const [trunk, setTrunk] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel>({ n: 1 });
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
  const lineage = useMemo(() => descendants(graph, people, trunkId), [graph, people, trunkId]);
  const mine = useMemo(() => descendants(graph, people, centerId), [graph, people, centerId]);
  const showsLineage = view === "tree" || view === "desc" || (view === "fan" && fanDir === "down");
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
                <span>{view === "tree" ? "Trunchiul e linia neamului. Soțul și soția (⚭) se unesc într-un nod, iar din el pornesc ramurile copiilor; vârfurile cu lăstari sunt cei mai tineri." : "Sub fiecare nume: anul nașterii și câți copii a avut. ⚭ soțul sau soția."}</span>
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
            <Link className="btn" href={`/arbore/${treeId}/cronologie`}>Cronologie</Link>
            <a className="btn" href={`/api/arbore/${treeId}/gedcom`}>Exportă GEDCOM</a>
          </div>
        </div>
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
          ? <PersonPanel key={selectedId} p={people[selectedId]} {...props} graph={graph} ego={ego} onSelect={(id) => setSel({ id })} onCenter={center} onChanged={() => router.refresh()} />
          : canAdd && "n" in sel && slots[Math.floor(sel.n / 2)]
            ? <PersonForm key={sel.n} mode="add" kind={sel.n % 2 === 0 ? "father" : "mother"} treeId={treeId} anchor={slots[Math.floor(sel.n / 2)]} onDone={() => router.refresh()} />
            : <p className="muted">{canAdd ? "Alege o persoană din arbore." : "Ca vizitator poți vedea arborele, dar nu poți adăuga persoane."}</p>}
      </aside>
    </section>
  );
}

type PanelProps = Props & { p: PersonView; graph: Graph; ego?: PersonView; onSelect: (id: string) => void; onCenter: (id: string) => void; onChanged: () => void };

function PersonPanel({ p, graph, ego, people, treeId, meId, isEditor, canInvite, canAdd, aiEnabled, storageEnabled, onSelect, onCenter, onChanged }: PanelProps) {
  const [form, setForm] = useState<"edit" | RelKind | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fam = family(graph, p.id);
  const kin = ego && ego.id !== p.id ? kinship(graph, ego.id, p.id) : null;
  const canEdit = isEditor || (canAdd && (p.createdBy === meId || p.claimedBy === meId));
  const by = (ids: string[]) => ids.map((id) => people[id]).filter(Boolean);
  const hasFather = fam.parents.some((id) => people[id]?.sex === "M"), hasMother = fam.parents.some((id) => people[id]?.sex === "F");
  const finished = (msg: string) => { setForm(null); setDone(msg); onChanged(); };

  if (form) {
    return form === "edit"
      ? <PersonForm mode="edit" treeId={treeId} person={p} onDone={() => finished("Fișa a fost salvată.")} onCancel={() => setForm(null)} />
      : <PersonForm mode="add" kind={form} treeId={treeId} anchor={p} partners={by(fam.partners)} onDone={() => finished("Persoana a fost adăugată.")} onCancel={() => setForm(null)} />;
  }

  const group = (label: string, list: PersonView[]) => list.length > 0 && (
    <><dt>{label}</dt><dd>{list.map((x) => <button key={x.id} onClick={() => onSelect(x.id)}>{x.name}{x.birthYear ? ` (${x.birthYear})` : ""}</button>)}</dd></>
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
        {(p.birthText || p.birthPlace) && <><dt>Născut(ă)</dt><dd>{[p.birthText, p.birthPlace].filter(Boolean).join(", ")}</dd></>}
        {(p.deathText || p.deathPlace) && <><dt>Decedat(ă)</dt><dd>{[p.deathText, p.deathPlace].filter(Boolean).join(", ")}</dd></>}
        {p.occupation && <><dt>Ocupație</dt><dd>{p.occupation}</dd></>}
      </dl>
      <div className="section-label">Ce se știe despre {p.givenName}</div>
      {p.biography ? <p className="bio">{p.biography}</p> : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nimic scris încă.{canEdit ? " Apasă „Editează” și scrie câteva rânduri." : ""}</p>}
      {p.notes && <><div className="section-label">Note suplimentare</div><p className="notes">{p.notes}</p></>}
      <div className="actions">
        {canEdit && <button className="btn primary" onClick={() => setForm("edit")}>Editează</button>}
        {ego?.id !== p.id && <button className="btn" onClick={() => onCenter(p.id)}>Pune în centru</button>}
      </div>
      {done && <p className="muted" style={{ fontSize: 14 }}>{done}</p>}
      {aiEnabled && canAdd && !p.living && <BiographySuggest key={`bio-${p.id}`} treeId={treeId} personId={p.id} canSave={isEditor} onSaved={onChanged} />}

      <div className="section-label">Rude</div>
      <dl className="rel-group rel">
        {group("Părinți", by(fam.parents))}
        {group(p.sex === "F" ? "Soț" : p.sex === "M" ? "Soție" : "Soț / soție", by(fam.partners))}
        {group(`Copii (${fam.children.length})`, by(fam.children))}
        {group(`Frați (${fam.siblings.length})`, by(fam.siblings))}
      </dl>
      {!fam.parents.length && !fam.partners.length && !fam.children.length && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nicio rudă legată încă.</p>}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {!hasFather && <button className="btn" onClick={() => setForm("father")}>+ Tată</button>}
          {!hasMother && <button className="btn" onClick={() => setForm("mother")}>+ Mamă</button>}
          <button className="btn" onClick={() => setForm("spouse")}>+ Soț / soție</button>
          <button className="btn" onClick={() => setForm("child")}>+ Copil</button>
          <button className="btn" onClick={() => setForm("sibling")}>+ Frate / soră</button>
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
  const { byDegree, affinity } = useMemo(() => relativesByDegree(graph, ego.id), [graph, ego.id]);
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

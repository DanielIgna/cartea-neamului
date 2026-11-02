"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FanChart, ClassicTree, TreeIllustration, DescendantsChart, years, type Slots, type DescNode } from "./charts";
import type { PersonView } from "@/lib/tree-data";
import type { TreeLive } from "@/lib/realtime";
import { buildGraph, family, kinship, romanDegree, type Graph, type Rel } from "@/lib/kinship";
import InvitePanel from "./InvitePanel";
import LiveTree from "./LiveTree";
import PersonForm, { type RelKind } from "./PersonForm";
import { DocumentUpload, BiographySuggest } from "./PersonTools";

type Live = TreeLive & { url: string; userId: string };
type Props = {
  treeId: string; treeName: string; slots: Record<number, string>; people: Record<string, PersonView>; rels: Rel[]; centerId: string; generations: number;
  meId: string; isEditor: boolean; isRoot: boolean; canAdd: boolean; canInvite: boolean; live: Live | null; aiEnabled: boolean; storageEnabled: boolean;
};
type View = "fan" | "classic" | "tree" | "desc";
type Sel = { n: number } | { id: string };

const VIEWS: [View, string][] = [["fan", "Evantai"], ["classic", "Clasic"], ["tree", "Copac"], ["desc", "Descendenți"]];

function descendants(g: Graph, id: string, depth = 0, seen = new Set<string>()): DescNode {
  seen.add(id);
  const kids = depth >= 5 ? [] : (g.children.get(id) ?? []).filter((c) => !seen.has(c));
  return { id, partners: g.partners.get(id) ?? [], children: kids.map((c) => descendants(g, c, depth + 1, seen)) };
}

export default function TreeScreen(props: Props) {
  const { treeId, treeName, people, rels, centerId, generations, isRoot, canAdd, canInvite, live } = props;
  const [view, setView] = useState<View>("fan");
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
    el.scrollTop = view === "desc" ? 0 : (el.scrollHeight - el.clientHeight) * (view === "fan" ? 0.75 : 0.5);
  }, [view, generations, centerId]);

  const slots: Slots = useMemo(() => Object.fromEntries(Object.entries(props.slots).map(([n, id]) => [n, people[id]]).filter(([, p]) => p)), [props.slots, people]);
  const graph = useMemo(() => buildGraph(Object.values(people), rels), [people, rels]);
  const selectedId = "id" in sel ? sel.id : props.slots[sel.n] ?? null;
  const selectedN = "n" in sel ? sel.n : Number(Object.entries(props.slots).find(([, id]) => id === sel.id)?.[0] ?? 0);
  const chartProps = { slots, selected: selectedN, onSelect: (n: number) => setSel({ n }), onCenter: center, generations };
  const ego = people[centerId];

  return (
    <section className="layout">
      <div className="stack">
        <div className="card">
          <div className="toolbar">
            <div className="title">{view === "desc" ? `Descendenții lui ${ego?.name}` : `Ascendenții lui ${ego?.name}`}</div>
            <div className="seg" role="group" aria-label="Vizualizare">
              {VIEWS.map(([v, label]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>)}
            </div>
            {view !== "desc" && (
              <label className="gen-select">Generații
                <select value={generations} onChange={(e) => go({ g: e.target.value })}>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((g) => <option key={g} value={g}>{g}{g >= 8 ? " (până pe la 1700)" : ""}</option>)}
                </select>
              </label>
            )}
            {!isRoot && <button className="btn" onClick={() => go({ p: null })}>Înapoi la mine</button>}
            {live && <LiveTree key={live.sealedQuery.queryFingerprint} url={live.url} treeId={treeId} userId={live.userId} sealedQuery={live.sealedQuery} initialData={live.initialData} />}
          </div>
          <div ref={box} className={`chartbox${view === "classic" || view === "desc" || generations >= 7 ? " scroll" : ""}`}>
            {view === "fan" && <FanChart {...chartProps} />}
            {view === "classic" && <ClassicTree {...chartProps} />}
            {view === "tree" && <TreeIllustration {...chartProps} />}
            {view === "desc" && <DescendantsChart root={descendants(graph, centerId)} people={people} selectedId={selectedId} onSelectPerson={(id) => setSel({ id })} onCenter={center} />}
          </div>
          <div className="legend">
            {view === "desc" ? (
              <>
                <span><i className="sw" style={{ background: "var(--desc)" }} />Urmaș</span>
                <span><i className="sw" style={{ border: "1.5px dashed var(--line)" }} />⚭ Soț / soție</span>
              </>
            ) : view === "tree" ? (
              <>
                <span><i className="sw" style={{ background: "var(--leaf-pat)" }} />Ramura tatălui</span>
                <span><i className="sw" style={{ background: "var(--leaf-mat)" }} />Ramura mamei</span>
                {generations > 6 && <span>Copacul arată cel mult 6 generații; pentru mai multe, folosește Evantai.</span>}
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
      <h2>{p.name}</h2>
      <div className="meta">{p.birthSurname ? `născut(ă) ${p.birthSurname} · ` : ""}{years(p)}</div>
      <div className="chips">
        {p.living ? <span className="chip priv">în viață · vizibil doar în acest arbore</span> : <span className="chip">decedat(ă)</span>}
        {p.claimed && <span className="chip ok">profil revendicat</span>}
        {p.approx && <span className="chip">dată aproximativă</span>}
      </div>
      {kin && ego && (
        <div className="kin">
          Pentru {ego.givenName}: <b>{kin.label}</b>
          {kin.degree ? ` · rudă de gradul ${romanDegree(kin.degree)}` : kin.degree === null ? " · rudă prin alianță, fără grad de sânge" : ""}
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
        {group("Copii", by(fam.children))}
        {group("Frați", by(fam.siblings))}
      </dl>
      {!fam.parents.length && !fam.partners.length && !fam.children.length && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nicio rudă legată încă.</p>}
      {canAdd && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {!hasFather && <button className="btn" onClick={() => setForm("father")}>+ Tată</button>}
          {!hasMother && <button className="btn" onClick={() => setForm("mother")}>+ Mamă</button>}
          <button className="btn" onClick={() => setForm("spouse")}>+ Soț / soție</button>
          <button className="btn" onClick={() => setForm("child")}>+ Copil</button>
          {fam.parents.length > 0 && <button className="btn" onClick={() => setForm("sibling")}>+ Frate / soră</button>}
        </div>
      )}

      <div className="section-label">Documente și fotografii</div>
      <div className="docs">
        {p.documents.length ? p.documents.map((d) => (
          <div className="doc" key={d.id}>
            <div className="thumb">{d.kind}</div>
            <div><b>{d.hasFile ? <a href={`/api/document/${d.id}`} target="_blank" rel="noopener">{d.title}</a> : d.title}</b><small>{d.dateText}</small></div>
          </div>
        )) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Niciun document încă.</p>}
      </div>
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

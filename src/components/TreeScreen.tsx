"use client";
import { useState, useActionState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FanChart, ClassicTree, years, type Slots } from "./charts";
import { addParent } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import InvitePanel from "./InvitePanel";

type Props = { treeId: string; treeName: string; slots: Slots; isRoot: boolean; canAdd: boolean; canInvite: boolean };

export default function TreeScreen({ treeId, treeName, slots, isRoot, canAdd, canInvite }: Props) {
  const [view, setView] = useState<"fan" | "classic">("fan");
  const [selected, setSelected] = useState(1);
  const router = useRouter();
  const path = usePathname();
  const center = (id: string) => { setSelected(1); router.push(`${path}?p=${id}`); };
  useEffect(() => setSelected(1), [slots[1]?.id]);
  const chartProps = { slots, selected, onSelect: setSelected, onCenter: center };

  return (
    <section className="layout">
      <div className="stack">
        <div className="card">
          <div className="toolbar">
            <div className="title">Ascendenții lui {slots[1]?.name}</div>
            <div className="seg" role="group" aria-label="Vizualizare">
              <button aria-pressed={view === "fan"} onClick={() => setView("fan")}>Evantai</button>
              <button aria-pressed={view === "classic"} onClick={() => setView("classic")}>Clasic</button>
            </div>
            {!isRoot && <button className="btn" onClick={() => router.push(path)}>Înapoi la început</button>}
          </div>
          <div className="chartbox">{view === "fan" ? <FanChart {...chartProps} /> : <ClassicTree {...chartProps} />}</div>
          <div className="legend">
            <span><i className="sw" style={{ background: "var(--pat-1)" }} />Linia tatălui</span>
            <span><i className="sw" style={{ background: "var(--mat-1)" }} />Linia mamei</span>
            <span><i className="sw" style={{ border: "1.5px dashed var(--muted)" }} />Loc liber, de completat</span>
            <span>Click pentru fișă, dublu click pune persoana în centru.</span>
          </div>
        </div>
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="title" style={{ fontSize: 17 }}>{treeName}</div>
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
        {slots[selected]
          ? <PersonPanel p={slots[selected]} n={selected} slots={slots} onSelect={setSelected} onCenter={center} treeId={treeId} canInvite={canInvite} />
          : canAdd
            ? <EmptySlot treeId={treeId} n={selected} child={slots[Math.floor(selected / 2)]} onDone={() => router.refresh()} />
            : <p className="muted">Ca vizitator poți vedea arborele, dar nu poți adăuga persoane.</p>}
      </aside>
    </section>
  );
}

function PersonPanel({ p, n, slots, onSelect, onCenter, treeId, canInvite }: { p: PersonView; n: number; slots: Slots; onSelect: (n: number) => void; onCenter: (id: string) => void; treeId: string; canInvite: boolean }) {
  const parents = [2 * n, 2 * n + 1].filter((i) => slots[i]);
  const child = n > 1 ? Math.floor(n / 2) : null;
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
      <dl className="facts">
        {(p.birthText || p.birthPlace) && <><dt>Născut(ă)</dt><dd>{[p.birthText, p.birthPlace].filter(Boolean).join(", ")}</dd></>}
        {(p.deathText || p.deathPlace) && <><dt>Decedat(ă)</dt><dd>{[p.deathText, p.deathPlace].filter(Boolean).join(", ")}</dd></>}
        {p.occupation && <><dt>Ocupație</dt><dd>{p.occupation}</dd></>}
      </dl>
      {p.biography && <p style={{ margin: "10px 0 0" }}>{p.biography}</p>}
      <div className="section-label">Documente și fotografii</div>
      <div className="docs">
        {p.documents.length ? p.documents.map((d) => (
          <div className="doc" key={d.id}><div className="thumb">{d.kind}</div><div><b>{d.title}</b><small>{d.dateText}</small></div></div>
        )) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Niciun document încă.</p>}
      </div>
      <div className="section-label">Rude</div>
      <div className="rel">
        {parents.map((i) => <button key={i} onClick={() => onSelect(i)}>{i % 2 === 0 ? "Tată" : "Mamă"}: {slots[i].name}</button>)}
        {child && slots[child] && <button onClick={() => onSelect(child)}>Copil: {slots[child].name}</button>}
      </div>
      <div className="actions">
        {n !== 1 && <button className="btn primary" onClick={() => onCenter(p.id)}>Pune în centru</button>}
      </div>
      {p.living && !p.claimed && canInvite && (
        <>
          <div className="section-label">Profil nerevendicat</div>
          <p className="muted" style={{ margin: "0 0 8px", fontSize: 14 }}>{p.givenName} poate intra în arbore, vedea ce s-a scris despre el sau ea și decide ce rămâne.</p>
          <InvitePanel key={p.id} treeId={treeId} personId={p.id} personName={p.givenName} />
        </>
      )}
    </>
  );
}

function EmptySlot({ treeId, n, child, onDone }: { treeId: string; n: number; child?: PersonView; onDone: () => void }) {
  const role = n % 2 === 0 ? "father" : "mother";
  const label = role === "father" ? "tatăl" : "mama";
  const [state, action, pending] = useActionState(addParent, null);
  useEffect(() => { if (state?.ok) onDone(); }, [state]);
  if (!child) return <p className="muted">Alege o persoană din arbore.</p>;
  return (
    <form action={action} className="form" key={n}>
      <div className="section-label" style={{ marginTop: 0 }}>Loc liber în arbore</div>
      <h2>Adaugă {label} lui {child.givenName}</h2>
      <input type="hidden" name="treeId" value={treeId} />
      <input type="hidden" name="childId" value={child.id} />
      <input type="hidden" name="role" value={role} />
      <div className="row">
        <label>Prenume<input name="given" required /></label>
        <label>Nume<input name="surname" defaultValue={role === "father" ? child.surname : ""} /></label>
      </div>
      {role === "mother" && <label>Nume de fată<input name="birthSurname" /></label>}
      <div className="row">
        <label>Născut(ă)<input name="birth" placeholder="1902 sau cca. 1870" /></label>
        <label>Locul nașterii<input name="birthPlace" /></label>
      </div>
      <div className="row">
        <label>Decedat(ă)<input name="death" placeholder="1980" /></label>
        <label>Locul decesului<input name="deathPlace" /></label>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="living" /> Persoana e în viață (rămâne privată în arbore)</label>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? "Se salvează…" : `Adaugă ${label}`}</button>
    </form>
  );
}

"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findMe } from "@/app/join-actions";

export type MyJoin = { id: string; status: "pending" | "accepted" | "declined"; at: string; treeId: string | null; treeName: string | null };
const when = (iso: string) => new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long" });

/** „Ești deja într-un arbore?”: cine își face cont își caută fișa, trecută deja de o rudă, după nume și data nașterii. */
export default function JoinTree({ requests, compact }: { requests: MyJoin[]; compact: boolean }) {
  const router = useRouter();
  // Câmpurile rămân completate după căutare (un formular cu `action` s-ar goli singur), ca o greșeală să se corecteze ușor.
  const [v, setV] = useState({ given: "", surname: "", birth: "", note: "" });
  const [state, setState] = useState<Awaited<ReturnType<typeof findMe>> | null>(null);
  const [pending, start] = useTransition();
  const field = (k: keyof typeof v) => ({ name: k, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }) });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData();
    for (const [k, x] of Object.entries(v)) f.set(k, x);
    start(async () => {
      const res = await findMe(null, f);
      setState(res);
      if (res.found) router.refresh();
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const found = state && !state.error ? (state.found
    ? `Am găsit fișa ta ${state.found === 1 ? "într-un arbore" : `în ${state.found} arbori`} de familie. Proprietarul primește cererea ta în Mesaje. După ce confirmă că ești tu, arborele apare aici, pornind de la tine.`
    : state.declined ? "Proprietarul arborelui nu a confirmat cererea ta. Vorbește cu ruda care te-a trecut în arbore."
    : "Nu am găsit nicio fișă cu numele și data asta. Poate ruda care te-a trecut a scris doar anul nașterii sau numele altfel. Cere-i un link de invitație sau pornește un arbore nou.") : null;

  const form = (
    <form onSubmit={submit} method="post" className="form">
      <div className="row">
        <label>Prenume<input {...field("given")} required maxLength={80} autoComplete="given-name" /></label>
        <label>Nume de familie<input {...field("surname")} required maxLength={80} autoComplete="family-name" /></label>
      </div>
      <label>Data nașterii<input {...field("birth")} type="date" required min="1900-01-01" max={today} /></label>
      <label>Câteva cuvinte pentru proprietar (nu e obligatoriu)
        <textarea {...field("note")} maxLength={500} style={{ minHeight: 60 }} placeholder="De pildă: sunt fiul lui Nicolae și al Silviei, din Huedin." />
      </label>
      <small className="muted">Femeile căsătorite pot scrie și numele de familie de dinainte de căsătorie.</small>
      {state?.error && <p className="err" style={{ margin: 0 }}>{state.error}</p>}
      {found && <p className={state?.found ? "confirm" : "muted"} style={{ margin: 0 }}>{found}</p>}
      <div className="actions" style={{ margin: 0 }}><button className="btn primary" disabled={pending}>{pending ? "Caut…" : "Caută-mă"}</button></div>
    </form>
  );

  return (
    <div className="card">
      {compact ? (
        <details>
          <summary style={{ cursor: "pointer", color: "var(--accent)" }}>Ești și în alt arbore? Caută-te după nume și data nașterii</summary>
          <p className="muted" style={{ fontSize: 14 }}>Dacă o rudă te-a trecut deja în arborele ei, cu data completă a nașterii, proprietarul primește cererea ta și te poate lăsa să intri.</p>
          {form}
        </details>
      ) : (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>Ești deja într-un arbore?</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Poate o rudă te-a trecut deja în arborele familiei. Scrie-ți numele și data nașterii. Dacă fișa ta are data completă, proprietarul arborelui primește cererea ta. După ce confirmă că ești tu, intri în arbore, pornind de la tine, și îți poți continua ramura.</p>
          {form}
        </>
      )}
      {requests.length > 0 && (
        <ul className="join-list">
          {requests.map((r) => (
            <li key={r.id}>
              {r.status === "accepted" && r.treeId ? <>Ai intrat în <Link href={`/arbore/${r.treeId}`}>{r.treeName}</Link>.</>
                : r.status === "pending" ? <>Cererea din {when(r.at)} așteaptă confirmarea proprietarului.</>
                : <>Cererea din {when(r.at)} nu a fost confirmată.</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

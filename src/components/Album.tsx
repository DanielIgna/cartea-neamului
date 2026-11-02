"use client";
import { useState, useTransition } from "react";
import { setProfilePhoto, updateDocumentDescription } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

const isImage = (d: PersonView["documents"][number]) => d.hasFile && (d.kind === "photo" || !!d.mimeType?.startsWith("image/"));
const initials = (p: { givenName: string; surname: string }) => `${p.givenName[0] ?? ""}${p.surname[0] ?? ""}`.toUpperCase();

/** Poza de profil, rotundă; fără poză, inițialele. */
export function Avatar({ p, size = 72 }: { p: Pick<PersonView, "givenName" | "surname" | "photoId">; size?: number }) {
  return p.photoId
    ? <img src={`/api/document/${p.photoId}`} alt="" className="avatar" style={{ width: size, height: size }} />
    : <span className="avatar avatar-empty" style={{ width: size, height: size, fontSize: size / 2.6 }} aria-hidden>{initials(p)}</span>;
}

/** Albumul persoanei: fotografiile ca galerie cu descrieri, apoi actele și celelalte documente. */
export function Album({ p, treeId, canEdit, onChanged, large = false }: { p: PersonView; treeId: string; canEdit: boolean; onChanged: () => void; large?: boolean }) {
  const photos = p.documents.filter(isImage), others = p.documents.filter((d) => !isImage(d));
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => {
    const r = await fn();
    setMsg(r.error ?? null);
    if (!r.error) { setEditing(null); onChanged(); }
  });
  if (!p.documents.length) return <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nicio poză sau document încă.</p>;
  return (
    <>
      {photos.length > 0 && (
        <div className={`album${large ? " large" : ""}`}>
          {photos.map((d) => (
            <figure key={d.id}>
              <a href={`/api/document/${d.id}`} target="_blank" rel="noopener"><img src={`/api/document/${d.id}`} alt={d.description ?? d.title} loading="lazy" /></a>
              <figcaption>
                <b>{d.title}</b>{d.dateText ? <small> · {d.dateText}</small> : null}
                {p.photoId === d.id && <span className="chip ok" style={{ marginLeft: 6 }}>poză de profil</span>}
                {editing === d.id ? (
                  <div className="form" style={{ marginTop: 6 }}>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 60 }} placeholder="Cine apare, unde, când, ce poveste are…" />
                    <div className="actions">
                      <button className="btn primary" disabled={pending} onClick={() => run(() => updateDocumentDescription(treeId, d.id, text))}>Salvează</button>
                      <button className="btn" onClick={() => setEditing(null)}>Renunță</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {d.description && <span className="desc">{d.description}</span>}
                    {canEdit && (
                      <span className="fig-actions">
                        <button className="linklike" onClick={() => { setEditing(d.id); setText(d.description ?? ""); }}>{d.description ? "Schimbă descrierea" : "Adaugă descriere"}</button>
                        {p.photoId !== d.id && <button className="linklike" disabled={pending} onClick={() => run(() => setProfilePhoto(treeId, p.id, d.id))}>Fă-o poză de profil</button>}
                      </span>
                    )}
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="docs" style={{ marginTop: photos.length ? 10 : 0 }}>
          {others.map((d) => (
            <div className="doc" key={d.id}>
              <div className="thumb">{d.kind}</div>
              <div><b>{d.hasFile ? <a href={`/api/document/${d.id}`} target="_blank" rel="noopener">{d.title}</a> : d.title}</b><small>{d.dateText}</small>{d.description && <small>{d.description}</small>}</div>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="err">{msg}</p>}
    </>
  );
}

"use client";
import { useState, useTransition } from "react";
import { suggestBiography, saveBiography } from "@/app/actions";
import { shrinkPhoto } from "./PhotoPick";

/** Încarcă un act, o fotografie sau o înregistrare în arhiva persoanei (Neon Object Storage, bucket privat). */
export function DocumentUpload({ treeId, personId, personName, onUploaded }: { treeId: string; personId: string; personName: string; onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  if (!open) return <div className="actions"><button className="btn" onClick={() => setOpen(true)}>Adaugă poză sau document</button></div>;
  const submit = (form: FormData) => start(async () => {
    form.set("personId", personId);
    // Pozele mari din telefon le micșorăm în browser, ca să încapă sub limita de 4 MB.
    const file = form.get("file");
    if (file instanceof File && file.type.startsWith("image/")) form.set("file", await shrinkPhoto(file));
    const res = await fetch(`/api/arbore/${treeId}/documente`, { method: "POST", body: form });
    const json = (await res.json().catch(() => ({}))) as { error?: string; title?: string };
    if (!res.ok) return setMsg({ error: json.error ?? "Încărcarea a eșuat." });
    setMsg({ ok: `„${json.title}” a fost adăugat.` });
    setOpen(false);
    onUploaded();
  });
  return (
    <form action={submit} className="form" style={{ marginTop: 10 }}>
      <label>Titlu<input name="title" required placeholder={`ex. Certificat de naștere, ${personName}`} /></label>
      <div className="row">
        <label>Tip
          <select name="kind" defaultValue="photo">
            <option value="act">Act</option><option value="photo">Fotografie</option><option value="letter">Scrisoare</option>
            <option value="audio">Înregistrare</option><option value="other">Altceva</option>
          </select>
        </label>
        <label>Data<input name="dateText" placeholder="1916 sau cca. 1900" /></label>
      </div>
      <label>Descriere (cine apare, unde, când, ce poveste are)<textarea name="description" style={{ minHeight: 60 }} /></label>
      <label>Fișier (poză, PDF sau audio; pozele mari le micșorăm singuri, PDF-ul și audio până la 4 MB)<input type="file" name="file" required accept="image/*,application/pdf,audio/*" /></label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="asProfile" /> Dacă e o fotografie, folosește-o ca poză de profil</label>
      {msg.error && <p className="err">{msg.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? "Se încarcă…" : "Încarcă"}</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Renunță</button>
      </div>
      {msg.ok && <p className="muted">{msg.ok}</p>}
    </form>
  );
}

/** Ciornă de biografie scrisă de AI (Neon AI Gateway) din faptele fișei; editorii o pot păstra. */
export function BiographySuggest({ treeId, personId, canSave, onSaved }: { treeId: string; personId: string; canSave: boolean; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const ask = () => start(async () => {
    setError("");
    const res = await suggestBiography(treeId, personId);
    if (res.error) setError(res.error); else setText(res.text ?? "");
  });
  const save = () => start(async () => {
    const res = await saveBiography(treeId, personId, text);
    if (res.error) setError(res.error); else { setText(""); onSaved(); }
  });
  return (
    <div className="form" style={{ marginTop: 10 }}>
      {!text && <div className="actions"><button className="btn" onClick={ask} disabled={pending}>{pending ? "Se scrie…" : "Sugerează o biografie (AI)"}</button></div>}
      {text && (
        <>
          <label>Ciornă de biografie, verific-o înainte să o păstrezi<textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} /></label>
          <div className="actions">
            {canSave && <button className="btn primary" onClick={save} disabled={pending}>Păstrează în fișă</button>}
            <button className="btn" onClick={ask} disabled={pending}>Altă variantă</button>
            <button className="btn" onClick={() => setText("")}>Renunță</button>
          </div>
        </>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { suggestBiography, saveBiography } from "@/app/actions";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { DOC_KINDS } from "./Album";

/** Încarcă un act, o fotografie sau o înregistrare în arhiva persoanei (Neon Object Storage, bucket privat). */
export function DocumentUpload({ treeId, personId, personName, onUploaded }: { treeId: string; personId: string; personName: string; onUploaded: () => void }) {
  const t = useTranslations("Media");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  if (!open) return <div className="actions"><button className="btn" onClick={() => setOpen(true)}>{t("addFile")}</button></div>;
  const submit = (form: FormData) => start(async () => {
    form.set("personId", personId);
    // Pozele mari din telefon le micșorăm în browser, ca să încapă sub limita de 4 MB.
    const file = form.get("file");
    if (file instanceof File && file.type.startsWith("image/")) form.set("file", await shrinkPhoto(file));
    const res = await fetch(`/api/arbore/${treeId}/documente`, { method: "POST", body: form });
    const json = (await res.json().catch(() => ({}))) as { error?: string; title?: string };
    if (!res.ok) return setMsg({ error: json.error ?? t("uploadFailed") });
    setMsg({ ok: t("uploaded", { title: json.title ?? "" }) });
    setOpen(false);
    onUploaded();
  });
  return (
    <form action={submit} className="form" style={{ marginTop: 10 }}>
      <label>{t("title")}<input name="title" required placeholder={t("titlePlaceholder", { name: personName })} /></label>
      <div className="row">
        <label>{t("kind")}
          <select name="kind" defaultValue="photo">
            {DOC_KINDS.map((k) => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}
          </select>
        </label>
        <label>{t("date")}<input name="dateText" placeholder={t("datePlaceholder")} /></label>
      </div>
      <label>{t("description")}<textarea name="description" style={{ minHeight: 60 }} /></label>
      <label>{t("file")}<input type="file" name="file" required accept="image/*,application/pdf,audio/*" /></label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="asProfile" /> {t("asProfile")}</label>
      {msg.error && <p className="err">{msg.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? t("uploading") : t("upload")}</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>{t("cancel")}</button>
      </div>
      {msg.ok && <p className="muted">{msg.ok}</p>}
    </form>
  );
}

/** Ciornă de biografie scrisă de AI (Neon AI Gateway) din faptele fișei; editorii o pot păstra. */
export function BiographySuggest({ treeId, personId, canSave, onSaved }: { treeId: string; personId: string; canSave: boolean; onSaved: () => void }) {
  const t = useTranslations("Media");
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
      {!text && <div className="actions"><button className="btn" onClick={ask} disabled={pending}>{pending ? t("bioWriting") : t("bioSuggest")}</button></div>}
      {text && (
        <>
          <label>{t("bioDraft")}<textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} /></label>
          <div className="actions">
            {canSave && <button className="btn primary" onClick={save} disabled={pending}>{t("bioKeep")}</button>}
            <button className="btn" onClick={ask} disabled={pending}>{t("bioAgain")}</button>
            <button className="btn" onClick={() => setText("")}>{t("cancel")}</button>
          </div>
        </>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  );
}

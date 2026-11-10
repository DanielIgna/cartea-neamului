"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { deleteHouse, saveHouse } from "@/app/casa-actions";
import { MAX_HOUSE_PHOTOS, type HouseView, type HouseVisibility } from "@/lib/old-house-shared";
import { partnerUrl } from "@/lib/partners-shared";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { uploadForMemory } from "./VoiceRecorder";

/**
 * „Casa bătrânească” pe pagina unui om: casele pe care le poate vedea cel care se uită și, pentru cine poate adăuga în arbore,
 * formularul. Sub case, o legătură discretă spre PropManage: doar un link extern cu UTM, fără nicio dată trimisă.
 */
export default function OldHouse({ treeId, personId, name, houses, canAdd, canEditOrphans, storage, living }: {
  treeId: string; personId: string; name: string; houses: HouseView[]; canAdd: boolean; canEditOrphans: boolean; storage: boolean; living: boolean;
}) {
  const t = useTranslations("OldHouse");
  const [editing, setEditing] = useState<HouseView | "new" | null>(null);
  const mineExists = houses.some((h) => h.mine);
  if (!houses.length && !canAdd) return null;
  return (
    <div className="card old-house" id="casa">
      <div className="section-label" style={{ marginTop: 0 }}>{t("title")}</div>
      {!houses.length && !editing && <p className="muted">{t("intro", { name })}</p>}
      {houses.map((h) => editing !== "new" && editing?.id === h.id
        ? <HouseForm key={h.id} treeId={treeId} personId={personId} edit={h} storage={storage} living={living} onDone={() => setEditing(null)} />
        : <HouseCard key={h.id} treeId={treeId} h={h} canEdit={h.mine || (h.orphan && canEditOrphans)} onEdit={() => setEditing(h)} />)}
      {editing === "new" && <HouseForm treeId={treeId} personId={personId} storage={storage} living={living} onDone={() => setEditing(null)} />}
      {canAdd && !mineExists && !editing && (
        <div className="actions"><button type="button" className="btn" onClick={() => setEditing("new")}>{t("add")}</button></div>
      )}
      {houses.length > 0 && (
        <p className="partner-note">{t.rich("partner", {
          link: (c) => <a href={partnerUrl("casa-batraneasca")} target="_blank" rel="noopener noreferrer">{c}</a>,
        })}</p>
      )}
    </div>
  );
}

function HouseCard({ treeId, h, canEdit, onEdit }: { treeId: string; h: HouseView; canEdit: boolean; onEdit: () => void }) {
  const t = useTranslations("OldHouse");
  const [ask, setAsk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const built = h.builtBy && h.builtYear ? `${t("builtByLine", { who: h.builtBy })} ${t("builtInLine", { year: String(h.builtYear) })}`
    : h.builtBy ? t("builtByLine", { who: h.builtBy }) : h.builtYear ? t("builtInOnly", { year: String(h.builtYear) }) : null;
  return (
    <article className="house">
      {h.place && <h3 className="house-place">{h.place}</h3>}
      {built && <div className="meta">{built}</div>}
      {h.photoIds.length > 0 && (
        <div className="house-photos">
          {h.photoIds.map((id) => <a key={id} href={`/api/document/${id}`} target="_blank" rel="noopener"><img src={`/api/document/${id}`} alt="" loading="lazy" /></a>)}
        </div>
      )}
      {h.story && <p className="bio">{h.story}</p>}
      <div className="muted house-foot">
        {h.visibility === "private" ? t("draft") : t(`vis.${h.visibility}`)}
        {h.author && !h.mine ? ` · ${t("writtenBy", { name: h.author })}` : ""}
      </div>
      {canEdit && !ask && (
        <div className="actions">
          <button type="button" className="btn" onClick={onEdit}>{t("edit")}</button>
          <button type="button" className="btn" onClick={() => setAsk(true)}>{t("remove")}</button>
        </div>
      )}
      {ask && (
        <div className="confirm">
          {t("confirmRemove")}
          <div className="actions">
            <button type="button" className="btn danger" disabled={pending} onClick={() => start(async () => {
              const r = await deleteHouse({ treeId, id: h.id });
              if (r.error) return setErr(r.error);
              router.refresh();
            })}>{t("yes")}</button>
            <button type="button" className="btn" disabled={pending} onClick={() => setAsk(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}
      {err && <p className="err" role="alert">{err}</p>}
    </article>
  );
}

function HouseForm({ treeId, personId, edit, storage, living, onDone }: {
  treeId: string; personId: string; edit?: HouseView; storage: boolean; living: boolean; onDone: () => void;
}) {
  const t = useTranslations("OldHouse"), tv = useTranslations("Voice");
  const [pending, start] = useTransition();
  const [stage, setStage] = useState<"save" | "upload">("save");
  const [err, setErr] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>(edit?.photoIds ?? []);
  const [files, setFiles] = useState<File[]>([]);
  // Adresa unei case în care locuiește cineva în viață o vede, de la sine, doar familia apropiată.
  const [visibility, setVisibility] = useState<HouseVisibility>(edit?.visibility ?? (living ? "close" : "tree"));
  const router = useRouter();
  const room = MAX_HOUSE_PHOTOS - kept.length - files.length;

  const submit = (form: FormData) => start(async () => {
    setErr(null);
    const place = String(form.get("place") ?? "").trim(), story = String(form.get("story") ?? "").trim();
    if (!place && !story) return setErr(t("errors.empty"));
    const yearText = String(form.get("builtYear") ?? "").trim();
    const builtYear = yearText ? Number(yearText) : null;
    if (yearText && !Number.isInteger(builtYear)) return setErr(t("errors.badYear"));
    const ids = [...kept];
    if (files.length) setStage("upload");
    for (const f of files) {
      const small = await shrinkPhoto(f);
      const r = await uploadForMemory(treeId, personId, small, small.name, "photo", t("photoTitle", { label: place || story.slice(0, 60) }), tv("uploadPhotoFailed"));
      if (r.error) { setStage("save"); return setErr(r.error); }
      ids.push(r.id!);
    }
    setStage("save");
    const r = await saveHouse({ treeId, personId, id: edit?.id, place, builtBy: String(form.get("builtBy") ?? ""), builtYear, story, photoIds: ids, visibility });
    if (r.error) return setErr(r.error);
    router.refresh();
    onDone();
  });

  return (
    <form action={submit} className="form house-form">
      <label>{t("place")}<input name="place" defaultValue={edit?.place ?? ""} maxLength={300} placeholder={t("placeHint")} /></label>
      <div className="house-row">
        <label>{t("builtBy")}<input name="builtBy" defaultValue={edit?.builtBy ?? ""} maxLength={300} /></label>
        <label className="house-year">{t("builtYear")}<input name="builtYear" type="number" inputMode="numeric" min={1000} max={2100} defaultValue={edit?.builtYear ?? ""} /></label>
      </div>
      <label>{t("story")}<textarea name="story" rows={5} defaultValue={edit?.story ?? ""} maxLength={20000} /></label>
      <div>
        <div className="label-like">{t("photos")}</div>
        {(kept.length > 0 || files.length > 0) && (
          <div className="house-photos">
            {kept.map((id) => (
              <span key={id} className="house-thumb">
                <img src={`/api/document/${id}`} alt="" />
                <button type="button" className="linkish" onClick={() => setKept(kept.filter((x) => x !== id))}>{t("removePhoto")}</button>
              </span>
            ))}
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="house-thumb">
                <span className="house-file">{f.name}</span>
                <button type="button" className="linkish" onClick={() => setFiles(files.filter((_, j) => j !== i))}>{t("removePhoto")}</button>
              </span>
            ))}
          </div>
        )}
        {storage ? room > 0 && (
          <label className="btn" style={{ display: "inline-block", marginTop: 6 }}>
            {t("addPhotos")}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length > room) setErr(t("errors.tooManyPhotos", { max: String(MAX_HOUSE_PHOTOS) }));
              setFiles([...files, ...picked.slice(0, room)]);
              e.target.value = "";
            }} />
          </label>
        ) : <p className="muted">{t("noStorage")}</p>}
      </div>
      <fieldset className="vis">
        <legend>{t("seeIt")}</legend>
        {(["tree", "close", "private"] as const).map((v) => (
          <label key={v} className="radio"><input type="radio" name="vis" checked={visibility === v} onChange={() => setVisibility(v)} /> {t(`vis.${v}`)}</label>
        ))}
      </fieldset>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? (stage === "upload" ? t("uploading") : t("saving")) : t("save")}</button>
        <button type="button" className="btn" disabled={pending} onClick={onDone}>{t("cancel")}</button>
      </div>
    </form>
  );
}

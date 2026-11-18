"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "use-intl";
import { dismissArchiveHint } from "@/app/surse-actions";
import { aratamSugestia, dateDeCautare, lipsuri, recomanda, type Loc, type Sursa } from "@/lib/surse-publice";
import type { PersonView } from "@/lib/tree-data";
import { isPlaceholder } from "@/lib/family";

type Props = {
  treeId: string; p: PersonView; parents: number; partners: number; origin: Loc | null; sources: Sursa[];
  canEdit: boolean; onFound: () => void; dismissed: boolean;
  /** Ținutul nașterii se caută încă pe server: așteptăm, ca lista să nu se schimbe sub ochii omului. */
  loading?: boolean;
};

/**
 * „Caută în arhive publice” (src/lib/surse-publice.ts): un card discret în fișa unui strămoș născut înainte de 1930 (sau fără an)
 * căruia îi lipsesc date. Arată ce să cauți și unde; linkurile duc pe site-urile arhivelor, într-o filă nouă, fără nimic din
 * arbore în adresă. Datele se copiază de om, cu „Copiază datele”.
 */
export default function ArchiveHint({ treeId, p, parents, partners, origin, sources, canEdit, onFound, dismissed, loading }: Props) {
  const t = useTranslations("Archives"), locale = useLocale();
  const [hidden, setHidden] = useState(dismissed);
  const [note, setNote] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const om = { givenName: p.givenName, surname: p.surname, birthYear: p.birthYear, birthPlace: p.birthPlace, living: p.living, deathText: p.deathText, parents, partners, placeholder: isPlaceholder(p.givenName) };
  const list = recomanda(sources, origin);
  if (hidden) return note ? <p className="muted archive-hint-note" role="status">{note}</p> : null;
  if (loading || !aratamSugestia(om) || !list.length) return null;
  const missing = lipsuri(om).map((k) => t(`missing.${k}`)).join(", ");
  const text = dateDeCautare(p, { surname: t("surname"), given: t("given"), place: t("place"), year: t("year") });
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setNote(t("copied")); } catch { setNote(t("copyFailed")); }
  };
  const hide = () => start(async () => {
    const r = await dismissArchiveHint(treeId, p.id);
    if ("ok" in r) { setNote(t("hidden", { name: p.givenName })); setHidden(true); }
  });
  return (
    <section className="archive-hint" aria-labelledby={`ah-${p.id}`} data-testid="archive-hint">
      <div className="section-label" id={`ah-${p.id}`} style={{ marginTop: 0 }}>{t("title")}</div>
      <p className="archive-hint-intro">{t("intro", { name: p.givenName, missing })}</p>
      <div className="archive-hint-what">
        <b>{t("whatToSearch")}</b>
        <pre data-testid="archive-hint-data">{text}</pre>
        <button type="button" className="btn small" onClick={copy}>{t("copy")}</button>
      </div>
      <b>{t("where")}</b>
      <ul className="archive-hint-list">
        {list.map((s, i) => (
          <li key={s.id}>
            <span><a href={s.url} target="_blank" rel="noopener noreferrer">{s.nume}</a>
              <span className="muted"> · {s.perioada}{s.cont ? ` · ${t("account")}` : ""} <span className="sr-only">({t("newTab")})</span></span></span>
            {/* Cardul rămâne discret: doar primul sfat; toate sfaturile sunt pe /surse-publice. */}
            {i === 0 && s.sfat && <small className="muted">{s.sfat}</small>}
            {s.citare && <small className="archive-cite">{s.citare}</small>}
          </li>
        ))}
      </ul>
      {locale !== "ro" && <small className="muted">{t("textsInRo")}</small>}
      <small className="muted">{t("privacy")} <a href="/surse-publice" target="_blank" rel="noopener">{t("allSources")}</a></small>
      {note && <p className="ok-note" role="status">{note}</p>}
      <div className="actions">
        {canEdit && <button type="button" className="btn primary small" onClick={onFound}>{t("found")}</button>}
        <button type="button" className="btn small" disabled={busy} onClick={hide}>{t("hide")}</button>
      </div>
    </section>
  );
}

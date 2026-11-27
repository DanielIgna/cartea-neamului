"use client";
import { useActionState, useState } from "react";
import { saveProductAction, type SaveState } from "@/app/invitatii-nunta-actions";
import { FORMATS, INVITATION_LANGS, slugify, type ProductText, type ShopModel, type TextLocale } from "@/lib/invitatii-nunta";

type Field = { k: keyof ProductText; label: string; hint?: string; long?: boolean; rows?: number; max: number };
const FIELDS: Field[] = [
  { k: "name", label: "Numele modelului", hint: "De pildă „Maramureș”.", max: 80 },
  { k: "title", label: "Titlul paginii (H1)", hint: "Gol = numele. De pildă „Invitație de nuntă Maramureș, cu motive populare”.", max: 140 },
  { k: "tagline", label: "Descrierea scurtă", hint: "O frază, sub titlu și pe lista modelelor.", long: true, rows: 2, max: 300 },
  { k: "description", label: "Descrierea lungă", hint: "Un rând gol între paragrafe.", long: true, rows: 6, max: 5000 },
  { k: "colors", label: "Variantele de culoare", hint: "Separate prin „;”. De pildă: roșu-negru pe crem; întunecată, cu accente aurii.", max: 300 },
  { k: "metaTitle", label: "Titlul pentru Google (SEO)", hint: "Cel mult ~60 de semne. Gol = titlul paginii.", max: 80 },
  { k: "metaDescription", label: "Descrierea pentru Google (SEO)", hint: "Cam 150 de semne. Gol = descrierea scurtă.", long: true, rows: 2, max: 220 },
];
const LANG_RO: Record<string, string> = { ro: "română", en: "engleză", it: "italiană", es: "spaniolă", de: "germană", fr: "franceză", hu: "maghiară" };
const money = (n: number) => String(n).replace(".", ",");

/**
 * Formularul unui model din Admin → Invitații de nuntă: numele (slugul se face singur din el, până îl schimbi de mână), regiunea,
 * prețurile, limbile și formatele invitației, apoi textele în română (obligatorii) și, dacă vrei, în celelalte limbi ale site-ului.
 */
export default function InvitatieForm({ model, locales, slugLocked }: { model?: ShopModel & { sort?: number }; locales: { code: TextLocale; name: string }[]; slugLocked?: boolean }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProductAction, null);
  const [name, setName] = useState(model?.texts.ro?.name ?? "");
  const [slug, setSlug] = useState(model?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!model);
  const t = (l: TextLocale, k: keyof ProductText) => model?.texts[l]?.[k] ?? "";

  const textFields = (l: TextLocale) => FIELDS.map((f) => {
    const id = `t-${l}-${f.k}`;
    const common = { id, name: `t.${l}.${f.k}`, maxLength: f.max, required: l === "ro" && (f.k === "name" || f.k === "tagline" || f.k === "description") };
    return (
      <div key={id} className="field">
        <label htmlFor={id}>{f.label}{common.required ? " *" : ""}</label>
        {l === "ro" && f.k === "name"
          ? <input {...common} value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched && !slugLocked) setSlug(slugify(e.target.value)); }} />
          : f.long ? <textarea {...common} rows={f.rows} defaultValue={t(l, f.k)} /> : <input {...common} defaultValue={t(l, f.k)} />}
        {f.hint && l === "ro" && <small className="muted">{f.hint}</small>}
      </div>
    );
  });

  return (
    <form action={action} className="stack shopadm-form">
      {model && <input type="hidden" name="rid" value={model.id} />}
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Date de bază</h2>
        <div className="shopadm-grid">
          <div className="field">
            <label htmlFor="slug">Slug (adresa paginii) *</label>
            <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} value={slug} readOnly={slugLocked}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} />
            <small className="muted">{slugLocked ? "Nu se mai schimbă: modelul are deja fișier ZIP sau vânzări." : `carteaneamului.ro/invitatii-nunta/${slug || "…"}`}</small>
          </div>
          <div className="field">
            <label htmlFor="region">Regiunea</label>
            <input id="region" name="region" maxLength={80} defaultValue={model?.region ?? ""} placeholder="Bucovina" />
          </div>
          <div className="field">
            <label htmlFor="priceRon">Preț în lei (pagina în română) *</label>
            <input id="priceRon" name="priceRon" required inputMode="decimal" defaultValue={money(model?.priceLei ?? 45)} />
          </div>
          <div className="field">
            <label htmlFor="priceEur">Preț în euro (celelalte limbi) *</label>
            <input id="priceEur" name="priceEur" required inputMode="decimal" defaultValue={money(model?.priceEur ?? 9)} />
          </div>
          <div className="field">
            <label htmlFor="sort">Ordinea în listă</label>
            <input id="sort" name="sort" type="number" min={0} max={9999} defaultValue={model?.sort ?? 0} />
            <small className="muted">Numerele mici apar primele.</small>
          </div>
        </div>
        <fieldset className="shopadm-checks">
          <legend>Limbile din fișierele invitației</legend>
          {INVITATION_LANGS.map((l) => (
            <label key={l} className="check"><input type="checkbox" name="languages" value={l} defaultChecked={model ? model.languages.includes(l) : true} /> {LANG_RO[l]}</label>
          ))}
        </fieldset>
        <fieldset className="shopadm-checks">
          <legend>Formatele</legend>
          {Object.entries(FORMATS).map(([k, label]) => (
            <label key={k} className="check"><input type="checkbox" name="formats" value={k} defaultChecked={model ? model.formats.includes(k) : k === "5x7" || k === "A5"} /> {label}</label>
          ))}
        </fieldset>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Textele în română</h2>
        {textFields("ro")}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Celelalte limbi (opțional)</h2>
        <p className="muted">O limbă completată primește pagina ei (de pildă /it/invitatii-nunta/{slug || "…"}) și intră în Google în limba aceea. O limbă lăsată goală arată textul românesc și nu intră în Google.</p>
        {locales.filter((l) => l.code !== "ro").map((l) => (
          <details key={l.code} className="shopadm-lang">
            <summary>{l.name}{model?.texts[l.code]?.name ? " ✓" : ""}</summary>
            {textFields(l.code)}
          </details>
        ))}
      </div>
      <p><button type="submit" className="btn primary" disabled={pending}>{pending ? "Se salvează…" : model ? "Salvează schimbările" : "Creează modelul (ciornă)"}</button></p>
    </form>
  );
}

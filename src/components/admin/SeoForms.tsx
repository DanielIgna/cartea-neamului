"use client";
import { useActionState, useState, useTransition } from "react";
import { saveSeoSetup, submitSitemapNow, type AdminFormState } from "@/app/admin-actions";

/** Setările SEO: codul de verificare Google, proprietatea, cuvintele urmărite și cheia Search Console. */
export function SeoSetupForm({ verification, siteUrl, sites, watch, keySource, keyEmail }: {
  verification: string | null; siteUrl: string | null; sites: string[]; watch: string[];
  keySource: "vercel" | "panou" | null; keyEmail: string | null;
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveSeoSetup, null);
  return (
    <form action={action} className="form stack" style={{ gap: 14 }}>
      <label>Cuvinte pe care vrei să le urmărești
        <textarea name="watch" rows={4} defaultValue={watch.join("\n")} placeholder={"arbore genealogic\ncartea neamului\narbore genealogic online"} />
        <small className="muted">unul pe rând; le vezi mai sus, cu locul în Google, chiar și când nu apari încă pentru ele</small>
      </label>
      <label>Codul de verificare Google (meta tag)
        <input name="verification" defaultValue={verification ? `<meta name="google-site-verification" content="${verification}" />` : ""}
          placeholder={'<meta name="google-site-verification" content="…" />'} autoComplete="off" spellCheck={false} />
        <small className="muted">din Search Console → Adaugă proprietate → Prefix URL → Etichetă HTML; după salvare apare pe prima pagină</small>
      </label>
      {sites.length > 1 && (
        <label>Proprietatea din Search Console
          <select name="siteUrl" defaultValue={siteUrl ?? ""}>
            <option value="">aleg eu singur (domeniul site-ului)</option>
            {sites.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}
      {sites.length <= 1 && <input type="hidden" name="siteUrl" value={siteUrl ?? ""} />}
      <label>Cheia Search Console (fișierul .json al contului de serviciu)
        <textarea name="credentials" rows={3} placeholder={keySource ? "lasă gol ca să rămână cheia de acum" : '{ "type": "service_account", … }'} autoComplete="off" spellCheck={false} />
        <small className="muted">
          {keySource === "vercel" ? `Folosesc cheia din Vercel (${keyEmail}).`
            : keySource === "panou" ? `Cheie pusă: ${keyEmail}. Se păstrează criptată.`
            : "Se păstrează criptată; doar tu o poți schimba."}
        </small>
      </label>
      {keySource === "panou" && <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="removeKey" style={{ width: "auto" }} /> Șterge cheia pusă aici</label>}
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? "Salvez…" : "Salvează"}</button>
        <span role="status" className={state?.error ? "err" : "muted"}>{state?.error ?? state?.ok ?? ""}</span>
      </div>
    </form>
  );
}

export function SubmitSitemapButton() {
  const [msg, setMsg] = useState<AdminFormState>(null);
  const [pending, start] = useTransition();
  return (
    <div className="actions" style={{ marginTop: 8 }}>
      <button className="btn" disabled={pending} onClick={() => start(async () => setMsg(await submitSitemapNow()))}>
        {pending ? "Trimit…" : "Trimite sitemap-ul la Google"}
      </button>
      <span role="status" className={msg?.error ? "err" : "muted"}>{msg?.error ?? msg?.ok ?? ""}</span>
    </div>
  );
}

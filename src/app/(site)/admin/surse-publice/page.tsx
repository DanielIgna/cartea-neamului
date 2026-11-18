import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { GRUP_TITLU, SURSE } from "@/lib/surse-publice";
import { schimbari, surse } from "@/lib/surse-publice-db";
import { automationSwitches } from "@/lib/autonomie";
import { resetSursa, saveSursa, toggleSursa } from "@/app/surse-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Surse publice · Admin" };

/**
 * Admin → Surse publice: sursele din ghidul /surse-publice și din cardul „Caută în arhive publice” din arbore. Fiecare se
 * poate opri, muta în listă sau corecta (nume, descriere, adresă, perioadă, sfat), fără publicare; „Ca la început” o pune
 * înapoi cum e în cod (src/lib/surse-publice.ts). O sursă nouă se adaugă în cod, ca să aibă și grupa și regiunile ei.
 */
export default async function AdminSurse({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/surse-publice");
  const q = await searchParams;
  const [list, ch, sw] = await Promise.all([surse(db), schimbari(db), automationSwitches(db).catch(() => null)]);
  const pornite = list.filter((s) => s.activ).length;
  return (
    <section className="stack">
      <AdminNav active="surse-publice" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Surse publice</h2>
        <p className="muted" style={{ maxWidth: "80ch" }}>
          Arhivele și site-urile din <a href="/surse-publice" target="_blank">Unde îți cauți strămoșii gratuit</a> și din cardul „Caută în arhive publice”
          din arbore. Site-ul doar trimite oamenii acolo, cu link într-o filă nouă; nu preia, nu copiază și nu arată date de pe ele și nu pune în adresă
          nimic din arborii oamenilor. Instituțiile sunt citate ca surse, nu ca parteneri. Schimbările de aici se văd pe pagina publică în cel mult 10 minute.
        </p>
        <p><b>{pornite}</b> surse pornite din {list.length}. Emailul „Ai strămoși înainte de 1930?” e <b>{sw?.["surse-publice"] ? "pornit" : "oprit"}</b> (Admin → Autonomie).</p>
        {q.eroare && <p className="err">{q.eroare}</p>}
        {q.salvat && <p className="ok-box">Am salvat „{SURSE.find((s) => s.id === q.salvat)?.nume ?? q.salvat}”.</p>}
      </div>
      {list.map((s, i) => (
        <div className="card" key={s.id} id={s.id} style={{ opacity: s.activ ? 1 : 0.7 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
            <b>{i + 1}. {s.nume}</b>
            <span className="chip">{GRUP_TITLU[s.grup]}</span>
            <span className="chip">{s.gratuit ? "gratuit" : "cu plată"}{s.cont ? ", cu cont" : ""}</span>
            <span className={`chip${s.activ ? " ok" : ""}`}>{s.activ ? "pornită" : "oprită"}</span>
            {ch[s.id] && <span className="chip">schimbată din Admin</span>}
            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14 }}>{s.url}</a>
          </div>
          <form action={toggleSursa} style={{ display: "inline" }}>
            <input type="hidden" name="id" value={s.id} /><input type="hidden" name="activ" value={s.activ ? "0" : "1"} />
            <button className="btn" style={{ marginTop: 8 }}>{s.activ ? "Oprește" : "Pornește"}</button>
          </form>
          <details style={{ marginTop: 8 }}>
            <summary>Editează</summary>
            <form action={saveSursa} className="form limits-form">
              <input type="hidden" name="id" value={s.id} />
              <div className="limits-row">
                <label>Nume<input name="nume" defaultValue={s.nume} required maxLength={160} /></label>
                <label>Adresa (https://)<input name="url" type="url" defaultValue={s.url} required maxLength={500} /></label>
              </div>
              <label>Descriere scurtă<textarea name="descriere" defaultValue={s.descriere} required maxLength={600} /></label>
              <div className="limits-row">
                <label>Perioada<input name="perioada" defaultValue={s.perioada} maxLength={120} /></label>
                <label>Ordinea<input name="ordine" type="number" defaultValue={ch[s.id]?.ordine ?? i + 1} /></label>
                <label className="check"><input type="checkbox" name="activ" defaultChecked={s.activ} /> Pornită</label>
              </div>
              <label>Sfat de căutare<textarea name="sfat" defaultValue={s.sfat ?? ""} maxLength={600} /></label>
              <label>Notă<input name="nota" defaultValue={s.nota ?? ""} maxLength={300} /></label>
              {s.citare && <p className="muted" style={{ fontSize: 14 }}>Mențiunea sursei (fixă, cerută de ei): {s.citare}</p>}
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary">Salvează</button>
                {ch[s.id] && <button className="btn" formAction={resetSursa}>Ca la început</button>}
              </div>
            </form>
          </details>
        </div>
      ))}
    </section>
  );
}

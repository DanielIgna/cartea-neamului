import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { dnaLabs, dnaRequests } from "@/lib/resurse";
import { AdminNav } from "@/components/admin/ui";
import { removeDnaLab, removeDnaRequest, saveDnaLab, toggleDnaRequest } from "@/app/adn-admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test ADN · Admin" };

const when = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);

/**
 * „Vreau un test ADN”: cererile venite de pe /resurse-genealogie și lista de laboratoare arătată acolo. Cererile au doar date
 * de contact și un mesaj (fără date genetice); nu se trimit nicăieri automat. Răspunzi tu, pe email, și le ștergi la cerere.
 */
export default async function AdminAdn({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/adn");
  const q = await searchParams;
  const [requests, labs] = await Promise.all([dnaRequests(db), dnaLabs(db)]);
  const open = requests.filter((r) => !r.resolvedAt).length;
  const labForm = (l?: (typeof labs)[number]) => (
    <form action={saveDnaLab} className="form limits-form" key={l?.id ?? "nou"}>
      {l && <input type="hidden" name="id" value={l.id} />}
      <div className="limits-row">
        <label>Nume<input name="name" defaultValue={l?.name} required maxLength={120} /></label>
        <label>Oraș<input name="city" defaultValue={l?.city ?? ""} maxLength={120} /></label>
        <label>Adresa (https://)<input name="url" type="url" defaultValue={l?.url} required maxLength={500} /></label>
      </div>
      <div className="limits-row">
        <label>Nota de preț<input name="priceNote" defaultValue={l?.priceNote ?? ""} maxLength={200} placeholder="de pildă „de la 1.390 lei (preț afișat de laborator)”" /></label>
        <label>Ordinea<input name="position" type="number" defaultValue={l?.position ?? labs.length + 1} /></label>
        <label className="check"><input type="checkbox" name="visible" defaultChecked={l ? l.visible : true} /> Se vede pe pagină</label>
      </div>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary">{l ? "Salvează" : "Adaugă laboratorul"}</button>
        {l && <button className="btn" formAction={removeDnaLab}>Șterge</button>}
      </div>
    </form>
  );
  return (
    <section className="stack">
      <AdminNav active="adn" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Test ADN: cereri și laboratoare</h2>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          Cererile vin din formularul „Vreau un test ADN” de pe <a href="/resurse-genealogie#test-adn" target="_blank">Resurse gratuite pentru genealogie</a>.
          Au doar nume, email, telefon (dacă l-au dat), oraș și mesaj, cu acordul bifat și data lui. Nu se trimite nimic la laboratoare; răspunzi tu,
          pe email. Dacă omul cere, îi ștergi cererea de aici. Site-ul nu vinde teste, nu ia comision și nu păstrează date genetice.
        </p>
        <p><b>{open}</b> {open === 1 ? "cerere deschisă" : "cereri deschise"} din {requests.length}.</p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Data</th><th>Om</th><th>Oraș</th><th>Mesaj</th><th></th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={r.resolvedAt ? { opacity: 0.6 } : undefined}>
                  <td>{when(r.createdAt)}<small>acord: {when(r.consentAt)}</small></td>
                  <td>{r.name}<small><a href={`mailto:${r.email}`}>{r.email}</a>{r.phone ? ` · ${r.phone}` : ""}</small></td>
                  <td>{r.city}</td>
                  <td style={{ whiteSpace: "pre-wrap", maxWidth: "48ch" }}>{r.message}</td>
                  <td>
                    <form action={toggleDnaRequest} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="done" value={r.resolvedAt ? "0" : "1"} />
                      <button className="btn">{r.resolvedAt ? "Redeschide" : "Rezolvat"}</button>
                    </form>{" "}
                    <form action={removeDnaRequest} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={r.id} /><button className="btn">Șterge</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!requests.length && <tr><td colSpan={5} className="muted">Nicio cerere deocamdată.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Laboratoarele din listă</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Lista e informativă. Pune adresa paginii laboratorului fără coduri de urmărire sau afiliere (se scot singure la salvare).
          Prețurile sunt ale laboratoarelor; scrie-le ca notă, cu „se poate schimba”.
        </p>
        {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
        {q.salvat && <p className="muted" role="status">Salvat.</p>}
        {labs.map((l) => labForm(l))}
        <h4>Adaugă un laborator</h4>
        {labForm()}
      </div>
    </section>
  );
}

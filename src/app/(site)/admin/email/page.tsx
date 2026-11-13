import { requireAdmin } from "@/lib/admin-access";
import { domainEmail, evaluate, gmailLinks, mailbox, readDns } from "@/lib/email-domeniu";
import { reminderMailReady } from "@/lib/extra";
import { AdminNav, Status } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email · Admin" };

/** Înregistrările de pus în Vercel → Domains → carteaneamului.ro → DNS Records, exact cum le cere formularul de acolo. */
const RECORDS = [
  { name: "(gol, adică @)", type: "MX", value: "mx1.improvmx.com", prio: "10" },
  { name: "(gol, adică @)", type: "MX", value: "mx2.improvmx.com", prio: "20" },
  { name: "(gol, adică @)", type: "TXT", value: "v=spf1 include:spf.improvmx.com include:_spf.google.com ~all", prio: "" },
  { name: "_dmarc", type: "TXT", value: "v=DMARC1; p=none;", prio: "" },
];

/**
 * Admin → Email: adresa de pe domeniu (contact@carteaneamului.ro), legăturile spre căsuța Gmail în care ajunge totul și
 * verificarea înregistrărilor DNS. Mesajele din formularul de Contact vin tot în Gmail (nu le păstrăm în baza de date).
 */
export default async function AdminEmail() {
  await requireAdmin("/admin/email");
  const address = domainEmail();
  const box = mailbox();
  const g = gmailLinks(box);
  const checks = evaluate(await readDns());
  const ready = checks.filter((c) => c.key !== "resend").every((c) => c.ok);
  const contactForm = `${g.inbox.replace("#inbox", "")}#search/${encodeURIComponent('subject:"Cartea Neamului: mesaj de la"')}`;
  return (
    <section className="stack">
      <AdminNav active="email" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Email: {address}</h2>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          Ce vine pe <b>{address}</b> ajunge în Gmail-ul <b>{box}</b>. De acolo răspunzi și scrii tot cu {address}
          (alegi adresa la „De la”). Mesajele din formularul de <a href="/contact" target="_blank">Contact</a> vin în aceeași căsuță.
        </p>
        <p>
          {ready ? <Status ok>adresa primește emailuri</Status> : <Status ok={false} warn>încă nu e gata: lipsesc înregistrări mai jos</Status>}
        </p>
        <div className="actions">
          <a className="btn primary" href={g.inbox} target="_blank" rel="noreferrer">Deschide căsuța</a>
          <a className="btn" href={g.toDomain} target="_blank" rel="noreferrer">Primite pe {address}</a>
          <a className="btn" href={g.sent} target="_blank" rel="noreferrer">Trimise</a>
          <a className="btn" href={g.compose} target="_blank" rel="noreferrer">Scrie un email</a>
          <a className="btn" href={contactForm} target="_blank" rel="noreferrer">Mesaje din formularul de Contact</a>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Pe telefon: în aplicația Gmail apeși pe poza ta din dreapta sus → „Adaugă alt cont” → Google → {box}. Apoi alegi {address} la „De la” când scrii.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Verificare (citită acum din DNS)</h2>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Ce</th><th>Stare</th><th>Găsit</th><th>Trebuie</th></tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.key}>
                  <td>{c.label}</td>
                  <td>{c.ok ? <Status ok>bine</Status> : <Status ok={false} warn={c.key === "dmarc" || c.key === "resend"}>lipsește</Status>}</td>
                  <td style={{ wordBreak: "break-all" }}><code>{c.found}</code></td>
                  <td style={{ wordBreak: "break-all" }}><code>{c.need}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Emailurile trimise de site singur (aducerea aminte de plată): {reminderMailReady() ? <Status ok>Resend e pus</Status> : <Status ok={false} warn>Resend nu e pus încă (opțional)</Status>}
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Înregistrările de pus în Vercel</h2>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          <a href="https://vercel.com/dashboard/domains" target="_blank" rel="noreferrer">Vercel → Domains</a> → carteaneamului.ro → „Add” (DNS Record), câte una.
          Dacă există deja un TXT care începe cu <code>v=spf1</code>, îl ștergi: trebuie să rămână unul singur.
        </p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Priority</th></tr></thead>
            <tbody>
              {RECORDS.map((r) => (
                <tr key={r.value}><td><code>{r.name}</code></td><td>{r.type}</td><td style={{ wordBreak: "break-all" }}><code>{r.value}</code></td><td>{r.prio}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Conturi folosite: <a href="https://app.improvmx.com/" target="_blank" rel="noreferrer">ImprovMX</a> (primire, gratuit) ·{" "}
          <a href={g.sendAs} target="_blank" rel="noreferrer">Gmail → Conturi → Trimite e-mailul ca</a> ·{" "}
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Parole pentru aplicații Google</a>
        </p>
      </div>
    </section>
  );
}

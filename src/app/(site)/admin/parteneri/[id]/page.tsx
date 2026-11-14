import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { COUNTIES } from "@/lib/place-key";
import { siteOrigin } from "@/lib/site";
import { CARD_ORIGIN, CATEGORIES, STAGES, STAGE_LABEL, batchList, partnerById, pl, type Stage } from "@/lib/carduri-cadou";
import { CHANNELS, contactsOf, crmPartners, monthOf, monthReport, refUrl, referralTotals } from "@/lib/parteneri-crm";
import { addContactAction, deleteContactAction, refCodeAction, saveCrmPartner, setPinCrm, setStageAction, stepDoneAction } from "@/app/parteneri-crm-actions";
import { createBatchAction } from "@/app/carduri-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partener · City Partners · Admin" };

const lei = (v: number) => `${new Intl.NumberFormat("ro", { maximumFractionDigits: 2 }).format(v)} lei`;
const when = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);
const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };

/** Fișa unui partener din City Partners: datele, etapa, următorul pas, istoricul de contact, vânzările, PIN-ul, kitul și loturile. */
export default async function PartnerCard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  await requireAdmin(`/admin/parteneri/${id}`);
  const q = await searchParams;
  const isNew = id === "nou";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = isNew ? null : await partnerById(db, id);
  if (!isNew && !p) notFound();
  const [rows, contacts, batches, refs, month, origin] = await Promise.all([
    p ? crmPartners(db) : Promise.resolve([]), p ? contactsOf(db, p.id) : Promise.resolve([]), p ? batchList(db) : Promise.resolve([]),
    referralTotals(db), p ? monthReport(db, monthOf()) : Promise.resolve([]), siteOrigin(),
  ]);
  const me = rows.find((r) => r.id === id);
  const mine = batches.filter((b) => b.partnerId === id);
  const m = month.find((r) => r.partnerId === id);
  const etapa = (p?.etapa ?? "prospect") as Stage;
  return (
    <section className="stack">
      <AdminNav active="parteneri" />
      <p><Link href="/admin/parteneri">← City Partners</Link></p>
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}

      {p && me && (
        <div className="card">
          <div className="crm-card-top"><h2 style={{ margin: 0 }}>{p.numeMagazin}</h2><span className={`crm-stage s-${etapa}`}>{STAGE_LABEL[etapa]}</span>{p.tip === "firma" && <span className="crm-stage">Firmă</span>}</div>
          <div className="crm-tiles" style={{ marginTop: 12 }}>
            <div><small>Vândute</small><b>{me.vandute}</b></div>
            <div><small>Activate</small><b>{me.activate}</b></div>
            <div><small>Conturi aduse</small><b>{refs.get(p.id) ?? 0}</b></div>
            <div><small>Comision de la început</small><b>{lei(me.comisionLei)}</b></div>
            <div><small>De plată luna asta</small><b>{lei(m?.total ?? 0)}</b></div>
            <div><small>Pornire</small><b>{me.onboarding}/5</b></div>
          </div>
          <ul className="crm-steps">{me.steps.map((s) => <li key={s.label} className={s.done ? "done" : ""}>{s.done ? "✓" : "○"} {s.label}</li>)}</ul>
          <h4>Mută în etapa</h4>
          <div className="crm-tabs">
            {STAGES.map((s) => (
              <form key={s} action={setStageAction} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="etapa" value={s} />
                <button className="btn" aria-current={s === etapa ? "page" : undefined} disabled={s === etapa}>{STAGE_LABEL[s]}</button>
              </form>
            ))}
          </div>
          <p className="muted"><small>Pagina partenerului și vânzarea merg doar în etapele „Agreat” și „Activ”.</small></p>
          {p.urmatorulPas && (
            <form action={stepDoneAction} className="crm-inline">
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="pas" value={p.urmatorulPas} />
              <span>Următorul pas: <b>{p.urmatorulPas}</b>{p.urmatorulPasLa ? ` (${when(p.urmatorulPasLa).split(",")[0]})` : ""}</span>
              <button className="btn" name="amana" value="0">Făcut</button><button className="btn" name="amana" value="1">Amână 7 zile</button>
            </form>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{p ? "Datele partenerului" : "Partener nou"}</h3>
        <form action={saveCrmPartner} className="form limits-form">
          {p && <input type="hidden" name="id" value={p.id} />}
          <div className="limits-row">
            <label>Numele (magazin sau firmă) *<input name="numeMagazin" defaultValue={p?.numeMagazin} required maxLength={160} /></label>
            <label>Tip
              <select name="tip" defaultValue={p?.tip ?? "magazin"}><option value="magazin">Magazin (vinde clienților)</option><option value="firma">Firmă (carduri pentru angajați)</option></select>
            </label>
            <label>Categoria
              <select name="categorie" defaultValue={p?.categorie ?? ""}><option value="">—</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label>Etapa
              <select name="etapa" defaultValue={etapa}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
            </label>
          </div>
          <div className="limits-row">
            <label>Persoana de contact<input name="persoanaContact" defaultValue={p?.persoanaContact ?? ""} maxLength={160} /></label>
            <label>Funcția<input name="functie" defaultValue={p?.functie ?? ""} maxLength={120} placeholder="de pildă: proprietar, manager" /></label>
            <label>Telefon<input name="telefon" type="tel" defaultValue={p?.telefon ?? ""} maxLength={40} /></label>
            <label>Email<input name="email" type="email" defaultValue={p?.email ?? ""} maxLength={200} /></label>
          </div>
          <div className="limits-row">
            <label>Oraș<input name="oras" defaultValue={p?.oras ?? ""} maxLength={120} /></label>
            <label>Județ
              <select name="judet" defaultValue={p?.judet ?? ""}><option value="">—</option>{Object.entries(COUNTIES).sort((a, b) => a[1].localeCompare(b[1], "ro")).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label>Adresa<input name="adresa" defaultValue={p?.adresa ?? ""} maxLength={300} /></label>
            <label>Website<input name="website" defaultValue={p?.website ?? ""} maxLength={300} placeholder="de pildă: librariax.ro" /></label>
          </div>
          <div className="limits-row">
            <label>Comision %<input name="comisionProcent" inputMode="decimal" defaultValue={String(p?.comisionProcent ?? 25)} /></label>
            <label>Plafon carduri digitale / 24 h<input name="plafonZi" type="number" min={0} max={1000} defaultValue={p?.plafonZi ?? 20} /></label>
            <label>De unde l-am găsit<input name="sursa" defaultValue={p?.sursa ?? ""} maxLength={200} placeholder="recomandare, Google Maps, târg..." /></label>
          </div>
          <div className="limits-row">
            <label>Următorul pas<input name="urmatorulPas" defaultValue={p?.urmatorulPas ?? ""} maxLength={300} placeholder="de pildă: sun marți să vorbim de afiș" /></label>
            <label>Până pe<input name="urmatorulPasLa" type="date" defaultValue={p?.urmatorulPasLa ? p.urmatorulPasLa.toISOString().slice(0, 10) : ""} /></label>
          </div>
          <label>Note<textarea name="note" defaultValue={p?.note ?? ""} rows={3} maxLength={2000} /></label>
          <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">{p ? "Salvează" : "Adaugă partenerul"}</button></div>
        </form>
      </div>

      {p && (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Istoric de contact</h3>
            <form action={addContactAction} className="form limits-form">
              <input type="hidden" name="id" value={p.id} />
              <div className="limits-row">
                <label>Fel<select name="canal" defaultValue="telefon">{Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label style={{ flex: 3 }}>Ce s-a vorbit<input name="nota" required maxLength={2000} placeholder="de pildă: vrea 20 de carduri digitale, trimit afișul" /></label>
              </div>
              <div className="actions" style={{ marginTop: 0 }}><button className="btn">Notează</button></div>
            </form>
            <ul className="crm-list">
              {contacts.map((c) => (
                <li key={c.id}>
                  <div><small className="muted">{when(c.at)} · {CHANNELS[c.canal] ?? c.canal}</small><br />{c.nota}</div>
                  <form action={deleteContactAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="logId" value={c.id} /><button className="btn" aria-label="Șterge">×</button></form>
                </li>
              ))}
              {!contacts.length && <li className="muted">Niciun contact notat încă.</li>}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Pagina partenerului și kitul de tipar</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Pe pagina lui, partenerul vinde și trimite carduri digitale (WhatsApp, SMS, email, QR pe ecran), marchează cardurile tipărite și își vede cifrele.
              {p.portalToken ? <> Legătura: <code style={{ wordBreak: "break-all" }}>{`${origin}/magazin/${p.portalToken}`}</code></> : " Legătura apare după ce pui un PIN."}
            </p>
            <form action={setPinCrm} className="form limits-form">
              <input type="hidden" name="id" value={p.id} />
              <div className="limits-row"><label>{p.pinHash ? "PIN nou (6–10 cifre)" : "PIN (6–10 cifre)"}<input name="pin" inputMode="numeric" pattern="\d{6,10}" required autoComplete="off" /></label></div>
              <div className="actions" style={{ marginTop: 0 }}><button className="btn">{p.pinHash ? "Schimbă PIN-ul" : "Pune PIN-ul"}</button></div>
            </form>
            <h4>Legătura de recomandare</h4>
            {p.refCode ? (
              <p>Conturile făcute după ce omul a deschis <code>{refUrl(CARD_ORIGIN, p.refCode)}</code> (sau a scanat QR-ul din kit), în 60 de zile, sunt trecute pe acest partener. <Link className="btn primary" href={`/admin/parteneri/${p.id}/kit`}>Kitul de tipar (afiș A4, autocolant, card)</Link></p>
            ) : (
              <form action={refCodeAction}><input type="hidden" name="id" value={p.id} /><button className="btn primary">Fă legătura de recomandare și kitul de tipar</button></form>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Loturi de carduri</h3>
            <form action={createBatchAction} className="form limits-form">
              <input type="hidden" name="partnerId" value={p.id} />
              <div className="limits-row">
                <label>Cantitate<input name="cantitate" type="number" min={1} max={1000} defaultValue={p.tip === "firma" ? 50 : 20} required /></label>
                <label>Planul<select name="plan" defaultValue="basic"><option value="basic">Basic</option><option value="familie">Familie</option><option value="premium">Premium</option></select></label>
                <label>Durata (luni)<input name="durataLuni" type="number" min={1} max={60} defaultValue={12} /></label>
                <label>Preț (lei)<input name="pretRaftLei" inputMode="decimal" defaultValue="49" /></label>
                <label className="check"><input type="checkbox" name="digital" defaultChecked /> Digital (fără tipar)</label>
              </div>
              <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">Generează lotul</button></div>
            </form>
            <ul className="crm-list">
              {mine.map((b) => (
                <li key={b.id}>
                  <div><b>{b.digital ? "Digital" : "Tipărit"}</b> · {pl(b.cantitate, "card", "carduri")} · {PLAN[b.plan] ?? b.plan} {b.durataLuni} luni · {b.pretRaftLei} lei<br />
                    <small className="muted">{when(b.createdAt)} · {pl(b.vandut, "vândut", "vândute")} · {pl(b.folosit, "folosit", "folosite")} · {pl(b.generat + b.livrat, "disponibil", "disponibile")}</small></div>
                  <Link className="btn" href={`/admin/carduri/lot/${b.id}`}>Deschide</Link>
                </li>
              ))}
              {!mine.length && <li className="muted">Niciun lot încă.</li>}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

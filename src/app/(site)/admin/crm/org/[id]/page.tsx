import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { COUNTIES } from "@/lib/place-key";
import { SITE_URL } from "@/lib/site-url";
import {
  ACTIVITY_LABEL, ACTIVITY_TYPES, DEAL_PRODUCTS, DEAL_PRODUCT_LABEL, DEAL_STAGES, DEAL_STAGE_LABEL, ORG_STATUSES, ORG_STATUS_LABEL, ORG_TYPE_LABEL,
  isActivityType, isOrgType,
} from "@/lib/crm";
import { orgDetail, whatsappLink } from "@/lib/crm-admin";
import { orgSends } from "@/lib/crm-campanii";
import { VIA_LABEL, moneyByOrg, orgAccountsList } from "@/lib/crm-bani";
import { school } from "@/db/schema";
import { closeTaskAction, gdprDeleteAction, gdprDeleteContactAction, linkSchoolAction, newTaskAction, orgCodeAction } from "@/app/crm-actions";
import { DUE_CHOICES, orgTasks } from "@/lib/crm-sarcini";

const AUTO_ACTIVITIES = new Set<string>(["email_livrat", "email_deschis", "email_click", "dezabonat"]);
const SEND_LABEL: Record<string, string> = { trimis: "Trimis", livrat: "Livrat", deschis: "Deschis", click: "Click", nelivrat: "Nelivrat", dezabonat: "Dezabonat", blocat: "Oprit (nu contacta)", eroare: "Eroare" };
import { addActivityAction, newDealAction, updateDealAction, updateOrgAction } from "@/app/crm-actions";
import { AdminNav, Stat, day, num } from "@/components/admin/ui";
import CopyLink from "@/components/admin/CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizație · CRM · Admin" };

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/** Fișa unei organizații din CRM: datele oficiale, istoricul, deal-urile și conturile venite pe linkul ei ?src=. */
export default async function OrgPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/crm/org/${id}`);
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [d, sends, money, brought, tasks, schools] = await Promise.all([orgDetail(db, id), orgSends(db, id), moneyByOrg(db, id), orgAccountsList(db, id), orgTasks(db, id), db.select({ id: school.id, name: school.name, locality: school.locality }).from(school).orderBy(school.name).limit(500)]);
  const m = money.get(id) ?? { accounts: 0, paidAccounts: 0, ron: 0, eur: 0, firstPaid: null };
  if (!d) notFound();
  const { org } = d;
  const link = d.src ? `${SITE_URL}/?src=${d.src}` : null;
  const wa = whatsappLink(org.telefon, `Bună ziua! Vă scriu de la Cartea Neamului (carteaneamului.ro), în legătură cu ${org.nume}.`);
  return (
    <section className="stack">
      <AdminNav active="crm" />
      <p><Link href="/admin/crm?t=organizatii">← Organizațiile</Link></p>
      {sp.ok && <p className="cc-ok" role="status">{sp.ok}</p>}
      <div className="card stack">
        <h2 style={{ margin: 0 }}>{org.nume}</h2>
        <div className="muted">{[isOrgType(org.tip) ? ORG_TYPE_LABEL[org.tip] : org.tip, org.localitate, org.judet && (COUNTIES[org.judet] ?? org.judet), org.tara].filter(Boolean).join(" · ")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {org.telefon && <a className="btn" href={`tel:${org.telefon.replace(/\s/g, "")}`}>Sună {org.telefon}</a>}
          {wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          {org.emailOficial && <a className="btn" href={`mailto:${org.emailOficial}`}>{org.emailOficial}</a>}
          {org.site && <a className="btn" href={org.site.startsWith("http") ? org.site : `https://${org.site}`} target="_blank" rel="noopener noreferrer">Site</a>}
          {link && <CopyLink url={link} label={`Copiază linkul ?src=${d.src}`} />}
        </div>
        {org.sursaDatelor && <small className="muted">Sursa datelor: {org.sursaDatelor}</small>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Date și status</h2>
        <form action={updateOrgAction} className="form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <input type="hidden" name="id" value={org.id} />
          <label>Status<select name="status" defaultValue={org.status}>{ORG_STATUSES.map((s) => <option key={s} value={s}>{ORG_STATUS_LABEL[s]}</option>)}</select></label>
          <label>Emailul oficial<input name="emailOficial" type="email" defaultValue={org.emailOficial ?? ""} /></label>
          <label>Telefon<input name="telefon" defaultValue={org.telefon ?? ""} /></label>
          <label>Site<input name="site" defaultValue={org.site ?? ""} /></label>
          <label>Localitatea<input name="localitate" defaultValue={org.localitate ?? ""} /></label>
          <label>Județul<select name="judet" defaultValue={org.judet ?? ""}><option value="">—</option>{Object.entries(COUNTIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Țara<input name="tara" defaultValue={org.tara} /></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="deSunat" defaultChecked={org.deSunat} /> De sunat</label>
          <label style={{ gridColumn: "1/-1" }}>Note<textarea name="note" defaultValue={org.note ?? ""} rows={3} /></label>
          <div><button className="btn primary">Salvează</button></div>
        </form>
        <small className="muted">„Nu contacta” pune și emailul oficial pe lista de suprimare.</small>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Deal-uri</h2>
        {d.deals.map((x) => (
          <form key={x.id} action={updateDealAction} className="form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 10 }}>
            <input type="hidden" name="deal" value={x.id} />
            <input type="hidden" name="back" value={`/admin/crm/org/${org.id}`} />
            <label>Produs<select name="produs" defaultValue={x.produs}>{DEAL_PRODUCTS.map((p) => <option key={p} value={p}>{DEAL_PRODUCT_LABEL[p]}</option>)}</select></label>
            <label>Etapa<select name="etapa" defaultValue={x.etapa}>{DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABEL[s]}</option>)}</select></label>
            <label>Conturi estimate<input name="conturiEstimate" type="number" min={0} defaultValue={x.conturiEstimate ?? ""} /></label>
            <label>Valoare (lei)<input name="valoareEstimata" type="number" min={0} defaultValue={x.valoareEstimata ?? ""} /></label>
            <label>Pasul următor<input name="urmatorulPas" defaultValue={x.urmatorulPas ?? ""} /></label>
            <label>Până la<input name="dataUrmatoruluiPas" type="date" defaultValue={iso(x.dataUrmatoruluiPas)} /></label>
            <div style={{ alignSelf: "end" }}><button className="btn">Salvează</button></div>
          </form>
        ))}
        <form action={newDealAction} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <input type="hidden" name="id" value={org.id} />
          <label>Deal nou<select name="produs" defaultValue={org.tip === "firma" ? "abonamente_firma" : org.tip === "librarie_magazin" ? "carduri_magazin" : "coduri_scoala"}>{DEAL_PRODUCTS.map((p) => <option key={p} value={p}>{DEAL_PRODUCT_LABEL[p]}</option>)}</select></label>
          <label>Conturi estimate<input name="conturiEstimate" type="number" min={0} style={{ width: 120 }} /></label>
          <label>Pasul următor<input name="urmatorulPas" /></label>
          <label>Până la<input name="dataUrmatoruluiPas" type="date" /></label>
          <button className="btn primary">Adaugă</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sarcini</h2>
        <form action={newTaskAction} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
          <input type="hidden" name="id" value={org.id} />
          <label style={{ flex: "1 1 240px" }}>Ce e de făcut<input name="titlu" maxLength={300} required placeholder="Sună la secretariat" /></label>
          <label>Când<select name="cand" defaultValue="maine">{DUE_CHOICES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
          <label>sau data<input type="date" name="data" /></label>
          <button className="btn primary">Pune sarcina</button>
        </form>
        {tasks.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>{tasks.map((t) => (
                <tr key={t.id}>
                  <td className="tight">{day(t.scadenta.toISOString())}</td>
                  <td>{t.titlu}{t.sursa !== "manual" && <small> automat</small>}</td>
                  <td className="tight">{t.status === "deschisa" ? (
                    <form action={closeTaskAction} style={{ display: "flex", gap: 6 }}>
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={`/admin/crm/org/${org.id}`} />
                      <button className="btn primary" name="status" value="facuta">Făcut</button><button className="btn" name="status" value="anulata">Anulează</button>
                    </form>
                  ) : <span className="pill">{t.status === "facuta" ? "făcută" : "anulată"}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ marginBottom: 0 }}>Nicio sarcină.</p>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Istoric</h2>
        <form action={addActivityAction} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
          <input type="hidden" name="id" value={org.id} />
          <label>Ce<select name="tip" defaultValue="nota">{ACTIVITY_TYPES.filter((t) => !AUTO_ACTIVITIES.has(t)).map((t) => <option key={t} value={t}>{ACTIVITY_LABEL[t]}</option>)}</select></label>
          <label style={{ flex: "1 1 260px" }}>Pe scurt<input name="rezumat" maxLength={2000} required /></label>
          <button className="btn primary">Trece în istoric</button>
        </form>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {d.activities.map((a) => (
                <tr key={a.id}>
                  <td className="tight">{day(a.at.toISOString(), true)}</td>
                  <td className="tight"><span className="pill">{isActivityType(a.tip) ? ACTIVITY_LABEL[a.tip] : a.tip}</span>{(a.meta as { clasificare?: string } | null)?.clasificare && <small>{(a.meta as { clasificare: string }).clasificare}</small>}</td>
                  <td>{a.rezumat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!d.activities.length && <p className="muted">Nimic încă.</p>}
      </div>

      {sends.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Emailuri de campanie</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Trimis</th><th>Campania</th><th>Stare</th><th>Deschis</th><th>Click</th><th>Răspuns</th></tr></thead>
              <tbody>{sends.map(({ s, campanie }) => (
                <tr key={s.id}>
                  <td className="tight">{day(s.sentAt.toISOString(), true)}{s.pas === 2 && <small> follow-up</small>}</td>
                  <td>{campanie}</td>
                  <td className="tight"><span className="pill">{SEND_LABEL[s.status] ?? s.status}</span>{s.motiv && <small> {s.motiv}</small>}</td>
                  <td className="tight">{s.openedAt ? day(s.openedAt.toISOString(), true) : "—"}</td>
                  <td className="tight">{s.clicks ? num(s.clicks) : "—"}</td>
                  <td className="tight">{s.repliedAt ? day(s.repliedAt.toISOString(), true) : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {d.contacts.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Persoane de contact</h2>
          <p className="muted" style={{ marginTop: 0 }}>Doar cei care și-au dat singuri datele, cu dovada acordului.</p>
          <ul>{d.contacts.map((c) => <li key={c.id}>{[c.nume, c.rol, c.email, c.telefon].filter(Boolean).join(" · ")} <small className="muted">{c.consimtamant ? `acord ${c.consimtamantAt ? day(c.consimtamantAt.toISOString()) : ""} (${c.sursaConsimtamant ?? ""})` : "fără acord"}</small>
            <form action={gdprDeleteContactAction} style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="org" value={org.id} /><label><input type="checkbox" name="keep" defaultChecked /> pe „nu contacta”</label><button className="btn">Șterge (GDPR)</button></form></li>)}</ul>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Bani: conturi aduse și venit</h2>
        <div className="stats">
          <Stat label="Conturi aduse" value={num(m.accounts)} />
          <Stat label="Conturi plătite" value={num(m.paidAccounts)} />
          <Stat label="Venit total" value={`${num(m.ron)} lei${m.eur ? ` + ${num(m.eur)} €` : ""}`} hint={m.firstPaid ? `prima plată: ${day(m.firstPaid)}` : undefined} />
        </div>
        <ul style={{ marginTop: 12 }}>
          <li>Linkul: {link ? <CopyLink url={link} /> : "—"}</li>
          <li>Codul: {org.cod ? <b>{org.cod}</b> : (
            <form action={orgCodeAction} style={{ display: "inline" }}><input type="hidden" name="id" value={org.id} /><button className="btn">Fă codul NEAM-XXXX</button> <small className="muted">aceeași reducere ca NEAM90, în Stripe</small></form>
          )}</li>
          <li>
            <form action={linkSchoolAction} style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input type="hidden" name="id" value={org.id} />
              Școala din Admin → Școli (pentru codurile pe clasă):
              <select name="schoolId" defaultValue={org.schoolId ?? ""}><option value="">—</option>{schools.map((x) => <option key={x.id} value={x.id}>{x.name}, {x.locality}</option>)}</select>
              <button className="btn">Leagă</button>
            </form>
          </li>
        </ul>
        {brought.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cont</th><th>Prin</th><th className="n">Plătit</th></tr></thead>
              <tbody>{brought.map((a) => <tr key={a.user_id}><td><Link href={`/admin/oameni/${a.user_id}`}>{a.name}</Link><small>{day(new Date(a.at).toISOString())}</small></td><td>{VIA_LABEL[a.via] ?? a.via}</td><td className="n">{num(Number(a.paid) / 100)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ marginBottom: 0 }}>Niciun cont adus încă. Conturile se leagă la fiecare oră când deschizi CRM-ul și zilnic din Autonomie; conturile de test nu contează.</p>}
      </div>

      <details className="card">
        <summary><b>Ștergere la cerere (GDPR)</b></summary>
        <p className="muted">Șterge organizația, persoanele ei de contact, istoricul, emailurile de campanie, sarcinile și deal-urile. Nu se poate desface. Plățile conturilor rămân (contabilitate), doar fără legătura cu organizația.</p>
        <form action={gdprDeleteAction} className="form stack">
          <input type="hidden" name="id" value={org.id} />
          <label><input type="checkbox" name="keep" defaultChecked /> Păstrează adresele doar pe „Nu contacta”, ca să nu le mai scriem din greșeală (recomandat)</label>
          <label>Scrie STERGE ca să confirmi<input name="confirm" autoComplete="off" /></label>
          <button className="btn">Șterge definitiv</button>
        </form>
      </details>
    </section>
  );
}

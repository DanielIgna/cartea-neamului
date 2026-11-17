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
import { addActivityAction, newDealAction, updateDealAction, updateOrgAction } from "@/app/crm-actions";
import { AdminNav, day, num } from "@/components/admin/ui";
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
  const d = await orgDetail(db, id);
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
        <h2 style={{ marginTop: 0 }}>Istoric</h2>
        <form action={addActivityAction} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
          <input type="hidden" name="id" value={org.id} />
          <label>Ce<select name="tip" defaultValue="nota">{ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_LABEL[t]}</option>)}</select></label>
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

      {d.contacts.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Persoane de contact</h2>
          <p className="muted" style={{ marginTop: 0 }}>Doar cei care și-au dat singuri datele, cu dovada acordului.</p>
          <ul>{d.contacts.map((c) => <li key={c.id}>{[c.nume, c.rol, c.email, c.telefon].filter(Boolean).join(" · ")} <small className="muted">{c.consimtamant ? `acord ${c.consimtamantAt ? day(c.consimtamantAt.toISOString()) : ""} (${c.sursaConsimtamant ?? ""})` : "fără acord"}</small></li>)}</ul>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Conturi venite pe linkul ei</h2>
        {d.src ? <p className="muted" style={{ marginTop: 0 }}>Linkul <code>?src={d.src}</code>. Se văd doar conturile celor care au acceptat cookie-urile de analiză; conturile de test nu apar.</p> : null}
        {d.accounts.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cont</th><th className="n">Arbori</th><th className="n">Plăți</th></tr></thead>
              <tbody>{d.accounts.map((a) => <tr key={a.id}><td><Link href={`/admin/oameni/${a.id}`}>{a.name}</Link><small>{day(new Date(a.created_at).toISOString())}</small></td><td className="n">{num(a.trees)}</td><td className="n">{num(a.paid)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ marginBottom: 0 }}>Niciun cont încă.</p>}
      </div>
    </section>
  );
}

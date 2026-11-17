import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { COUNTIES } from "@/lib/place-key";
import { SITE_URL } from "@/lib/site-url";
import { planSettings } from "@/lib/plans";
import {
  DEAL_PRODUCT_LABEL, DEAL_STAGES, DEAL_STAGE_LABEL, ORG_STATUSES, ORG_STATUS_LABEL, ORG_TYPES, ORG_TYPE_LABEL, SUPPRESSION_REASONS,
  isDealProduct, isDealStage, isOrgStatus,
} from "@/lib/crm";
import {
  VOLUME_TIERS, crmCounts, dealList, orgList, pendingApprovals, recentDecisions, suppressionList, todayList, volumeDiscount, volumeValue, whatsappLink,
  type TodayItem,
} from "@/lib/crm-admin";
import { IMPORT_KINDS } from "@/lib/crm-import";
import { crmPartners } from "@/lib/parteneri-crm";
import { STAGE_LABEL as PARTNER_STAGE, isStage as isPartnerStage } from "@/lib/carduri-cadou";
import { calledAction, decideAction, newOrgAction, suppressAction, unsuppressAction, updateDealAction } from "@/app/crm-actions";
import { AdminNav, Stat, day, num } from "@/components/admin/ui";
import CopyLink from "@/components/admin/CopyLink";
import CrmImport from "@/components/admin/CrmImport";
import { LIFE_LABEL, LIFE_RULE, LIFE_STAGES, ORG_RULES, SCORE_RULES, refreshIfStale, stageCounts } from "@/lib/crm-scor";
import { recomputeAction } from "@/app/crm-actions";
import { crmUserSignals, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM · Admin" };

const TABS = [
  { key: "azi", label: "Azi" }, { key: "organizatii", label: "Organizații" }, { key: "pipeline", label: "Pipeline" }, { key: "scoli", label: "Școli" },
  { key: "firme", label: "Firme" }, { key: "parteneri", label: "Parteneri" }, { key: "aprobari", label: "Aprobări" }, { key: "nucontacta", label: "Nu contacta" },
  { key: "scor", label: "Scor și etape" }, { key: "import", label: "Import" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const KIND: Record<TodayItem["kind"], string> = { raspuns: "Răspuns nou", aprobare: "De aprobat", de_sunat: "De sunat", deal: "Pasul următor", partener: "Partener" };
const srcUrl = (src: string | null) => (src ? `${SITE_URL}/?src=${src}` : null);

/**
 * Admin → CRM (Daniel, 17.11.2026; src/lib/crm.ts, src/lib/crm-admin.ts): instituțiile și firmele cu care vorbim, ce e de făcut
 * azi, pipeline-ul, coada de aprobări și lista „nu contacta”. Aplicația nu trimite prospectare: emailurile către școli și firme
 * vin în istoric din import sau din ingestie. Conturile de test nu intră în cifre.
 */
export default async function Crm({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/crm");
  const q = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === q.t) ? (q.t as Tab) : "azi";
  await refreshIfStale(db).catch((e) => console.error("crm: scorurile nu s-au recalculat", e));
  const counts = await crmCounts(db);
  return (
    <section className="stack">
      <AdminNav active="crm" />
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}
      <div className="stats">
        <Stat label="Organizații" value={num(counts.orgs)} hint={`${num(counts.scoli)} școli · ${num(counts.firme)} firme`} />
        <Stat label="Emailuri trimise (30 z)" value={num(counts.trimise30)} hint={`${num(counts.raspunsuri30)} răspunsuri`} />
        <Stat label="Calde" value={num(counts.calde)} hint={`au răspuns, interesate sau în discuție · ${num(counts.clienti)} clienți/parteneri`} />
        <Stat label="Aprobări în așteptare" value={num(counts.aprobari)} tone={counts.aprobari ? "warn" : "ok"} hint={`${num(counts.suprimate)} pe lista „nu contacta”`} />
      </div>
      <nav className="crm-tabs" aria-label="Părțile CRM-ului">
        {TABS.map((t) => <Link key={t.key} href={`/admin/crm?t=${t.key}`} aria-current={t.key === tab ? "page" : undefined}>{t.label}{t.key === "aprobari" && counts.aprobari ? <small> {counts.aprobari}</small> : null}</Link>)}
      </nav>
      {tab === "azi" && <Today />}
      {tab === "organizatii" && <Orgs q={q} />}
      {tab === "pipeline" && <Pipeline />}
      {tab === "scoli" && <Orgs q={q} fixed="scoala" />}
      {tab === "firme" && <Firms q={q} />}
      {tab === "parteneri" && <Partners />}
      {tab === "aprobari" && <Approvals />}
      {tab === "nucontacta" && <Suppression />}
      {tab === "scor" && <Scores />}
      {tab === "import" && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Import din CSV</h2>
          <p className="muted" style={{ margin: 0 }}>
            Încarcă fișierele așa cum le ai (scoli_trimise.csv, scoli_de_sunat.csv, scoli_nu_contacta.csv, scoli_raspunsuri.csv, firme_trimise.csv,
            firme_nu_contacta.csv, firme_raspunsuri.csv). Poți încărca același fișier de mai multe ori: nu se dublează nimic. Fiecare rând devine o
            organizație cu istoricul ei; „nu contacta” și refuzurile intră pe listă.
          </p>
          <CrmImport kinds={Object.entries(IMPORT_KINDS).map(([k, v]) => [k, v.what])} />
          <p className="muted" style={{ margin: 0 }}>
            Evenimentele noi (email trimis, nelivrat, răspuns) pot veni și singure, la <code>POST /api/admin/crm/ingest</code> cu cheia <code>CRM_INGEST_TOKEN</code>.
          </p>
        </div>
      )}
    </section>
  );
}

async function Today() {
  const items = await todayList(db);
  if (!items.length) return <div className="card"><p className="muted" style={{ margin: 0 }}>Nimic de făcut azi. Răspunsurile noi, aprobările, școlile de sunat și pașii cu termen apar aici.</p></div>;
  return (
    <div className="card">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Ce</th><th>Cine</th><th>Detalii</th><th></th></tr></thead>
          <tbody>
            {items.map((it, i) => {
              const wa = whatsappLink(it.phone, `Bună ziua! Vă scriu de la Cartea Neamului (carteaneamului.ro), în legătură cu ${it.title}.`);
              return (
                <tr key={`${it.kind}-${i}`}>
                  <td className="tight"><span className={`pill ${it.kind === "aprobare" ? "warn" : it.kind === "raspuns" ? "ok" : ""}`}>{KIND[it.kind]}</span></td>
                  <td><Link href={it.href}><b>{it.title}</b></Link>{it.at && <small>{day(it.at.toISOString())}</small>}</td>
                  <td>{it.detail}</td>
                  <td className="tight" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {it.phone && <a className="btn" href={`tel:${it.phone.replace(/\s/g, "")}`}>Sună</a>}
                    {wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                    {it.email && it.kind === "raspuns" && <a className="btn" href={`mailto:${it.email}`}>Răspunde</a>}
                    {it.kind === "aprobare" && <Link className="btn primary" href="/admin/crm?t=aprobari">Aprob / Resping</Link>}
                    {it.kind === "de_sunat" && it.href.startsWith("/admin/crm/org/") && (
                      <form action={calledAction}><input type="hidden" name="id" value={it.href.split("/").pop()} /><button className="btn">Am sunat</button></form>
                    )}
                    {it.site && <a className="btn" href={it.site.startsWith("http") ? it.site : `https://${it.site}`} target="_blank" rel="noopener noreferrer">Site</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function Orgs({ q, fixed }: { q: Record<string, string | undefined>; fixed?: "scoala" | "firma" }) {
  const list = await orgList(db, { tip: fixed ?? q.tip, status: q.status, judet: q.judet, tara: q.tara, q: q.q, sort: q.sort ?? "prioritate" });
  const t = fixed === "scoala" ? "scoli" : fixed === "firma" ? "firme" : "organizatii";
  return (
    <>
      <div className="card">
        <form className="crm-filters" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input type="hidden" name="t" value={t} />
          {!fixed && (
            <select name="tip" defaultValue={q.tip ?? ""} aria-label="Tipul"><option value="">Toate tipurile</option>{ORG_TYPES.map((k) => <option key={k} value={k}>{ORG_TYPE_LABEL[k]}</option>)}</select>
          )}
          <select name="status" defaultValue={q.status ?? ""} aria-label="Statusul"><option value="">Toate statusurile</option>{ORG_STATUSES.map((k) => <option key={k} value={k}>{ORG_STATUS_LABEL[k]}</option>)}</select>
          <select name="judet" defaultValue={q.judet ?? ""} aria-label="Județul"><option value="">Toate județele</option>{Object.entries(COUNTIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="tara" defaultValue={q.tara ?? ""} placeholder="Țara (RO, IT...)" aria-label="Țara" style={{ width: 120 }} />
          <input name="q" defaultValue={q.q ?? ""} placeholder="Caută nume, email, localitate" aria-label="Caută" />
          <select name="sort" defaultValue={q.sort ?? "prioritate"} aria-label="Ordinea"><option value="prioritate">după prioritate</option><option value="recente">cele schimbate recent</option></select>
          <button className="btn">Filtrează</button>
        </form>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Organizație</th><th className="n" title="Vezi regulile în tabul Scor și etape">Prioritate</th><th>Status</th><th className="n">Activități</th><th className="n">Conturi</th><th className="n">Arbori</th><th className="n">Plăți</th><th>Link</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/crm/org/${o.id}`}><b>{o.nume}</b></Link><small>{[!fixed && ORG_TYPE_LABEL[o.tip as keyof typeof ORG_TYPE_LABEL], o.localitate, o.judet, o.tara !== "RO" && o.tara, o.deSunat && "de sunat"].filter(Boolean).join(" · ")}</small></td>
                  <td className="n">{o.prioritate}</td>
                  <td className="tight"><span className={`pill ${o.status === "nu_contacta" || o.status === "nelivrat" ? "bad" : ["interesat", "in_discutie", "client", "partener"].includes(o.status) ? "ok" : ""}`}>{isOrgStatus(o.status) ? ORG_STATUS_LABEL[o.status] : o.status}</span></td>
                  <td className="n">{num(o.activities)}{o.lastAt && <small>{day(o.lastAt.toISOString())}</small>}</td>
                  <td className="n">{num(o.accounts)}</td>
                  <td className="n">{num(o.trees)}</td>
                  <td className="n">{num(o.paid)}</td>
                  <td className="tight">{srcUrl(o.src) && <CopyLink url={srcUrl(o.src)!} label={`?src=${o.src}`} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <p className="muted">Nicio organizație aici. Importă listele din tabul Import sau adaugă una mai jos.</p>}
        {fixed === "scoala" && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Codurile de reducere pe școală sau pe clasă (Stripe) se fac după ce conducerea școlii confirmă. Conturile, arborii și plățile de aici vin de pe
            linkul ?src=scoala-… al fiecărei școli.
          </p>
        )}
      </div>
      <NewOrg tip={fixed} />
    </>
  );
}

function NewOrg({ tip }: { tip?: string }) {
  return (
    <details className="card">
      <summary><b>Adaugă o organizație</b> <span className="muted">(doar date oficiale publice: secretariat, office, contact)</span></summary>
      <form action={newOrgAction} className="form" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 12 }}>
        <label>Tipul<select name="tip" defaultValue={tip ?? "scoala"}>{ORG_TYPES.map((k) => <option key={k} value={k}>{ORG_TYPE_LABEL[k]}</option>)}</select></label>
        <label>Numele<input name="nume" required maxLength={200} /></label>
        <label>Localitatea<input name="localitate" maxLength={120} /></label>
        <label>Județul<select name="judet" defaultValue=""><option value="">—</option>{Object.entries(COUNTIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Țara<input name="tara" defaultValue="RO" maxLength={40} /></label>
        <label>Emailul oficial<input name="email" type="email" maxLength={200} /></label>
        <label>Telefon<input name="telefon" maxLength={40} /></label>
        <label>Site<input name="site" maxLength={300} /></label>
        <label>Sursa datelor (URL public)<input name="sursa" maxLength={500} /></label>
        <div style={{ alignSelf: "end" }}><button className="btn primary">Adaugă</button></div>
      </form>
    </details>
  );
}

async function Pipeline() {
  const deals = await dealList(db);
  return (
    <div className="card">
      {!deals.length && <p className="muted">Încă niciun deal. Deschide o organizație și adaugă unul (coduri pentru școală sau clasă, abonamente pentru firmă, carduri în magazin).</p>}
      <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(220px,1fr)", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
        {DEAL_STAGES.map((st) => {
          const col = deals.filter((d) => (isDealStage(d.etapa) ? d.etapa : "nou") === st);
          return (
            <div key={st} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: 8 }}>
              <div className="section-label">{DEAL_STAGE_LABEL[st]} <small>{col.length}</small></div>
              <div className="stack" style={{ gap: 8 }}>
                {col.map((d) => (
                  <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
                    <Link href={`/admin/crm/org/${d.organizationId}`}><b>{d.orgNume}</b></Link>
                    <small style={{ display: "block" }}>{isDealProduct(d.produs) ? DEAL_PRODUCT_LABEL[d.produs] : d.produs}{d.conturiEstimate ? ` · ${d.conturiEstimate} conturi` : ""}{d.valoareEstimata ? ` · ${num(d.valoareEstimata)} lei` : ""}</small>
                    {d.urmatorulPas && <small style={{ display: "block" }}>➜ {d.urmatorulPas}{d.dataUrmatoruluiPas ? ` (${day(d.dataUrmatoruluiPas.toISOString())})` : ""}</small>}
                    <form action={updateDealAction} style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      <input type="hidden" name="deal" value={d.id} />
                      <input type="hidden" name="back" value="/admin/crm?t=pipeline" />
                      <select name="etapa" defaultValue={d.etapa} aria-label="Etapa" style={{ flex: 1, minWidth: 0 }}>{DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABEL[s]}</option>)}</select>
                      <button className="btn">Mută</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function Firms({ q }: { q: Record<string, string | undefined> }) {
  const ps = await planSettings(db);
  const price = ps.priceLei;
  const examples = [10, 30, 90, 150, 500];
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Oferta de volum pentru firme</h2>
        <p className="muted" style={{ marginTop: 0 }}>Prețul de bază e cel din Manager control: {num(price)} lei pe an pentru un cont. Codurile pentru o firmă se fac doar după acordul tău.</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Conturi</th><th className="n">Reducere</th><th className="n">Exemplu</th></tr></thead>
            <tbody>
              {VOLUME_TIERS.map((t, i) => (
                <tr key={t.from}><td>{t.from}–{t.to}</td><td className="n">−{t.pct}%</td><td className="n">{examples[i]} conturi = {num(volumeValue(examples[i], price) ?? 0)} lei</td></tr>
              ))}
              <tr><td>500+</td><td className="n">ofertă personalizată</td><td className="n">{volumeDiscount(500) === null ? "o discuți tu" : ""}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <Orgs q={q} fixed="firma" />
    </>
  );
}

async function Partners() {
  const all = await crmPartners(db);
  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0 }}>Magazinele și firmele din City Partners, așa cum sunt acolo. Le schimbi din <Link href="/admin/parteneri">City Partners</Link>; cardurile din <Link href="/admin/carduri">Carduri cadou</Link>.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Partener</th><th>Etapa</th><th>Pasul următor</th></tr></thead>
          <tbody>
            {all.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/parteneri/${p.id}`}><b>{p.numeMagazin}</b></Link><small>{[p.tip === "firma" ? "firmă" : "magazin", p.oras, p.judet].filter(Boolean).join(" · ")}</small></td>
                <td className="tight">{isPartnerStage(p.etapa) ? PARTNER_STAGE[p.etapa] : p.etapa}</td>
                <td>{p.urmatorulPas ?? "—"}{p.urmatorulPasLa && <small>{day(p.urmatorulPasLa.toISOString())}</small>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!all.length && <p className="muted">Niciun partener încă.</p>}
    </div>
  );
}

async function Approvals() {
  const [pending, done] = await Promise.all([pendingApprovals(db), recentDecisions(db)]);
  return (
    <>
      <div className="card stack">
        <h2 style={{ margin: 0 }}>În așteptare</h2>
        <p className="muted" style={{ margin: 0 }}>Orice mesaj nou către o persoană sau o organizație, în afara unei campanii aprobate, așteaptă aici. Ce nu aprobi în 72 de ore expiră singur.</p>
        {!pending.length && <p className="muted" style={{ margin: 0 }}>Nimic de aprobat.</p>}
        {pending.map(({ a, orgNume }) => (
          <form key={a.id} action={decideAction} className="form" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
            <input type="hidden" name="id" value={a.id} />
            <div><span className={`pill ${a.risc === "HIGH" ? "bad" : "warn"}`}>{a.risc}</span> <b>{a.tipActiune}</b>{orgNume ? ` · ${orgNume}` : ""} <small className="muted">expiră {day(a.expiresAt.toISOString(), true)}</small></div>
            {a.motiv && <div className="muted">{a.motiv}</div>}
            {a.payload.destinatar && <div>Către: <code>{a.payload.destinatar}</code></div>}
            <label>Subiect<input name="subiect" defaultValue={a.payload.subiect ?? ""} maxLength={300} /></label>
            <label>Text<textarea name="text" defaultValue={a.payload.text ?? ""} rows={6} /></label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" name="decizie" value="aprobat">Aprob (cu modificările de mai sus)</button>
              <button className="btn" name="decizie" value="respins">Resping</button>
            </div>
          </form>
        ))}
      </div>
      {done.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Hotărâte</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Ce</th><th>Status</th><th>Când</th></tr></thead>
              <tbody>{done.map(({ a, orgNume }) => <tr key={a.id}><td>{a.tipActiune}{orgNume ? ` · ${orgNume}` : ""}{typeof a.payload.eroare === "string" && <small>{a.payload.eroare}</small>}</td><td className="tight">{a.status}</td><td className="tight">{a.cand ? day(a.cand.toISOString(), true) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

async function Suppression() {
  const list = await suppressionList(db);
  return (
    <div className="card stack">
      <p className="muted" style={{ margin: 0 }}>Adresele și domeniile de aici nu primesc niciun email de marketing de la site (sfaturi, conversie, CRM). Emailurile legate de cont (parolă, plată) pleacă în continuare.</p>
      <form action={suppressAction} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
        <label style={{ flex: "2 1 240px" }}>Email sau domeniu<input name="valoare" required placeholder="secretariat@scoala.ro sau scoala.ro" maxLength={200} /></label>
        <label style={{ flex: "1 1 160px" }}>Motivul<select name="motiv" defaultValue="nu_contacta">{SUPPRESSION_REASONS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}</select></label>
        <button className="btn primary">Adaugă pe listă</button>
      </form>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Adresă / domeniu</th><th>Motiv</th><th>Sursa</th><th>De când</th><th></th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.valoare}>
                <td><code>{s.valoare}</code>{s.tip === "domeniu" && <small>tot domeniul</small>}</td>
                <td className="tight">{s.motiv}</td><td>{s.sursa ?? "—"}</td><td className="tight">{day(s.createdAt.toISOString())}</td>
                <td className="tight"><form action={unsuppressAction}><input type="hidden" name="valoare" value={s.valoare} /><button className="btn" title="Scoate de pe listă">✕</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && <p className="muted" style={{ margin: 0 }}>Lista e goală.</p>}
    </div>
  );
}

async function Scores() {
  const [stages, top] = await Promise.all([
    stageCounts(db),
    db.select({ s: crmUserSignals, name: user.name }).from(crmUserSignals).innerJoin(user, eq(user.id, crmUserSignals.userId)).orderBy(desc(crmUserSignals.scor)).limit(25),
  ]);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Etapele utilizatorilor</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Etapa</th><th>Regula</th><th className="n">Oameni</th><th className="n">Scor mediu</th></tr></thead>
            <tbody>{LIFE_STAGES.map((k) => <tr key={k}><td><b>{LIFE_LABEL[k]}</b></td><td>{LIFE_RULE[k]}</td><td className="n"><Link href={`/admin/oameni?etapa_crm=${k}`}>{num(stages[k].count)}</Link></td><td className="n">{stages[k].avgScore}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>Ordinea în care se aplică: pierdut, în risc, ambasador, plătitor, angajat, activat, cont. Vizitatorii fără cont se văd pe surse în Analiză (sunt anonimi). Conturile de test nu au scor.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cum se socotește scorul (0–100)</h2>
        <ul style={{ marginTop: 0 }}>{SCORE_RULES.map((r) => <li key={r.key}>{r.label}: <b>până la {r.max}</b></li>)}</ul>
        <h3>Prioritatea organizațiilor</h3>
        <ul>{ORG_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        <form action={recomputeAction}><button className="btn">Recalculează acum</button> <small className="muted">Se face singur cel mult o dată pe oră, când deschizi panoul, și zilnic din Autonomie.</small></form>
      </div>
      {top.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cei mai implicați</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Om</th><th className="n">Scor</th><th>Etapa</th><th>Sursa</th><th>Ultima activitate</th></tr></thead>
              <tbody>{top.map(({ s, name }) => <tr key={s.userId}><td><Link href={`/admin/oameni/${s.userId}`}>{name}</Link></td><td className="n">{s.scor}</td><td className="tight">{LIFE_LABEL[s.etapa as keyof typeof LIFE_LABEL] ?? s.etapa}</td><td>{s.sursa ?? "—"}</td><td className="tight">{s.ultimaActivitate ? day(s.ultimaActivitate.toISOString()) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

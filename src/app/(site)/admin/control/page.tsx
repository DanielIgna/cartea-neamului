import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { peopleList } from "@/lib/admin-people";
import { planOverview } from "@/lib/plans";
import { AdminNav, PlanPill, Stat, count, day, eur, lei, num } from "@/components/admin/ui";
import { AccountPlanForm, LimitsForm } from "@/components/admin/PlanForms";
import { partnerExport } from "@/lib/partners";
import { dueReminders, reminderMailReady } from "@/lib/extra";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manager control · Admin" };

/**
 * Manager control: zilele gratuite, prețurile, comutatorul plăților și planul fiecărui om (gratuit, gratuit mereu, plătit până la).
 * Cât timp plățile nu sunt pornite, în site nu se vede nimic și nimeni nu e oprit.
 */
export default async function AdminControl() {
  await requireAdmin("/admin/control");
  const [ov, people, pm] = await Promise.all([planOverview(db), peopleList(db), partnerExport(db, "")]);
  const s = ov.settings;
  const [due, mailReady] = [await dueReminders(db, s.reminderDays), reminderMailReady()];
  const biggest = new Map<string, (typeof ov.trees)[number]>();
  for (const t of ov.trees) if (t.ownerId && (biggest.get(t.ownerId)?.persons ?? -1) < t.persons) biggest.set(t.ownerId, t);
  const rows = people
    .map((p) => ({ p, tree: biggest.get(p.id) ?? null }))
    .sort((a, b) => (b.tree?.persons ?? -1) - (a.tree?.persons ?? -1) || a.p.name.localeCompare(b.p.name, "ro"));

  return (
    <section className="stack">
      <AdminNav active="control" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Manager control</h2>
        <p style={{ marginTop: 0, maxWidth: "78ch" }}>
          {s.on
            ? <><b style={{ color: "var(--ok, green)" }}>● Vânzarea e PORNITĂ</b> din {day(s.startedAt)}: fiecare om are {count(s.trialDays, "zile")} gratuite, apoi arborii lui se pot doar vedea până plătește.</>
            : <><b>○ Vânzarea e OPRITĂ:</b> nimeni nu e oprit și nimic din pagina asta nu apare în site. Cifrele de mai jos arată ce s-ar întâmpla dacă le-ai porni azi.</>}
        </p>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          Regula aleasă: fiecare om, și cel care pornește arborele, și fiecare rudă invitată, are {count(s.trialDays, "zile")} cu totul deschis.
          După ele vede tot, dar nu mai poate adăuga sau schimba nimic până nu plătește anul pe un plan: Basic {lei(s.priceLei)} / {eur(s.priceEur)},
          Familie {lei(s.familieLei)} / {eur(s.familieEur)} (recomandat) sau Premium {lei(s.premiumLei)} / {eur(s.premiumEur)}. Fiecare plan are plafoanele lui
          (persoane, poze, glasuri, acte, cine scrie, arbori); peste plafon nu se șterge nimic, doar nu se mai adaugă. La Familie și Premium, rudele care scriu
          nu plătesc separat; la Basic își plătesc anul lor ({lei(s.invitePriceLei)} / {eur(s.invitePriceEur)}). Trecerea pe un plan mai scump costă doar
          diferența pe zilele rămase. Cei care aveau cont înainte de pornire au primul an gratuit ({count(s.betaDays, "zile")}), cu plafoanele planului Familie.
          Nu se șterge nimic, iar descărcarea datelor rămâne gratuită. Pe cei apropiați îi pui „Gratuit mereu” (fără limite).
          {" "}În zilele gratuite: un arbore de cel mult {count(s.trialPersons, "persoane")}, {count(s.trialPhotos, "poze")}, {count(s.trialAudio, "înregistrări")},
          {" "}{count(s.trialDocs, "acte")}, iar rudele se pot invita doar să vadă.
          Până merg plățile cu cardul, cine plătește altfel (de pildă prin transfer) primește aici „plătit până la”.
        </p>
        <div className="stats">
          <Stat label="Gratuit mereu" value={num(ov.counts.mereu)} />
          <Stat label="Primul an gratuit" value={num(ov.counts.beta)} hint="aveau cont înainte de pornire" />
          <Stat label="Plătit" value={num(ov.counts.platit)} hint={`≈ ${lei(ov.revenue.leiYearNow)} pe an · Basic ${ov.counts.basic}, Familie ${ov.counts.familie}, Premium ${ov.counts.premium}`} />
          <Stat label="Păstrare" value={num(ov.counts.pastrare)} hint="după anul plătit: văd tot, fără adăugări" />
          <Stat label="În zilele gratuite" value={num(ov.counts.proba)} />
          <Stat label="Doar citire" value={num(ov.counts.expirat)} hint="zilele gratuite s-au terminat" tone={ov.counts.expirat ? "warn" : undefined} />
          <Stat label="Venit posibil pe an" value={lei(ov.revenue.leiYearPossible)} hint={`dacă plătesc și cei ${ov.revenue.wouldPay} în probă sau doar citire`} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Zile gratuite, planuri, prețuri și pornirea plăților</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Comutatorul vânzării e bifa de jos, „Pornește plățile în site”: bifată = vânzarea merge; debifată și salvată = nimeni nu mai e oprit.
        </p>
        <LimitsForm value={s} />
      </div>

      <div className="card" id="expira">
        <h3 style={{ marginTop: 0 }}>Expiră în curând</h3>
        <p className="muted" style={{ marginTop: 0, maxWidth: "78ch" }}>
          Anul nu se reînnoiește singur. Cei al căror an plătit se termină în următoarele {count(s.reminderDays, "zile")} și n-au primit încă aducerea
          aminte. {mailReady
            ? "Emailul pleacă singur, o dată pe zi, prin serviciul de email pus în Vercel."
            : "Emailul nu pleacă singur până nu pui un serviciu de email (RESEND_API_KEY, REMINDER_FROM și CRON_SECRET în Vercel, plus o rulare zilnică a adresei /api/cron/aminteste-plata). Până atunci, scrie-le tu cu butonul de lângă nume."}
        </p>
        {due.length ? (
          <ul>
            {due.map((r) => (
              <li key={r.userId}>
                {r.name} ({r.email}), până la {day(r.paidUntil?.toISOString() ?? null)}{" "}
                <a className="btn" href={`mailto:${r.email}?subject=${encodeURIComponent(`Cartea Neamului: anul tău se termină pe ${day(r.paidUntil?.toISOString() ?? null)}`)}&body=${encodeURIComponent(`Bună, ${r.name}!\n\nAnul tău în Cartea Neamului se termină pe ${day(r.paidUntil?.toISOString() ?? null)}. Nu se reînnoiește singur și nu se șterge nimic: după aceea arborele rămâne de citit. Dacă vrei să adaugi în continuare, poți plăti anul aici: ${SITE_URL}/plata\n\nMulțumim!`)}`}>Scrie-i</a>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Nimeni deocamdată.</p>}
      </div>

      <div className="card" id="parteneri">
        <h3 style={{ marginTop: 0 }}>Partenerul PropManage</h3>
        <p className="muted" style={{ marginTop: 0, maxWidth: "78ch" }}>
          Lista pentru PropManage are doar adresele de email ale celor care au bifat „Beneficii de la parteneri” și nu s-au răzgândit, cu data acordului
          și legătura lor de dezabonare (de pus în fiecare email trimis). Nimic din arbori, nici rudele invitate. Descarc-o de fiecare dată înainte să
          o trimiți: cine renunță iese din ea pe loc. Fiecare descărcare se trece în jurnalul site-ului (cine, când, câte adrese).
        </p>
        <div className="stats"><Stat label="Cu acordul dat acum" value={num(pm.length)} /></div>
        <div className="actions">
          <a className="btn primary" href="/api/parteneri/propmanage/export" download>Descarcă lista (CSV)</a>
          <a className="btn" href="/parteneri" target="_blank">Pagina „Parteneri”</a>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Planul fiecărui cont</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          „Gratuit” e ca la toți: zilele gratuite, apoi plătește. „Gratuit mereu” e pentru familie, prieteni și cei care ajută. „Plătit până la” ține
          minte până când are omul anul plătit, iar „planul anului” spune pe ce plan (Basic, Familie, Premium); fără plan ales, e Basic.
          Nota e doar pentru tine; omul o poate vedea numai dacă își descarcă datele din „Datele mele”, cum cere legea.
        </p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Om</th><th>Arborele lui cel mai mare</th><th>{s.on ? "Acum" : "Dacă porneai azi"}</th><th>Planul</th></tr></thead>
            <tbody>
              {rows.map(({ p, tree }) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/oameni/${p.id}`}>{p.name}</Link><small>{p.email}</small></td>
                  <td>{tree ? <>{tree.name}<small>{count(tree.persons, "persoane")} · {count(tree.files, "fișiere")}</small></>
                    : <span className="muted">{p.trees ? "doar în arborii rudelor" : "n-are arbore"}</span>}</td>
                  <td><PlanPill plan={p.plan} access={ov.access.get(p.id)} /></td>
                  <td className="plan-cell"><AccountPlanForm userId={p.id} plan={p.plan} note={p.planNote} paidUntil={ov.plans.get(p.id)?.paidUntil} tier={ov.plans.get(p.id)?.tier} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Idei pentru bani, de gândit</h3>
        <ul className="ideas">
          <li><b>Cartea neamului tipărită</b>, cu copertă tare, comandată din site și plătită pe bucată. E cel mai firesc dar: de Crăciun, pentru bunici,
            la o nuntă sau la un botez. Cartea se face deja în site; tipărirea se face pe cerere de ofertă, după mărimea cărții.</li>
          <li><b>Albumul familiei:</b> pozele din arbore, cu numele, anii și locurile scrise sub ele, tipărit ca album.</li>
          <li><b>Darul:</b> un an de „Familie” împreună cu cartea, cumpărate pentru altcineva, cu un bilet de dar.</li>
          <li><b>Ce nu se poate vinde:</b> descărcarea datelor proprii (arborele ca GEDCOM și „Datele mele”) rămâne gratuită, fiindcă o cere legea (GDPR)
            și e promisă în Termeni. Se poate vinde însă cartea gata așezată, frumos, pentru tipar.</li>
          <li><b>Înainte de primii bani:</b> o firmă (PFA sau SRL), un procesator de plăți (de pildă Stripe sau Netopia), prețurile scrise în Termeni și
            pictogramele ANPC pe site.</li>
        </ul>
      </div>
    </section>
  );
}

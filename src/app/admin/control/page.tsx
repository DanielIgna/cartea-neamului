import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { peopleList } from "@/lib/admin-people";
import { planOverview } from "@/lib/plans";
import { AdminNav, PlanPill, Stat, count, eur, num } from "@/components/admin/ui";
import { AccountPlanForm, LimitsForm } from "@/components/admin/PlanForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manager control · Admin" };

/**
 * Manager control: cine folosește site-ul gratuit pentru totdeauna, cine ar plăti și care sunt limitele planului gratuit.
 * Totul rămâne aici, în panou: în site nu se vede nimic și nimeni nu e oprit cât timp plățile nu sunt pornite.
 */
export default async function AdminControl() {
  await requireAdmin("/admin/control");
  const [ov, people] = await Promise.all([planOverview(db), peopleList(db)]);
  const s = ov.settings;
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
          Aici hotărăști cine folosește Cartea Neamului gratuit pentru totdeauna și cine ar plăti când pornește abonamentul. <b>Acum plățile nu sunt
          pornite:</b> nimeni nu vede planul lui, nimeni nu e oprit și nimic din pagina asta nu apare în site.
        </p>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          Regula propusă: rudele invitate nu plătesc niciodată. Cel care pornește un arbore îl are gratuit până la limitele de mai jos; peste ele, „Familie”
          pe an, pentru tot contul. Pe cei apropiați îi pui „Gratuit mereu” și nu plătesc orice s-ar întâmpla.
        </p>
        <div className="stats">
          <Stat label="Gratuit mereu" value={num(ov.counts.mereu)} />
          <Stat label="Marcați „Familie”" value={num(ov.counts.familie)} hint={`≈ ${eur(ov.revenue.eurYearNow)} pe an`} />
          <Stat label="Arbori peste limite" value={num(ov.counts.over)} hint={`${ov.counts.overFree} la conturi cu planul gratuit`} tone={ov.counts.overFree ? "warn" : undefined} />
          <Stat label="Aproape de limite" value={num(ov.counts.near)} hint="peste trei sferturi" />
          <Stat label="Venit posibil pe an" value={eur(ov.revenue.eurYearPossible)} hint={`„Familie” și ${ov.revenue.wouldPay} conturi peste limite`} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Limitele planului gratuit și prețul</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Încearcă alte cifre și vezi mai sus câți arbori ar trece peste ele. Un arbore e „peste” când trece de oricare dintre cele două limite.
        </p>
        <LimitsForm value={s} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Planul fiecărui cont</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          „Gratuit” e ca la toți. „Gratuit mereu” e pentru familie, prieteni și cei care ajută. „Familie” e pentru cine plătește (când vor fi pornite plățile).
          Nota e doar pentru tine; omul o poate vedea numai dacă își descarcă datele din „Datele mele”, cum cere legea.
        </p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Om</th><th>Arborele lui cel mai mare</th><th>Acum</th><th>Planul</th></tr></thead>
            <tbody>
              {rows.map(({ p, tree }) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/oameni/${p.id}`}>{p.name}</Link><small>{p.email}</small></td>
                  <td>{tree ? <>{tree.name}<small>{num(tree.persons)} din {count(s.freePersons, "persoane")} · {num(tree.files)} din {count(s.freeFiles, "fișiere")}</small></>
                    : <span className="muted">{p.trees ? "doar în arborii rudelor" : "n-are arbore"}</span>}</td>
                  <td><PlanPill plan={p.plan} limit={tree?.state} /></td>
                  <td className="plan-cell"><AccountPlanForm userId={p.id} plan={p.plan} note={p.planNote} compact /></td>
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
            la o nuntă sau la un botez. Cartea se face deja în site, ca PDF; lipsește doar tipografia și plata.</li>
          <li><b>Albumul familiei:</b> pozele din arbore, cu numele, anii și locurile scrise sub ele, tipărit ca album.</li>
          <li><b>Darul:</b> un an de „Familie” împreună cu cartea, cumpărate pentru altcineva, cu un bilet de dar.</li>
          <li><b>Abonamentul „Familie”</b> doar pentru arborii mari, plătit de cel care a pornit arborele. Rudele lui intră gratuit, mereu.</li>
          <li><b>Ce nu se poate vinde:</b> descărcarea datelor proprii (arborele ca GEDCOM și „Datele mele”) rămâne gratuită, fiindcă o cere legea (GDPR)
            și e promisă în Termeni. Se poate vinde însă cartea gata așezată, frumos, pentru tipar.</li>
          <li><b>Înainte de primii bani:</b> o firmă (PFA sau SRL), un procesator de plăți (de pildă Stripe sau Netopia), prețurile scrise în Termeni și
            pictogramele ANPC pe site.</li>
        </ul>
      </div>
    </section>
  );
}

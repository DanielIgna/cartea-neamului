import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { deletionPlan } from "@/lib/account";
import { consentState } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import { LEGAL_UPDATED, operator } from "@/lib/legal";
import { AccountDelete, FaithWithdraw, UsageToggle } from "@/components/MyDataTools";
import { duration, usageOf } from "@/lib/usage";
import { inZile } from "@/lib/ro-words";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Datele mele · Cartea Neamului" };

const day = (d: Date) => d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });

/**
 * „Datele mele”: ce știe site-ul despre cont, descărcarea lor, acordurile date (și retragerea celui pentru „Credința”)
 * și ștergerea contului, cu tot ce pleacă și ce rămâne în arborii familiei.
 */
export default async function MyDataPage() {
  const me = await requireUser("/datele-mele");
  const [plan, terms, faith, usage] = await Promise.all([deletionPlan(db, me.id), consentState(db, me.id, "terms"), consentState(db, me.id, "faith"),
    consentState(db, me.id, "usage")]);
  const mine = usage.granted ? await usageOf(db, me.id, 30) : null;
  const contact = operator().email;
  const trees = [...plan.owned.map((t) => ({ id: t.id, name: t.name })), ...plan.member];
  return (
    <section className="stack my-data">
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Datele mele</div>
        <h2>Ce ai pus în Cartea Neamului e al tău</h2>
        <p>Contul tău: <b>{me.name}</b>, cu adresa {me.email}, din {day(me.createdAt)}. Aici îți descarci oricând datele, vezi acordurile pe care le-ai dat
          și, dacă vrei, îți ștergi contul. Cum le păstrăm și cine le vede scrie în <Link href="/confidentialitate">Politica de confidențialitate</Link>.</p>
      </div>

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Descarcă</div>
        <p>Un fișier cu tot ce ține de contul tău: datele contului, fișa ta, amintirile din lada ta, ce ai scris altora, mesajele, întrebările, cererile și acordurile.
          Pozele și înregistrările apar ca legături spre site.</p>
        <div className="actions"><a className="btn primary" href="/api/datele-mele" download>Descarcă datele mele</a></div>
        {trees.length > 0 && (
          <>
            <p className="muted" style={{ marginBottom: 4 }}>Arborii întregi, cu toți oamenii din ei, îi descarci ca GEDCOM, un fișier pe care îl deschide orice program de genealogie:</p>
            <ul className="my-trees">
              {trees.map((t) => <li key={t.id}><a href={`/api/arbore/${t.id}/gedcom?living=1`} download>{t.name}</a></li>)}
            </ul>
          </>
        )}
      </div>

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Acordurile tale</div>
        <p>{terms.granted && terms.at
          ? <>Ai fost de acord cu <Link href="/termeni">Termenii</Link> și cu <Link href="/confidentialitate">Politica de confidențialitate</Link> pe {day(terms.at)}, când ți-ai făcut contul.</>
          : <>Termenii și Politica de confidențialitate sunt scrise din {LEGAL_UPDATED}, după ce ți-ai făcut contul. Le poți citi oricând: <Link href="/termeni">Termenii</Link>, <Link href="/confidentialitate">Politica de confidențialitate</Link>.</>}
        </p>
        <p>Capitolul „Credința”: {faith.granted && faith.at
          ? <>ți-ai dat acordul pe {day(faith.at)}{plan.faith ? `, iar acolo ai acum ${plan.faith === 1 ? "un răspuns" : `${plan.faith} răspunsuri`}` : ""}.</>
          : faith.at ? <>ți-ai retras acordul pe {day(faith.at)}. Dacă mai scrii în acest capitol, ți-l cerem din nou.</>
          : <>nu ți-ai dat încă acordul. Ți-l cerem când scrii prima dată în acest capitol, pentru că legea ocrotește mai strict ce spune omul despre credința lui.</>}
        </p>
        <FaithWithdraw answers={plan.faith} granted={faith.granted} />
        <p id="folosire" style={{ marginTop: 18 }}>Cât folosești site-ul: {usage.granted && usage.at
          ? <>ai spus „Bine” pe {day(usage.at)}, așa că știm cât timp stai în fiecare parte a site-ului (doar timpul, nu ce scrii).
              {mine && (mine.total ? <> În ultimele 30 de zile: {duration(mine.total)}, {inZile(mine.activeDays)}.</> : <> În ultimele 30 de zile nu s-a adunat nimic.</>)}</>
          : usage.at ? <>ai spus „Nu vreau” pe {day(usage.at)}, așa că nu măsurăm nimic.</>
          : <>nu ne-ai răspuns încă, așa că nu măsurăm nimic.</>}
        </p>
        {mine && mine.sections.length > 0 && (
          <ul className="my-usage">
            {mine.sections.slice(0, 6).map((x) => <li key={x.section}>{x.label}: <b>{duration(x.seconds)}</b></li>)}
          </ul>
        )}
        <UsageToggle granted={usage.granted} demo={isDemo(me.email)} />
      </div>

      <div className="card my-danger">
        <div className="section-label" style={{ marginTop: 0 }}>Șterge contul</div>
        <p>Îți poți șterge contul oricând. Înainte, îți arătăm ce pleacă și ce rămâne în arborii familiei.</p>
        <AccountDelete plan={plan} email={me.email} demo={isDemo(me.email)} />
        <p className="muted" style={{ marginTop: 12 }}>Pentru orice întrebare despre datele tale ne scrii la <a href={`mailto:${contact}`}>{contact}</a>.</p>
      </div>
    </section>
  );
}

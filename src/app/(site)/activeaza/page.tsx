import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPlan } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { giftCardsEnabled, normalizeCode } from "@/lib/carduri-cadou";
import { activateAction } from "@/app/carduri-actions";
import { offerVisible } from "@/lib/propmanage-cont";
import { PropManageOffer } from "@/components/PropManageOffer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activează cardul cadou", robots: { index: false, follow: false } };

const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };
const MSG: Record<string, string> = {
  invalid: "Codul nu este valid. Verifică literele și cifrele de sub zona răzuită (codul are forma XXXX-XXXX-XXXX).",
  not_sold: "Acest card nu a fost încă marcat ca vândut de magazin. Dacă tocmai l-ai cumpărat, roagă magazinul să-l marcheze vândut sau scrie-ne pe pagina de Contact.",
  used: "Acest cod a fost deja folosit.",
  cancelled: "Acest card a fost anulat. Pentru lămuriri, scrie-ne pe pagina de Contact.",
  prea_multe: "Prea multe încercări într-o oră. Te rugăm să mai încerci peste puțin timp.",
};

/**
 * Activarea cardului cadou cumpărat dintr-un magazin: codul (precompletat din QR, ?cod=…), intrarea în cont sau contul nou
 * (cu Google, dacă e pornit) și întoarcerea aici, apoi „Activează”. Cu funcția oprită din Admin, pagina arată un mesaj neutru.
 */
export default async function Activeaza({ searchParams }: { searchParams: Promise<{ cod?: string; r?: string }> }) {
  const { cod: rawCod, r } = await searchParams;
  if (!(await giftCardsEnabled(db)) || r === "inactive") {
    return (
      <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Activare card</h1>
          <p>Această pagină nu este disponibilă în acest moment. Te rugăm să revii mai târziu.</p>
          <div className="actions"><Link className="btn" href="/">Prima pagină</Link></div>
        </div>
      </section>
    );
  }
  const me = await currentUser();
  const cod = normalizeCode(rawCod ?? "") ?? (rawCod ?? "").slice(0, 20);
  const next = `/activeaza${cod ? `?cod=${encodeURIComponent(cod)}` : ""}`;
  let done: { plan: string; until: string } | null = null;
  let pmOffer = false;
  if (r === "ok" || r === "used_by_you") {
    const [p] = me ? await db.select({ tier: accountPlan.tier, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, me.id)) : [];
    if (p?.paidUntil) done = { plan: PLAN[p.tier ?? "basic"] ?? "Basic", until: new Intl.DateTimeFormat("ro", { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(p.paidUntil) };
    // Oferta PropManage: doar cu comutatorul din Admin pornit, PropManage configurat și omul neinvitat încă. O greșeală aici
    // nu atinge activarea: oferta pur și simplu nu apare.
    if (done && me) pmOffer = await offerVisible(db, me.id).catch(() => false);
  }
  return (
    <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Activează cardul cadou</h1>
        {done ? (
          <>
            <p className="cc-ok" role="status">
              {r === "ok" ? "Gata! Cardul este activat." : "Ai activat deja acest card."} Ai planul <b>{done.plan}</b> până pe <b>{done.until}</b>.
            </p>
            <div className="actions"><Link className="btn primary" href="/">Mergi la arborele tău</Link><Link className="btn" href="/plata">Vezi planul</Link></div>
            {pmOffer && <PropManageOffer place="activare" />}
          </>
        ) : (
          <>
            <p>Scrie codul de sub zona răzuită a cardului. Dacă ai scanat codul QR, codul e deja completat.</p>
            {r && MSG[r] && <p className="err" role="alert">{MSG[r]}</p>}
            {r === "gata" && me && <p className="muted" role="status">Ești în cont ca <b>{me.name || me.email}</b>. Apasă „Activează” ca să primești abonamentul.</p>}
            <form action={activateAction} className="form">
              <label>Codul cardului
                <input name="cod" className="cc-code-input" defaultValue={cod} placeholder="XXXX-XXXX-XXXX" required maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
              </label>
              <div className="actions">
                <button className="btn primary">{me ? "Activează" : "Continuă"}</button>
              </div>
            </form>
            {me ? (
              <p className="muted"><small>Abonamentul se pune pe contul <b>{me.email}</b>. Dacă ai deja un abonament activ, se prelungește cu durata cardului.</small></p>
            ) : (
              <p className="muted">
                <small>
                  După „Continuă” îți faci un cont (sau intri în cel pe care îl ai, inclusiv cu Google) și revii automat aici.{" "}
                  Ai deja cont? <Link href={`/intrare?next=${encodeURIComponent(next)}`}>Intră în cont</Link>.
                </small>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

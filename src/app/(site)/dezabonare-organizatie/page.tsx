import Link from "next/link";
import { unsubscribeOrgAction } from "@/app/crm-public-actions";
import { checkSendSig } from "@/lib/crm-campanii";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dezabonare", robots: PRIVATE_ROBOTS };

/**
 * Dezabonarea instituțiilor de la emailurile noastre (legătura din fiecare email de campanie). Cere o apăsare pe buton, ca
 * programele care verifică legăturile din emailuri să nu dezaboneze pe nimeni fără voie.
 */
export default async function DezabonareOrganizatie({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const valid = !!q.d && !!q.s && /^[0-9a-f-]{36}$/i.test(q.d) && checkSendSig(q.d, q.s);
  return (
    <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Dezabonare</h1>
        {q.gata === "1" ? <p role="status">Gata. Nu vă mai scriem la această adresă. Vă mulțumim și ne cerem scuze pentru deranj.</p>
          : q.gata === "0" || !valid ? <p>Legătura nu mai este valabilă. Ne puteți scrie din pagina de contact și vă scoatem imediat din listă.</p>
          : (
            <form action={unsubscribeOrgAction}>
              <input type="hidden" name="d" value={q.d} />
              <input type="hidden" name="s" value={q.s} />
              <p>Apăsați butonul și nu vă mai trimitem niciun email la adresa instituției.</p>
              <button className="btn primary">Nu mai doresc emailuri</button>
            </form>
          )}
        <p style={{ marginBottom: 0 }}><Link href="/contact">Contact</Link> · <Link href="/">Cartea Neamului</Link></p>
      </div>
    </section>
  );
}

import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { SHOP_PATH, modelPath, shopPrice } from "@/lib/invitatii-nunta";
import { adminProducts } from "@/lib/invitatii-nunta-produse";
import { recentOrders, shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { formatPaid } from "@/lib/emailuri";
import { toggleShopAction } from "@/app/invitatii-nunta-actions";
import StatusPill from "@/components/admin/InvitatieStare";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitații de nuntă · Admin" };

const when = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);

/**
 * Admin → Invitații de nuntă (Daniel, 27.11.2026): comutatorul rubricii (app_setting „invitatii_nunta”), lista modelelor din baza
 * de date (cu starea și vânzările lor; fiecare se deschide pentru schimbat), butonul „Adaugă un model” și ultimele comenzi (fără
 * tokenuri). Vezi src/lib/invitatii-nunta-produse.ts și src/lib/invitatii-nunta-server.ts.
 */
export default async function AdminInvitatiiNunta({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/invitatii-nunta");
  const q = await searchParams;
  const [open, orders, products] = await Promise.all([shopOpen(db), recentOrders(db).catch(() => []), adminProducts(db).catch(() => [])]);
  const pay = shopPaymentsReady();
  const total = orders.reduce((a, o) => ({ ...a, [o.currency]: (a[o.currency] ?? 0) + o.amount }), {} as Record<string, number>);
  return (
    <section className="stack">
      <AdminNav active="invitatii-nunta" />
      {q.ok && <p className="cc-ok" role="status">{q.ok === "pornit" ? "Rubrica e pornită." : q.ok === "sters" ? "Am șters modelul." : "Rubrica e oprită."}</p>}
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Invitații de nuntă</h1>
        <p>Rubrica <Link href={SHOP_PATH}>{SHOP_PATH}</Link> este <b>{open ? "pornită" : "oprită"}</b>. Plata cu cardul: <b>{pay ? "merge" : "oprită (fără cheie Stripe sau, pe o copie de probă, fără cheie de test)"}</b>.</p>
        <p className="muted">Oprită: paginile spun că rubrica e închisă, ies din Google și nu se mai poate cumpăra. Linkurile deja plătite merg în continuare. Paginile se schimbă în cel mult 10 minute.</p>
        <form action={toggleShopAction}>
          <input type="hidden" name="on" value={open ? "0" : "1"} />
          <button type="submit" className={open ? "btn" : "btn primary"}>{open ? "Oprește rubrica" : "Pornește rubrica"}</button>
        </form>
      </div>
      <div className="card">
        <div className="shopadm-head">
          <h2 style={{ margin: 0 }}>Modele ({products.length})</h2>
          <Link className="btn primary" href="/admin/invitatii-nunta/nou">+ Adaugă un model</Link>
        </div>
        {products.length === 0 ? <p className="muted">Niciun model încă.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Nume</th><th>Slug</th><th>Regiune</th><th>Preț RON / EUR</th><th>Stare</th><th>Actualizat</th><th>Vânzări</th></tr></thead>
              <tbody>
                {products.map((m) => (
                  <tr key={m.id}>
                    <td><Link href={`/admin/invitatii-nunta/${m.id}`}><b>{m.texts.ro?.name ?? m.slug}</b></Link></td>
                    <td><code>{m.slug}</code></td>
                    <td>{m.region || "–"}</td>
                    <td>{shopPrice(m, "ro").label} / {shopPrice(m, "de").label}</td>
                    <td><StatusPill status={m.status} />{m.status === "published" && <> <Link href={modelPath(m)}>vezi</Link></>}</td>
                    <td>{when(m.updatedAt)}</td>
                    <td>{m.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">Un model nou intră ca ciornă. Se publică din pagina lui, după ce are fișierul ZIP, cel puțin o poză și textele în română.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ultimele comenzi ({orders.length})</h2>
        {orders.length > 0 && <p>Total: {Object.entries(total).map(([c, v]) => formatPaid(v, c, "ro")).join(" · ")}</p>}
        {orders.length === 0 ? <p className="muted">Nicio comandă încă.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Data</th><th>Email</th><th>Model</th><th>Limba</th><th>Suma</th><th>Emailuri</th><th>Descărcări</th><th>Link până la</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}><td>{when(o.createdAt)}</td><td>{o.email}</td><td>{o.slug}</td><td>{o.locale}</td><td>{formatPaid(o.amount, o.currency, "ro")}</td><td>{o.emailsSent}</td><td>{o.downloads}</td><td>{when(o.expiresAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


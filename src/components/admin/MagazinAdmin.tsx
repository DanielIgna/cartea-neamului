import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import InvitatieForm from "@/components/admin/InvitatieForm";
import { ImagesEditor, ZipUpload } from "@/components/admin/InvitatieFisiere";
import StatusPill from "@/components/admin/InvitatieStare";
import { deleteProductAction, productStatusAction, toggleShopAction } from "@/app/invitatii-nunta-actions";
import { SHOP_CATEGORIES, modelPath, publishProblems, shopPrice, type ShopCategory } from "@/lib/invitatii-nunta";
import { TEXT_LOCALES, adminProducts, productById, salesOf } from "@/lib/invitatii-nunta-produse";
import { recentOrders, shopOpen, shopPaymentsReady } from "@/lib/invitatii-nunta-server";
import { localeNames, whenRo } from "@/lib/invitatii-nunta-admin";
import { formatPaid } from "@/lib/emailuri";

/**
 * Admin → Accesorii nuntă și Admin → Jurnale de familie (Daniel, 28.11.2026): la fel ca Admin → Invitații de nuntă (comutatorul,
 * lista cu vânzări, „Adaugă”, pagina unui produs cu fișierul, pozele, textele, Publică / Retrage / Arhivează / Șterge și ultimele
 * comenzi), pe categoria lor. Aceleași acțiuni și aceleași rute de urcare ca invitațiile.
 */
type NewCategory = Exclude<ShopCategory, "invitatie">;
const NAV: Record<NewCategory, string> = { accesorii: "accesorii-nunta", jurnal: "jurnale" };
const ITEM: Record<NewCategory, { one: string; many: string; add: string; art: string }> = {
  accesorii: { one: "set", many: "Seturi", add: "+ Adaugă un set", art: "setul" },
  jurnal: { one: "jurnal", many: "Jurnale", add: "+ Adaugă un jurnal", art: "jurnalul" },
};

export async function AdminCategoryList({ category, q }: { category: NewCategory; q: Record<string, string | undefined> }) {
  const cat = SHOP_CATEGORIES[category];
  await requireAdmin(cat.admin);
  const it = ITEM[category];
  const [open, orders, products] = await Promise.all([shopOpen(db, category), recentOrders(db, 100, category).catch(() => []), adminProducts(db, category).catch(() => [])]);
  const pay = shopPaymentsReady();
  const total = orders.reduce((a, o) => ({ ...a, [o.currency]: (a[o.currency] ?? 0) + o.amount }), {} as Record<string, number>);
  return (
    <section className="stack">
      <AdminNav active={NAV[category]} />
      {q.ok && <p className="cc-ok" role="status">{q.ok === "pornit" ? "Rubrica e pornită." : q.ok === "sters" ? `Am șters ${it.art}.` : "Rubrica e oprită."}</p>}
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{cat.adminLabel}</h1>
        <p>Rubrica <Link href={cat.path}>{cat.path}</Link> este <b>{open ? "pornită" : "oprită"}</b>. Plata cu cardul: <b>{pay ? "merge" : "oprită (fără cheie Stripe sau, pe o copie de probă, fără cheie de test)"}</b>.</p>
        <p className="muted">Oprită: paginile spun că rubrica e închisă, ies din Google și nu se mai poate cumpăra. Linkurile deja plătite merg în continuare. Codurile de reducere pentru invitații nu merg aici (pagina de plată nu are câmp de cod).</p>
        <form action={toggleShopAction}>
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="on" value={open ? "0" : "1"} />
          <button type="submit" className={open ? "btn" : "btn primary"}>{open ? "Oprește rubrica" : "Pornește rubrica"}</button>
        </form>
      </div>
      <div className="card">
        <div className="shopadm-head">
          <h2 style={{ margin: 0 }}>{it.many} ({products.length})</h2>
          <Link className="btn primary" href={`${cat.admin}/nou`}>{it.add}</Link>
        </div>
        {products.length === 0 ? <p className="muted">Niciun {it.one} încă.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Nume</th><th>Slug</th><th>Regiune</th><th>Preț RON / EUR</th><th>Stare</th><th>Actualizat</th><th>Vânzări</th></tr></thead>
              <tbody>
                {products.map((m) => (
                  <tr key={m.id}>
                    <td><Link href={`${cat.admin}/${m.id}`}><b>{m.texts.ro?.name ?? m.slug}</b></Link></td>
                    <td><code>{m.slug}</code></td>
                    <td>{m.region || "–"}</td>
                    <td>{shopPrice(m, "ro").label} / {shopPrice(m, "de").label}</td>
                    <td><StatusPill status={m.status} />{m.status === "published" && <> <Link href={modelPath(m)}>vezi</Link></>}</td>
                    <td>{whenRo(m.updatedAt)}</td>
                    <td>{m.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">Un {it.one} nou intră ca ciornă. Se publică din pagina lui, după ce are fișierul, cel puțin o poză și textele în română.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ultimele comenzi ({orders.length})</h2>
        {orders.length > 0 && <p>Total: {Object.entries(total).map(([c, v]) => formatPaid(v, c, "ro")).join(" · ")}</p>}
        {orders.length === 0 ? <p className="muted">Nicio comandă încă.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Data</th><th>Email</th><th>Produs</th><th>Limba</th><th>Suma</th><th>Emailuri</th><th>Descărcări</th><th>Link până la</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}><td>{whenRo(o.createdAt)}</td><td>{o.email}</td><td>{o.slug}</td><td>{o.locale}</td><td>{formatPaid(o.amount, o.currency, "ro")}</td><td>{o.emailsSent}</td><td>{o.downloads}</td><td>{whenRo(o.expiresAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export async function AdminCategoryNew({ category }: { category: NewCategory }) {
  const cat = SHOP_CATEGORIES[category];
  await requireAdmin(`${cat.admin}/nou`);
  const it = ITEM[category];
  return (
    <section className="stack">
      <AdminNav active={NAV[category]} />
      <p><Link href={cat.admin}>← Înapoi la {cat.adminLabel.toLowerCase()}</Link></p>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{category === "accesorii" ? "Set nou de accesorii" : "Jurnal nou"}</h1>
        <p className="muted" style={{ marginBottom: 0 }}>Pasul 1: scrie numele, prețul și textele, apoi apasă „Creează {it.art}”. Pasul 2, pe pagina care se deschide: urci {category === "jurnal" ? "PDF-ul (sau un ZIP)" : "ZIP-ul"} și pozele, apoi apeși „Publică”.</p>
      </div>
      <InvitatieForm locales={localeNames(TEXT_LOCALES)} category={category} />
    </section>
  );
}

const OK: Record<string, string> = {
  nou: "Am creat produsul ca ciornă. Acum urcă fișierul și pozele, apoi apasă „Publică”.",
  salvat: "Am salvat schimbările. Paginile publice se refac imediat.",
  publish: "Produsul e publicat: apare pe site și în sitemap.",
  retract: "Produsul e retras (ciornă): nu mai apare pe site. Comenzile plătite se descarcă în continuare.",
  archive: "Produsul e arhivat: nu mai apare pe site. Comenzile plătite se descarcă în continuare.",
};

export async function AdminCategoryProduct({ category, id, q }: { category: NewCategory; id: string; q: Record<string, string | undefined> }) {
  const cat = SHOP_CATEGORIES[category];
  await requireAdmin(`${cat.admin}/${id}`);
  const p = await productById(db, id);
  if (!p || p.category !== category) notFound();
  const it = ITEM[category];
  const sales = await salesOf(db, p.slug, category);
  const problems = publishProblems(p);
  const r = p.row;
  return (
    <section className="stack">
      <AdminNav active={NAV[category]} />
      <p><Link href={cat.admin}>← Înapoi la {cat.adminLabel.toLowerCase()}</Link></p>
      {q.ok && OK[q.ok] && <p className="cc-ok" role="status">{OK[q.ok]}</p>}
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      <div className="card">
        <div className="shopadm-head">
          <h1 style={{ margin: 0 }}>{p.texts.ro?.name ?? p.slug} <StatusPill status={p.status} /></h1>
          {p.status === "published" && <Link className="btn" href={modelPath(p)} target="_blank">Vezi pagina ↗</Link>}
        </div>
        <p className="muted">Slug: <code>{p.slug}</code> · vânzări: <b>{sales}</b> · actualizat: {whenRo(p.updatedAt)}{r.publishedAt ? ` · publicat prima dată: ${whenRo(r.publishedAt)}` : ""}</p>
        {p.status !== "published" && problems.length > 0 && (
          <div><p style={{ marginBottom: 4 }}><b>Ca să-l poți publica, mai trebuie:</b></p><ul style={{ marginTop: 0 }}>{problems.map((x) => <li key={x}>{x}</li>)}</ul></div>
        )}
        <div className="shopadm-actions">
          {p.status !== "published" && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="publish" />
              <button type="submit" className="btn primary" disabled={problems.length > 0}>Publică</button></form>
          )}
          {p.status === "published" && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="retract" />
              <button type="submit" className="btn">Retrage (ciornă)</button></form>
          )}
          {p.status !== "archived" && sales > 0 && (
            <form action={productStatusAction}><input type="hidden" name="rid" value={p.id} /><input type="hidden" name="what" value="archive" />
              <button type="submit" className="btn">Arhivează</button></form>
          )}
        </div>
      </div>
      <ZipUpload id={p.id} pdf={cat.file === "zip-pdf"} current={p.zipKey ? { name: p.zipName ?? `${p.slug}`, size: r.zipSize, files: r.zipFiles, at: r.zipUpdatedAt ? whenRo(r.zipUpdatedAt) : null, version: r.zipVersion } : null} />
      <ImagesEditor id={p.id} images={p.images} />
      <InvitatieForm model={{ ...p, sort: r.sort }} locales={localeNames(TEXT_LOCALES)} slugLocked={!!p.zipKey || sales > 0} category={category} />
      <div className="card shopadm-danger">
        <h2 style={{ marginTop: 0 }}>Ștergerea</h2>
        {sales > 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>Are {sales} {sales === 1 ? "vânzare" : "vânzări"}, deci nu se poate șterge (clienții au linkuri spre el). Îl poți arhiva: dispare de pe site, iar linkurile plătite merg mai departe.</p>
        ) : (
          <form action={deleteProductAction} className="stack">
            <input type="hidden" name="rid" value={p.id} />
            <p className="muted" style={{ margin: 0 }}>Se șterg {it.art}, fișierul și pozele lui urcate. Nu se poate da înapoi. Ca să confirmi, scrie slugul: <code>{p.slug}</code></p>
            <input name="confirm" required autoComplete="off" pattern={p.slug.replace(/-/g, "\\-")} aria-label="Slugul, pentru confirmare" />
            <p style={{ margin: 0 }}><button type="submit" className="btn shopadm-delete">Șterge definitiv</button></p>
          </form>
        )}
      </div>
    </section>
  );
}

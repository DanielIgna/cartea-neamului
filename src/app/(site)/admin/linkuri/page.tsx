import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { SITE_URL } from "@/lib/site-url";
import { LINK_PAGES, linkList, linkUrl } from "@/lib/sursa";
import { newFacebookLinks, newSourceLink, removeSourceLink } from "@/app/linkuri-actions";
import { AdminNav, day, num } from "@/components/admin/ui";
import CopyLink from "@/components/admin/CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Linkuri cu sursă · Admin" };

/**
 * Generatorul de linkuri cu sursă (Daniel, 16.11.2026; src/lib/sursa.ts): scrii numele grupului sau al campaniei și primești
 * carteaneamului.ro/?src=<eticheta>, gata de copiat. Fiecare link rămâne în listă, cu click-urile (vizitele anonime venite pe el)
 * și conturile făcute (prima sursă, doar la cei care au acceptat cookie-urile de analiză).
 */
export default async function SourceLinks({ searchParams }: { searchParams: Promise<{ nou?: string; fb?: string }> }) {
  await requireAdmin("/admin/linkuri");
  const sp = await searchParams;
  const links = await linkList(db);
  const fresh = links.find((l) => l.slug === sp.nou);
  const fbWanted = new Set((sp.fb ?? "").split(",").filter(Boolean));
  const fbFresh = links.filter((l) => fbWanted.has(l.slug));
  const fbText = fbFresh.map((l) => `${l.name}: ${linkUrl(SITE_URL, l.page, l.slug)}`).join("\n");
  return (
    <section className="stack">
      <AdminNav active="linkuri" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Fă un link cu sursă</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Scrie numele grupului de Facebook, al paginii sau al campaniei (de pildă „FB Români New York”). Primești un link ca{" "}
          <code>carteaneamului.ro/?src=fb-romani-new-york</code>: pune-l în postare, iar aici vezi câți au apăsat și câți și-au făcut cont.
        </p>
        <form action={newSourceLink} className="form" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <label style={{ flex: "2 1 260px" }}>Numele grupului sau al campaniei
            <input name="name" required maxLength={80} placeholder="de pildă: FB Români New York" />
          </label>
          <label style={{ flex: "1 1 180px" }}>Duce la
            <select name="page" defaultValue="/">{LINK_PAGES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}</select>
          </label>
          <button className="btn primary">Fă linkul</button>
        </form>
        {fresh && (
          <div className="stack" style={{ gap: 8, marginTop: 14 }}>
            <div className="section-label">Linkul tău e gata</div>
            <code style={{ wordBreak: "break-all", padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8 }}>{linkUrl(SITE_URL, fresh.page, fresh.slug)}</code>
            <div><CopyLink url={linkUrl(SITE_URL, fresh.page, fresh.slug)} label="Copiază linkul" /></div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Generează linkuri pentru grupuri Facebook</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Lipește numele grupurilor, câte unul pe rând. Fiecare primește linkul lui, <code>carteaneamului.ro/?src=fb-numele-grupului</code>, și apare în
          lista de mai jos cu click-urile și conturile lui.
        </p>
        <form action={newFacebookLinks} className="form">
          <label>Numele grupurilor (cel mult 50)
            <textarea name="names" required rows={5} placeholder={"Români în Italia\nRomâni în Chicago\nGenealogie Maramureș"} />
          </label>
          <label style={{ maxWidth: 320 }}>Duc la
            <select name="page" defaultValue="/">{LINK_PAGES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}</select>
          </label>
          <div><button className="btn primary">Generează linkurile</button></div>
        </form>
        {fbFresh.length > 0 && (
          <div className="stack" style={{ gap: 8, marginTop: 14 }}>
            <div className="section-label">{fbFresh.length === 1 ? "Linkul e gata" : `Cele ${fbFresh.length} linkuri sunt gata`}</div>
            <textarea readOnly rows={Math.min(12, fbFresh.length + 1)} value={fbText} style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }} aria-label="Linkurile generate" />
            <div><CopyLink url={fbText} label="Copiază toate" /></div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Linkurile tale</h2>
        {links.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Încă niciun link. Fă primul mai sus.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Link</th><th className="n">Click-uri</th><th className="n">Conturi</th><th>Făcut</th><th></th></tr></thead>
              <tbody>
                {links.map((l) => {
                  const url = linkUrl(SITE_URL, l.page, l.slug);
                  return (
                    <tr key={l.slug}>
                      <td><b>{l.name}</b><small style={{ wordBreak: "break-all" }}>{url}</small></td>
                      <td className="n">{num(l.clicks)}</td>
                      <td className="n">{l.accounts ? <Link href={`/admin/oameni?sursa=${encodeURIComponent(l.slug)}`}>{num(l.accounts)}</Link> : "0"}{l.lastAccounts ? <small>+{l.lastAccounts} ca ultimă sursă</small> : null}</td>
                      <td className="tight">{day(l.createdAt.toISOString())}</td>
                      <td className="tight" style={{ display: "flex", gap: 6 }}>
                        <CopyLink url={url} />
                        <form action={removeSourceLink}><input type="hidden" name="slug" value={l.slug} /><button className="btn" title="Scoate din listă">✕</button></form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginBottom: 0 }}>
          Click-uri = vizitatori care au deschis linkul (unici pe zi, numărați anonim, fără cookie-uri). Conturi = conturi noi care au venit prima dată
          pe acest link; le vezi doar la cei care au acceptat cookie-urile de analiză. Toate sursele, cu vizitatori, plăți și venituri, în{" "}
          <Link href="/admin/analiza?t=surse">Analiză → Surse</Link>.
        </p>
      </div>
    </section>
  );
}

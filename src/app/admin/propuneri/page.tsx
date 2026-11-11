import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { homeSubmission, tree, user } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav, day } from "@/components/admin/ui";
import ProposalActions from "@/components/admin/ProposalActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Poze propuse · Admin" };

const LABEL: Record<string, string> = { pending: "Așteaptă", approved: "Pe prima pagină", rejected: "Lăsată deoparte" };

/**
 * Pozele de familie pe care oamenii le-au propus din „Filmul vieții” pentru bannerul de pe prima pagină. Fiecare a bifat că
 * e în poză sau are acordul celor din ea. Aprobată, poza intră prima în rotația bannerului (o vezi și în Poze prima pagină).
 */
export default async function AdminProposals() {
  await requireAdmin("/admin/propuneri");
  const rows = await db.select({ s: homeSubmission, name: user.name, email: user.email, tree: tree.name }).from(homeSubmission)
    .innerJoin(user, eq(user.id, homeSubmission.userId)).leftJoin(tree, eq(tree.id, homeSubmission.treeId))
    .where(inArray(homeSubmission.status, ["pending", "approved", "rejected"])).orderBy(desc(homeSubmission.createdAt));
  const order = ["pending", "approved", "rejected"];
  rows.sort((a, b) => order.indexOf(a.s.status) - order.indexOf(b.s.status));
  return (
    <section className="stack">
      <AdminNav active="propuneri" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Poze de familie propuse pentru prima pagină</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Oamenii le trimit din „Filmul vieții” de pe profil. Fiecare a bifat că e în poză sau are acordul tuturor celor din ea (pentru copii, al părinților)
          și că poza poate apărea public. Nimic nu apare pe <Link href="/">prima pagină</Link> până nu apeși „Pune pe prima pagină”; atunci intră prima în banner.
          Omul o poate retrage oricând, și atunci iese singură. Uită-te la poză înainte: fețe clare, fără date personale scrise pe ea.
        </p>
      </div>
      {!rows.length && <div className="card"><p className="muted" style={{ margin: 0 }}>Nicio poză propusă încă.</p></div>}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {rows.map(({ s, name, email, tree: treeName }) => (
          <div className="card" key={s.id}>
            <a href={`/api/admin/propunere/${s.id}`} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/propunere/${s.id}`} alt={s.caption ?? "Poza propusă"} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, display: "block" }} />
            </a>
            <div style={{ marginTop: 8 }}>
              <span className={`pill${s.status === "approved" ? " ok" : s.status === "pending" ? " warn" : ""}`}>{LABEL[s.status] ?? s.status}</span>
              {s.caption && <p style={{ margin: "6px 0 0" }}><b>{s.caption}</b></p>}
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
                De la {name || email} ({email}){treeName ? `, arborele „${treeName}”` : ""} · trimisă {day(s.createdAt.toISOString(), true)} · acord „{s.consentTextVersion}”{s.locale ? `, citit în ${s.locale}` : ""}
              </p>
            </div>
            <ProposalActions id={s.id} status={s.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

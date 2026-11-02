import Link from "next/link";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { findInvitation } from "@/lib/invitations";
import { acceptInvite } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const me = await currentUser();
  const found = /^[A-Za-z0-9_-]{20,64}$/.test(token) ? await findInvitation(db, token) : null;
  const expired = found && found.inv.expiresAt < new Date();
  const used = found && found.inv.acceptedBy && found.inv.acceptedBy !== me?.id;
  if (!found || expired || used) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>{!found ? "Invitația nu există" : expired ? "Invitația a expirat" : "Invitația a fost deja folosită"}</h2>
        <p className="muted">Cere-i rudei care te-a invitat un link nou. Linkurile sunt valabile 14 zile și pot fi folosite o singură dată.</p>
      </div>
    );
  }
  const next = `/invitatie/${token}`;
  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="section-label" style={{ marginTop: 0 }}>Invitație</div>
      <h2>Ai fost invitat în arborele „{found.treeName}”</h2>
      <p>Vei putea vedea arborele familiei și completa ramura ta cu nume, poze, documente și amintiri.</p>
      {found.inv.personId && <p className="muted">Rudele te-au adăugat deja în arbore. După ce intri, fișa ta devine a ta: decizi ce rămâne vizibil.</p>}
      {me ? (
        <form action={async () => { "use server"; await acceptInvite(token); }}>
          <button className="btn primary">Intră în arbore ca {me.name}</button>
        </form>
      ) : (
        <div className="actions">
          <Link className="btn primary" href={`/intrare?mod=cont-nou&next=${encodeURIComponent(next)}`}>Creează cont gratuit</Link>
          <Link className="btn" href={`/intrare?next=${encodeURIComponent(next)}`}>Am deja cont</Link>
        </div>
      )}
    </div>
  );
}

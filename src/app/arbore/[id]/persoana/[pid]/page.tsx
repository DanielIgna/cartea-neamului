import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView, where } from "@/lib/tree-data";
import { requireUser, roleIn, can } from "@/lib/access";
import { buildGraph, family, kinship, romanDegree } from "@/lib/kinship";
import { canMessage } from "@/lib/chat";
import { storageConfigured } from "@/lib/storage";
import { years } from "@/components/charts";
import { Avatar } from "@/components/Album";
import ProfileAlbum from "@/components/ProfileAlbum";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/** Profilul unei persoane: poza, ce se știe despre ea, albumul cu descrieri și familia ei apropiată. */
export default async function ProfilePage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const data = await loadTreeView(db, id, undefined, 1);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const g = buildGraph(Object.values(data.people), data.rels);
  const fam = family(g, pid);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const ego = mine?.id ?? data.rootId;
  const kin = ego && ego !== pid ? kinship(g, ego, pid) : null;
  const chat = p.claimedBy && p.claimedBy !== me.id ? await canMessage(db, id, me.id, p.claimedBy) : null;
  const canEdit = can(role, "editor") || (can(role, "contributor") && (p.createdBy === me.id || p.claimedBy === me.id));
  const group = (title: string, ids: string[]) => ids.length > 0 && (
    <>
      <div className="section-label">{title}</div>
      <div className="kin-grid">
        {ids.map((x) => data.people[x]).filter(Boolean).map((r) => (
          <Link key={r.id} className="kin-card" href={`/arbore/${id}/persoana/${r.id}`}>
            <Avatar p={r} size={44} />
            <span><b>{r.name}</b><small>{years(r)}</small></span>
          </Link>
        ))}
      </div>
    </>
  );
  return (
    <section className="stack" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="card">
        <Link href={`/arbore/${id}?p=${pid}`} style={{ fontSize: 14 }}>← Înapoi la arbore, cu {p.givenName} în centru</Link>
        <div className="profile-hero" style={{ marginTop: 12 }}>
          <Avatar p={p} size={128} />
          <div>
            <h2>{p.name}</h2>
            <div className="meta">{p.birthSurname ? `născut(ă) ${p.birthSurname} · ` : ""}{years(p)}{where(p.birthPlace, p.birthCountry) ? ` · n. ${where(p.birthPlace, p.birthCountry)}` : ""}
              {p.living && (p.residencePlace || p.residenceCountry) ? ` · locuiește în ${where(p.residencePlace, p.residenceCountry) || p.residenceCountry}` : ""}</div>
            <div className="chips">
              {p.living ? <span className="chip priv">în viață · vizibil doar în acest arbore</span> : <span className="chip">în amintirea familiei</span>}
              {p.claimed && <span className="chip ok">profil revendicat</span>}
              {p.occupation && <span className="chip">{p.occupation}</span>}
            </div>
            {kin && <div className="kin">Pentru tine: <b>{kin.label}</b>{kin.degree ? ` · gradul ${romanDegree(kin.degree)}` : ""}</div>}
            <div className="actions">
              {chat?.ok && <Link className="btn primary" href={`/mesaje/${id}/${p.claimedBy}`}>Trimite un mesaj</Link>}
              {chat && !chat.ok && <span className="muted" style={{ fontSize: 14 }}>{chat.reason}</span>}
              {p.living && !p.claimed && <span className="muted" style={{ fontSize: 14 }}>{p.givenName} nu are încă cont. Trimite-i o invitație din arbore, ca să-și completeze singur profilul.</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{p.living ? `Despre ${p.givenName}` : `Ce se știe despre ${p.givenName}`}</div>
        {p.biography ? <p className="bio">{p.biography}</p> : <p className="muted">Nimic scris încă.{canEdit ? " Scrie câteva rânduri din fișa persoanei, cu „Editează”." : ""}</p>}
        {p.notes && <><div className="section-label">Note suplimentare</div><p className="notes">{p.notes}</p></>}
      </div>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Album</div>
        <ProfileAlbum p={p} treeId={id} canEdit={can(role, "contributor")} canUpload={can(role, "contributor") && storageConfigured()} />
      </div>
      <div className="card">
        {/* Soții discreți (de pildă o fostă soție) nu apar aici; se văd doar în profilurile copiilor lor, la „Părinți”. */}
        {group(p.sex === "F" ? "Soț" : p.sex === "M" ? "Soție" : "Soț / soție", fam.partners.filter((x) => !data.people[x]?.discreet))}
        {group(`Copii (${fam.children.length})`, fam.children)}
        {group("Părinți", fam.parents)}
        {group(`Frați (${fam.siblings.length})`, fam.siblings)}
        {!fam.partners.length && !fam.children.length && !fam.parents.length && <p className="muted">Nicio rudă legată încă.</p>}
      </div>
    </section>
  );
}

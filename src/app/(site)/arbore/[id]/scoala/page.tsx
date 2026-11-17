import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView, type PersonView } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { photoUrl } from "@/lib/book";
import { isPlaceholder } from "@/lib/family";
import PrintButton from "@/components/PrintButton";
import { SCHOOL_ROWS, schoolSlotLabel } from "@/lib/scoala";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arborele pentru școală", robots: { index: false, follow: false } };
const UUID = /^[0-9a-f-]{36}$/i;

/** Anii, cum îi scrie un copil: „1931 – 2010”, „n. 1985”; fără zile și luni (pentru cei în viață nici nu trebuie mai mult). */
function years(p: PersonView) {
  const b = p.birthYear ? `${p.approx ? "cca " : ""}${p.birthYear}` : "";
  if (p.deathYear) return `${b || "?"} – ${p.deathYear}`;
  return b ? `n. ${b}` : "";
}

/**
 * „Printează pentru proiectul de la școală” (Daniel, 17.11.2026): arborele copilului pe o singură foaie, A4 sau A3 culcat,
 * cu el, părinții, bunicii și străbunicii, cu poze unde există și căsuțe goale (de completat de mână) unde nu se știe.
 * Doar anii, fără date întregi, adrese sau note: foaia ajunge pe peretele clasei.
 */
export default async function SchoolPrint({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ format?: string; p?: string; poze?: string }> }) {
  const { id } = await params;
  const q = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/scoala`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const want = q.p && UUID.test(q.p) ? q.p : mine?.id;
  const data = await loadTreeView(db, id, want, 4, "ro");
  if (!data || !data.slots[1]) notFound();
  const a3 = q.format === "A3";
  const photos = q.poze !== "0";
  const center = data.people[data.slots[1]];
  const link = (o: Record<string, string>) => {
    const s = new URLSearchParams({ ...(q.p ? { p: q.p } : {}), format: a3 ? "A3" : "A4", ...(photos ? {} : { poze: "0" }), ...o });
    return `/arbore/${id}/scoala?${s}`;
  };
  const known = (n: number) => {
    const p = data.people[data.slots[n]];
    return p && !p.discreet && !isPlaceholder(p.givenName) ? p : null;
  };
  return (
    <div className={`sp ${a3 ? "sp-a3" : "sp-a4"}`}>
      <style>{`@page { size: ${a3 ? "A3" : "A4"} landscape; margin: 10mm; }`}</style>
      <div className="sp-tools no-print">
        <Link href={`/arbore/${id}`}>← Înapoi la arbore</Link>
        <div className="sp-opts">
          <span>Hârtie:</span>
          <Link className={`btn ${a3 ? "" : "primary"}`} href={link({ format: "A4" })}>A4</Link>
          <Link className={`btn ${a3 ? "primary" : ""}`} href={link({ format: "A3" })}>A3</Link>
          <Link className="btn" href={link(photos ? { poze: "0" } : { poze: "1" })}>{photos ? "Fără poze" : "Cu poze"}</Link>
          <PrintButton label="Printează" />
        </div>
        <p className="muted">Se tipărește culcat (landscape), pe o foaie. Căsuțele goale se pot completa de mână. Pentru alt copil din familie, deschide arborele din fișa lui.</p>
      </div>
      <h1 className="sp-title">Arborele familiei lui {center?.givenName ?? ""} {center?.surname ?? ""}</h1>
      <div className="sp-tree">
        {SCHOOL_ROWS.map((row, i) => (
          <div key={i} className={`sp-row sp-row-${row.length}`}>
            {row.map((n) => {
              const p = known(n);
              const src = p && photos ? photoUrl(p) : null;
              return (
                <div key={n} className={`sp-box ${n % 2 || n === 1 ? "" : "sp-m"} ${n === 1 ? "sp-me" : ""}`}>
                  <div className="sp-rel">{schoolSlotLabel(n)}</div>
                  {photos && (src ? <img src={src} alt="" className="sp-ph" /> : <div className="sp-ph sp-ph-empty" aria-hidden />)}
                  {p ? <><div className="sp-name">{p.givenName} {p.surname}</div><div className="sp-yr">{years(p)}</div>{p.birthPlace && <div className="sp-pl">{p.birthPlace}</div>}</>
                    : <><div className="sp-line" /><div className="sp-line" /></>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="sp-foot">Făcut cu drag pe carteaneamului.ro</div>
    </div>
  );
}

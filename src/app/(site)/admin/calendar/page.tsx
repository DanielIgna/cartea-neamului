import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { buildCalendar, calendarMarks, calendarVisits, linkFor } from "@/lib/calendar-continut";
import { markCalendarItem } from "@/app/crestere-actions";
import { AdminNav } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar de conținut · Admin" };

const when = (d: string) => new Intl.DateTimeFormat("ro", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
const KIND: Record<string, string> = { sezon: "Zi bună", nume: "Numele săptămânii", judet: "Județul săptămânii", ghid: "Ghidul săptămânii" };

/**
 * Admin → Calendar de conținut: următoarele 8 săptămâni, cu textul gata scris și legătura cu semnele din Analiză.
 * Copiezi textul și legătura, le pui unde scrie, apoi bifezi „Făcut”. Vizitele aduse apar lângă fiecare. Vezi src/lib/calendar-continut.ts.
 */
export default async function Calendar() {
  await requireAdmin("/admin/calendar");
  const [marks, visits] = await Promise.all([calendarMarks(db).catch(() => ({} as Record<string, string>)), calendarVisits(db).catch(() => new Map<string, number>())]);
  const items = buildCalendar(new Date(), 8);
  const today = new Date().toISOString().slice(0, 10);
  const done = items.filter((i) => marks[i.id] === "facut").length;
  return (
    <section className="stack">
      <AdminNav active="calendar" />
      <div className="card">
        <p style={{ marginTop: 0, maxWidth: "80ch" }}>Trei postări pe săptămână (marți un nume, joi un județ, sâmbătă un ghid) plus zilele bune din an. Textele sunt
          neutre, fără limbaj religios. Regula din grupuri: întâi ajuți, apoi pui linkul; unde regulile nu permit linkuri, dai doar sfatul.</p>
        <p className="muted small" style={{ marginBottom: 0 }}>{done} din {items.length} făcute. Planul întreg: <Link href="/admin/cunostinte?q=reclame">Clienți fără reclame plătite</Link>.</p>
      </div>
      {items.map((it) => {
        const st = marks[it.id];
        const url = linkFor(it);
        const v = visits.get(it.id.slice(0, 50)) ?? 0;
        return (
          <div key={it.id} className="card" style={{ opacity: st ? 0.6 : 1, borderLeft: it.date === today ? "4px solid var(--accent, #8a4b2a)" : undefined }}>
            <div className="muted small">{when(it.date)} · {it.channel} · {KIND[it.kind]}{st === "facut" ? " · ✓ făcut" : st === "sarit" ? " · sărit" : ""}{v ? ` · ${v} vizitatori aduși` : ""}</div>
            <h3 style={{ margin: "4px 0" }}>{it.title}</h3>
            <p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>{it.text}</p>
            <p className="small" style={{ margin: "4px 0", wordBreak: "break-all" }}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
            <form action={markCalendarItem} className="actions" style={{ marginTop: 6 }}>
              <input type="hidden" name="id" value={it.id} />
              {st ? <button className="btn" name="status" value="">Înapoi la „de făcut”</button> : <>
                <button className="btn primary" name="status" value="facut">Făcut</button>
                <button className="btn" name="status" value="sarit">Sar peste</button>
              </>}
            </form>
          </div>
        );
      })}
    </section>
  );
}

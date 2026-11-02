import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree } from "@/db/schema";
import { loadTimeline } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { HISTORICAL_EVENTS } from "@/lib/history";

export const dynamic = "force-dynamic";

export default async function Timeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/cronologie`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const [t] = await db.select().from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const people = await loadTimeline(db, id);
  const now = new Date().getFullYear();
  const minY = Math.floor(Math.min(...people.map((p) => p.birthYear!), now - 60) / 20) * 20, maxY = now + 4;
  const events = HISTORICAL_EVENTS.filter((e) => e.to >= minY && (!t.region || e.regions.includes("*") || e.regions.includes(t.region)));
  const L = 170, R = 900, y0 = 72, rh = 22, H = y0 + people.length * rh + 30;
  const X = (y: number) => L + ((y - minY) / (maxY - minY)) * (R - L);
  const ticks = Array.from({ length: Math.floor((maxY - minY) / 20) + 1 }, (_, i) => minY + i * 20);
  return (
    <div className="card">
      <div className="toolbar"><div className="title">Viețile familiei pe fundalul istoriei</div><Link className="btn" href={`/arbore/${id}`}>Înapoi la arbore</Link></div>
      <div className="chartbox">
        <svg viewBox={`0 0 920 ${H}`} role="img" aria-label="Cronologie" style={{ width: "100%", minWidth: 720 }}>
          {events.map((e, i) => (
            <g key={e.title}>
              <rect x={X(e.from)} y={y0 - 10} width={Math.max(X(e.to) - X(e.from), 3)} height={H - y0 - 14} fill="var(--event)" />
              <text x={X(e.from)} y={18 + (i % 3) * 15} fill="var(--accent)" fontSize={11} fontWeight={700}>{e.title} {e.from === e.to ? e.from : `${e.from}–${e.to}`}</text>
            </g>
          ))}
          {ticks.map((y) => (
            <g key={y}><line x1={X(y)} x2={X(y)} y1={y0 - 10} y2={H - 24} stroke="var(--line)" strokeDasharray="2 4" /><text x={X(y)} y={H - 8} textAnchor="middle" fill="var(--muted)" fontSize={11}>{y}</text></g>
          ))}
          {people.map((p, k) => {
            const y = y0 + k * rh, end = p.deathYear ?? (p.living ? now : p.birthYear! + 1);
            return (
              <g key={p.id}>
                <text x={L - 8} y={y + 4} textAnchor="end" fill="var(--ink)" fontSize={12}>{p.name}</text>
                <rect x={X(p.birthYear!)} y={y - 6} width={Math.max(X(end) - X(p.birthYear!), 4)} height={12} rx={6} fill={p.sex === "F" ? "var(--mat-1)" : "var(--pat-1)"} stroke={p.living ? "var(--accent)" : "none"} />
                <text x={X(end) + 6} y={y + 4} fill="var(--muted)" fontSize={10.5}>{p.birthYear}{p.deathYear ? `–${p.deathYear}` : ""}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

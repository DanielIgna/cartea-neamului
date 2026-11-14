import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { partnerReport, toCsv } from "@/lib/carduri-cadou";

export const dynamic = "force-dynamic";

/** Admin → Carduri cadou → raportul pe magazine (CSV): generate, vândute, activate, comision datorat. */
export async function GET() {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const rows = await partnerReport(db);
  const csv = toCsv(
    ["Magazin", "Oraș", "Activ", "Comision %", "Generate", "Livrate", "Vândute", "Activate", "Anulate", "Încasări raft (lei)", "Comision datorat (lei)"],
    rows.map((r) => [r.nume, r.oras, r.activ ? "da" : "nu", r.comisionProcent, r.generate, r.livrate, r.vandute, r.activate, r.anulate, r.incasariLei.toFixed(2), r.comisionLei.toFixed(2)]),
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="carduri-cadou-raport-${day}.csv"`, "cache-control": "no-store" } });
}

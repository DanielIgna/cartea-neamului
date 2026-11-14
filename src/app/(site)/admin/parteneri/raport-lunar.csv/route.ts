import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { toCsv } from "@/lib/carduri-cadou";
import { monthOf, monthRange, monthReport } from "@/lib/parteneri-crm";

export const dynamic = "force-dynamic";

/** Admin → City Partners → raportul lunar „de plată” (CSV), câte un rând pe partener cu ceva în luna aleasă, pentru facturi. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const l = new URL(req.url).searchParams.get("luna") ?? "";
  const month = monthRange(l) ? l : monthOf();
  const rows = (await monthReport(db, month)).filter((r) => r.vandute || r.activate || r.conturiAduse || r.platiAduse);
  const csv = toCsv(
    ["Luna", "Partener", "Tip", "Oraș", "Comision %", "Carduri vândute", "Carduri activate", "Încasări raft (lei)", "Comision carduri (lei)", "Conturi aduse", "Plăți aduse", "Plăți aduse (lei)", "Comision recomandări (lei)", "Total de plată (lei)"],
    rows.map((r) => [month, r.nume, r.tip, r.oras, r.comisionProcent, r.vandute, r.activate, r.incasariLei.toFixed(2), r.comisionCarduri.toFixed(2), r.conturiAduse, r.platiAduse, r.platiAduseLei.toFixed(2), r.comisionRecomandari.toFixed(2), r.total.toFixed(2)]),
  );
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="parteneri-de-plata-${month}.csv"`, "cache-control": "no-store" } });
}

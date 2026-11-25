import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { codesCsv, isCodeStatus, normalizeActivationCode, normalizeSource } from "@/lib/coduri-activare";

export const dynamic = "force-dynamic";

/** Admin → Coduri de activare → CSV (cod + link complet de activare, pentru QR), cu aceleași filtre ca lista. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const p = new URL(req.url).searchParams;
  const lot = p.get("lot");
  const status = p.get("status");
  const csv = await codesCsv(db, {
    status: isCodeStatus(status) ? status : null, sursa: normalizeSource(p.get("sursa") ?? ""),
    lot: lot && /^[a-z0-9-]{1,80}$/i.test(lot) ? lot : null, cod: normalizeActivationCode(p.get("cod") ?? ""),
  });
  const name = ["coduri-activare", lot ?? normalizeSource(p.get("sursa") ?? "") ?? "", new Date().toISOString().slice(0, 10)].filter(Boolean).join("-");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}.csv"`, "cache-control": "no-store" } });
}

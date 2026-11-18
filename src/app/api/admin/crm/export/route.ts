import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { crmAudit, exportCsv, isExportKind } from "@/lib/crm-curatenie";

export const dynamic = "force-dynamic";

/** Exportul CSV al unei liste din CRM (doar admin). Fiecare export se trece în istoricul modificărilor. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me)) || !me) return new Response("nu", { status: 403 });
  const kind = new URL(req.url).searchParams.get("lista");
  if (!isExportKind(kind)) return new Response("lista necunoscută", { status: 400 });
  const csv = await exportCsv(db, kind);
  await crmAudit(db, me.id, `export CSV: ${kind}`, null, null);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="crm-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}

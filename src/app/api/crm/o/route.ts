import { db } from "@/db";
import { checkSendSig, trackSend } from "@/lib/crm-campanii";

export const dynamic = "force-dynamic";
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/** Deschiderea unui email de campanie CRM: doar data, pe trimitere și pe organizație. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const d = u.searchParams.get("d") ?? "", s = u.searchParams.get("s") ?? "";
  if (/^[0-9a-f-]{36}$/i.test(d) && checkSendSig(d, s)) await trackSend(db, d, "deschis").catch(() => undefined);
  return new Response(GIF, { headers: { "content-type": "image/gif", "cache-control": "no-store, max-age=0" } });
}

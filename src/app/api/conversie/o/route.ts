import { db } from "@/db";
import { checkMailSig, trackMail } from "@/lib/conversie";

export const dynamic = "force-dynamic";
// Un GIF transparent de 1×1, ca deschiderea emailului să se numere (Admin → Analiză → Conversii).
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/** Deschiderea unui email din zilele gratuite: doar numărul, fără IP sau altceva despre om. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const m = u.searchParams.get("m") ?? "", s = u.searchParams.get("s") ?? "";
  if (m && s && checkMailSig(m, s)) await trackMail(db, m, "open").catch(() => undefined);
  return new Response(GIF, { headers: { "content-type": "image/gif", "cache-control": "no-store, max-age=0" } });
}

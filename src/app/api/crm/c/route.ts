import { db } from "@/db";
import { checkSendSig, sitePath, trackSend } from "@/lib/crm-campanii";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Click într-un email de campanie CRM: se trece pe organizație, apoi omul ajunge pe pagina din site (doar căi din site). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const d = u.searchParams.get("d") ?? "", s = u.searchParams.get("s") ?? "";
  if (/^[0-9a-f-]{36}$/i.test(d) && checkSendSig(d, s)) await trackSend(db, d, "click").catch(() => undefined);
  return Response.redirect(`${await siteOrigin()}${sitePath(u.searchParams.get("u"))}`, 302);
}

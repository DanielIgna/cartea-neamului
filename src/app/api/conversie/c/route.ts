import { db } from "@/db";
import { checkMailSig, safePath, trackMail } from "@/lib/conversie";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Clic pe un buton dintr-un email din zilele gratuite: se numără și omul ajunge la pagina din site (doar adrese din site). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const m = u.searchParams.get("m") ?? "", s = u.searchParams.get("s") ?? "";
  const to = safePath(u.searchParams.get("u"));
  if (m && s && checkMailSig(m, s)) await trackMail(db, m, "click").catch(() => undefined);
  return Response.redirect(`${await siteOrigin()}${to}`, 302);
}

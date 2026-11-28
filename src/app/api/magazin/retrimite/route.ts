import { db } from "@/db";
import { doneSlugPath, categoryOf } from "@/lib/invitatii-nunta";
import { orderBySession, resendShopMail } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/** „Retrimite emailul” de pe pagina de după plată a accesoriilor și jurnalelor: cel mult 5 emailuri, la cel puțin un minut. */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const id = String((await req.formData()).get("session_id") ?? "");
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return Response.redirect(`${origin}/produse`, 303);
  const order = await orderBySession(db, id).catch(() => null);
  const done = doneSlugPath(categoryOf(order?.category));
  const r = order ? await resendShopMail(db, id, origin).catch(() => "error" as const) : "missing";
  return Response.redirect(`${origin}${done}?session_id=${encodeURIComponent(id)}&trimis=${r}`, 303);
}

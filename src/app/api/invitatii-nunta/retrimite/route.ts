import { db } from "@/db";
import { SHOP_DONE_PATH } from "@/lib/invitatii-nunta";
import { resendShopMail } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/** „Retrimite emailul” de pe pagina de după plată: cel mult 5 emailuri pe comandă, la cel puțin un minut unul de altul. */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const id = String((await req.formData()).get("session_id") ?? "");
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return Response.redirect(`${origin}${SHOP_DONE_PATH}`, 303);
  const r = await resendShopMail(db, id, origin).catch(() => "error" as const);
  return Response.redirect(`${origin}${SHOP_DONE_PATH}?session_id=${encodeURIComponent(id)}&trimis=${r}`, 303);
}

import { db } from "@/db";
import { checkSendSig, crmUnsubPage, trackSend } from "@/lib/crm-campanii";

export const dynamic = "force-dynamic";

/** Dezabonarea dintr-un clic din programul de email (List-Unsubscribe-Post). Un GET duce la pagina cu buton. */
export async function POST(req: Request) {
  const u = new URL(req.url);
  const d = u.searchParams.get("d") ?? "", s = u.searchParams.get("s") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(d) || !checkSendSig(d, s)) return new Response("nu", { status: 400 });
  await trackSend(db, d, "dezabonat");
  return new Response("ok");
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  const d = u.searchParams.get("d") ?? "";
  return Response.redirect(/^[0-9a-f-]{36}$/i.test(d) ? crmUnsubPage(d) : new URL("/", req.url).toString(), 302);
}

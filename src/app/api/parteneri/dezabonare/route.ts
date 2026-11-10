import { unsubscribePartner } from "@/app/parteneri-actions";

/**
 * Dezabonarea „dintr-un clic” cerută de programele de email (RFC 8058, antetul List-Unsubscribe-Post): partenerul pune în
 * emailuri `List-Unsubscribe: <https://…/api/parteneri/dezabonare?t=…>`, iar programul de email trimite aici un POST.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const r = await unsubscribePartner(token);
  return new Response(r.ok ? "ok" : "bad", { status: r.ok ? 200 : 400, headers: { "content-type": "text/plain; charset=utf-8" } });
}

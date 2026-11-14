import { db } from "@/db";
import { recordConsent } from "@/lib/consent";
import { checkUnsubscribe } from "@/lib/crestere";

/** Dezabonarea „dintr-un clic” cerută de programele de email (antetul List-Unsubscribe-Post, RFC 8058). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "", t = url.searchParams.get("t") ?? "";
  if (!u || !t || !checkUnsubscribe(u, t)) return new Response("invalid", { status: 400 });
  await recordConsent(db, u, "news", false);
  return new Response("ok");
}

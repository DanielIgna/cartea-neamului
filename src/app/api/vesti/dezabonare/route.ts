import { db } from "@/db";
import { recordConsent } from "@/lib/consent";
import { checkUnsubscribe } from "@/lib/crestere";
import { checkUnsub } from "@/lib/conversie";

/** Dezabonarea „dintr-un clic” cerută de programele de email (antetul List-Unsubscribe-Post, RFC 8058). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "", t = url.searchParams.get("t") ?? "";
  const conv = url.searchParams.get("l") === "conversie";
  if (!u || !t || !(conv ? checkUnsub(u, t) : checkUnsubscribe(u, t))) return new Response("invalid", { status: 400 });
  await recordConsent(db, u, conv ? "conversie" : "news", false);
  return new Response("ok");
}

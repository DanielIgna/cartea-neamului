import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { cookieValue } from "@/lib/securitate";
import { cleanCode, INVITE_COOKIE, INVITE_COOKIE_DAYS, ownerOfCode, recordClick } from "@/lib/invitatii";

export const dynamic = "force-dynamic";

const CHANNELS = new Set(["whatsapp", "facebook", "messenger", "email", "sms", "link", "telefon", "arbore"]);

/**
 * Legătura personală de invitație (src/lib/invitatii.ts): ține minte 30 de zile codul celui care a invitat (cookie fără date
 * personale) și duce la pagina de bun venit a invitației. O deschidere se numără o dată pe browser; propria legătură, deschisă
 * de omul însuși, nu se numără și nu lasă cookie.
 */
export async function GET(req: Request, { params }: { params: Promise<{ cod: string }> }) {
  const code = cleanCode((await params).cod);
  const owner = await ownerOfCode(db, code).catch(() => null);
  if (!owner) return NextResponse.redirect(new URL("/", req.url));
  const channel = new URL(req.url).searchParams.get("c")?.toLowerCase() ?? "";
  const to = new URL(`/invitat/${code}`, req.url);
  // Semnele din Analiză: sursa „invitatie”, canalul pe care a fost trimisă legătura.
  to.searchParams.set("utm_source", "invitatie");
  to.searchParams.set("utm_medium", CHANNELS.has(channel) ? channel : "link");
  to.searchParams.set("utm_campaign", "invitatie");
  const res = NextResponse.redirect(to);
  const me = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  if (me?.user.id === owner.userId) return res;
  const had = cookieValue(req.headers.get("cookie"), INVITE_COOKIE);
  if (had !== code) await recordClick(db, owner.userId).catch((e) => console.error("invitatii: deschiderea", e));
  res.cookies.set(INVITE_COOKIE, code, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: INVITE_COOKIE_DAYS * 86_400 });
  return res;
}

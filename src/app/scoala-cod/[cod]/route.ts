import { NextResponse } from "next/server";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { SCHOOL_COOKIE, recordSchoolSignup } from "@/lib/scoli";

/**
 * Linkul codului unei clase (carteaneamului.ro/scoala-cod/<COD>, dat de învățător): ține minte codul 30 de zile, ca să fie
 * trecut pe contul nou și pus singur la plată, apoi duce la crearea contului. Codul se verifică abia la cont și la plată.
 */
export async function GET(req: Request, { params }: { params: Promise<{ cod: string }> }) {
  const code = (await params).cod.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  // Cine are deja cont și e intrat: codul se trece pe contul lui pe loc, apoi merge la arbore.
  const me = await currentUser();
  if (me && code.length >= 6) await recordSchoolSignup(db, me.id, `${SCHOOL_COOKIE}=${code}`);
  const url = new URL(me ? "/" : "/intrare?mod=cont-nou&scoala=1", req.url);
  const res = NextResponse.redirect(url, 303);
  if (code.length >= 6) res.cookies.set(SCHOOL_COOKIE, code, { path: "/", maxAge: 30 * 86_400, sameSite: "lax", secure: url.protocol === "https:", httpOnly: true });
  return res;
}

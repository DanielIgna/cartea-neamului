import { NextResponse } from "next/server";
import { currentUser } from "@/lib/access";
import { LINK_CODE_COOKIE, cleanLinkCode } from "@/lib/cod-link";

/**
 * Linkul unui cod de reducere (carteaneamului.ro/cod/NEAM90 sau /cod/NEAM-XXXX): ține minte codul 30 de zile, ca să se pună singur
 * la plata primului an (src/lib/cod-link.ts), apoi duce la plată sau, fără cont, la crearea contului. Codul se verifică la plată.
 */
export async function GET(req: Request, { params }: { params: Promise<{ cod: string }> }) {
  const code = cleanLinkCode((await params).cod);
  const me = await currentUser();
  const url = new URL(me ? "/plata" : "/intrare?mod=cont-nou&next=/plata", req.url);
  const res = NextResponse.redirect(url, 303);
  if (code) res.cookies.set(LINK_CODE_COOKIE, code, { path: "/", maxAge: 30 * 86_400, sameSite: "lax", secure: url.protocol === "https:", httpOnly: true });
  return res;
}

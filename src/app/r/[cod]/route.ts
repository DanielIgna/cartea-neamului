import { NextResponse } from "next/server";
import { db } from "@/db";
import { partnerByRef, REF_COOKIE } from "@/lib/parteneri-crm";

export const dynamic = "force-dynamic";

/**
 * Legătura de recomandare a unui partener (de pe afișul, autocolantul sau cardul din kitul magazinului): ține minte 60 de zile
 * de la ce partener a venit omul (cookie fără date personale, doar codul magazinului) și îl duce pe prima pagină. Dacă își face
 * cont în acest timp, contul e trecut pe acel partener (src/lib/auth.ts → recordReferral).
 */
export async function GET(req: Request, { params }: { params: Promise<{ cod: string }> }) {
  const { cod } = await params;
  const p = await partnerByRef(db, cod);
  const to = new URL("/", req.url);
  if (!p || p.etapa === "respins") return NextResponse.redirect(to);
  to.searchParams.set("utm_source", "partener");
  to.searchParams.set("utm_medium", "afis");
  to.searchParams.set("utm_campaign", cod.toUpperCase());
  const res = NextResponse.redirect(to);
  res.cookies.set(REF_COOKIE, cod.toUpperCase(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 86_400 });
  return res;
}

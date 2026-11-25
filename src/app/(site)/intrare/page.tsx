import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { redirect } from "next/navigation";
import { isPeriod, isTier } from "@/lib/plans";
import { currentUser } from "@/lib/access";
import { googleEnabled, turnstileSiteKey } from "@/lib/auth";
import PageIntl from "@/i18n/PageIntl";
import AuthForm from "@/components/AuthForm";
import DraftNote from "@/components/DraftNote";

export const dynamic = "force-dynamic";
/** Intrarea în cont nu are ce căuta în Google (pe lângă robots.txt). */
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; mod?: string; eroare?: string; error?: string; scoala?: string; plan?: string; perioada?: string }> }) {
  const { next, mod, eroare, error, scoala, plan, perioada } = await searchParams;
  // „Alege Familie” de pe prima pagină (25.11.2026): după cont (sau direct, dacă e deja în cont) la plată, cu planul și perioada alese.
  const pay = isTier(plan) ? `/plata?perioada=${isPeriod(perioada) ? perioada : "an"}&plan=${plan}#plan-${plan}` : null;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : pay ?? "/";
  if (await currentUser()) redirect(safeNext);
  return <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}>{scoala && <p className="ok-box" style={{ marginTop: 0 }}>Codul clasei e ținut minte: după zilele gratuite, reducerea școlii se pune singură la plată.</p>}{mod === "cont-nou" && <DraftNote />}<PageIntl ns={["TwoStep"]}><AuthForm next={safeNext} startWithSignUp={mod === "cont-nou"} google={googleEnabled()} oauthError={eroare ?? error} turnstileKey={turnstileSiteKey()} /></PageIntl></div>;
}

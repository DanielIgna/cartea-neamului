import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { GMAIL_INBOX, checkAuthState, exchangeCode, gmailState, saveGmailState, seal } from "@/lib/crm-gmail";

export const dynamic = "force-dynamic";

/** Întoarcerea de la Google: cheia de citire se păstrează criptată. Nu se citește nimic aici. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (msg: string) => Response.redirect(new URL(`/admin/crm?t=sanatate&ok=${encodeURIComponent(msg)}`, req.url), 302);
  const me = await currentUser();
  if (!(await adminReady(me)) || !me) return new Response("nu", { status: 403 });
  if (u.searchParams.get("error")) return back("Legarea Gmail a fost anulată.");
  if (!checkAuthState(me.id, u.searchParams.get("state"))) return back("Legătura a expirat; încearcă din nou.");
  const code = u.searchParams.get("code");
  if (!code) return back("Google n-a trimis codul.");
  try {
    const t = await exchangeCode(code);
    const st = await gmailState(db);
    await saveGmailState(db, { ...st, sealed: seal(t.refreshToken), email: GMAIL_INBOX, linkedAt: new Date().toISOString(), lastError: null }, me.id);
    return back("Gmail e legat (doar citire). Pornește „CRM: răspunsuri din Gmail” în Autonomie.");
  } catch (e) {
    return back(`Nu s-a putut lega Gmail: ${e instanceof Error ? e.message : "eroare"}`);
  }
}

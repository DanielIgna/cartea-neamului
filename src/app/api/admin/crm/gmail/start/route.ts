import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { authState, authUrl, gmailClient } from "@/lib/crm-gmail";

export const dynamic = "force-dynamic";

/** „Leagă Gmail” (Admin → CRM): duce la Google pentru acordul de citire a inbox-ului (doar citire). */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await adminReady(me)) || !me) return new Response("nu", { status: 403 });
  const c = gmailClient();
  if (!c) return Response.redirect(new URL(`/admin/crm?t=sanatate&ok=${encodeURIComponent("Lipsesc GMAIL_CLIENT_ID și GMAIL_CLIENT_SECRET în Vercel.")}`, req.url), 302);
  return Response.redirect(authUrl(c.id, authState(me.id)), 302);
}

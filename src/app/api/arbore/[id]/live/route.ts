import { db } from "@/db";
import { currentUser, roleIn } from "@/lib/access";
import { realtimeConfigured, sealTreePeople } from "@/lib/realtime";
import { getT } from "@/i18n/server";

/** Reînnoiește interogarea live a arborelui (expiră după ~60 s). Utilizatorul vine din sesiune, nu din cerere. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  // Pagina trimite utilizatorul pentru care a fost încărcată; altă sesiune (delogare, alt cont) = 401.
  if (!me || body.userId !== me.id) return Response.json({ error: (await getT("Errors"))("signIn") }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await roleIn(db, id, me.id))) return Response.json({ error: (await getT("ApiErrors"))("noTree") }, { status: 404 });
  if (!realtimeConfigured()) return Response.json({ error: "Realtime nu e configurat." }, { status: 503 });
  return Response.json(await sealTreePeople(me.id, id));
}

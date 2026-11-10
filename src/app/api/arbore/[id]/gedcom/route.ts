import { db } from "@/db";
import { exportGedcom } from "@/lib/gedcom-db";
import { currentUser, roleIn } from "@/lib/access";
import { getT } from "@/i18n/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return new Response((await getT("Errors"))("signIn"), { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await roleIn(db, id, me.id))) return new Response((await getT("ApiErrors"))("noTree"), { status: 404 });
  const includeLiving = new URL(req.url).searchParams.get("living") === "1";
  const body = await exportGedcom(db, id, { includeLiving });
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="arbore-${id.slice(0, 8)}.ged"` },
  });
}

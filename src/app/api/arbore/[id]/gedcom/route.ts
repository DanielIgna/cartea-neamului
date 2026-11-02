import { db } from "@/db";
import { exportGedcom, treeExists } from "@/lib/gedcom-db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await treeExists(db, id))) return new Response("Arborele nu există.", { status: 404 });
  const includeLiving = new URL(req.url).searchParams.get("living") === "1";
  const body = await exportGedcom(db, id, { includeLiving });
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="arbore-${id.slice(0, 8)}.ged"` },
  });
}

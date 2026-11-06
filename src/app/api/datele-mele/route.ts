import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { exportMyData } from "@/lib/account";
import { siteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** „Descarcă datele mele”: tot ce ține de contul celui intrat, ca un fișier JSON. */
export async function GET() {
  const me = await currentUser();
  if (!me) return new Response("Intră în cont.", { status: 401 });
  const data = await exportMyData(db, me.id, await siteOrigin());
  if (!data) return new Response("Contul nu mai există.", { status: 404 });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cartea-neamului-datele-mele-${day}.json"`,
      "cache-control": "no-store",
    },
  });
}

import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { exportMyData } from "@/lib/account";
import { siteOrigin } from "@/lib/site";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** „Descarcă datele mele”: tot ce ține de contul celui intrat, ca un fișier JSON. */
export async function GET() {
  const me = await currentUser();
  if (!me) return new Response((await getT("Errors"))("signIn"), { status: 401 });
  const data = await exportMyData(db, me.id, await siteOrigin());
  if (!data) return new Response((await getT("ApiErrors"))("noAccount"), { status: 404 });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cartea-neamului-datele-mele-${day}.json"`,
      "cache-control": "no-store",
    },
  });
}

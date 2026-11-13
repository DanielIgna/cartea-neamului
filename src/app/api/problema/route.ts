import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { problemReport, type ProblemImage } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { deleteObjects, putObject, storageConfigured } from "@/lib/storage";
import { checkProblem, looksLikeImage, memberTree, notifyNewProblem, problemContext, problemImageKey, PROBLEM_LIMITS, reportsToday } from "@/lib/probleme";
import { siteOrigin } from "@/lib/site";
import { getLocale } from "@/i18n/server";

/**
 * „Raportează o problemă”: textul omului, felul problemei, până la 3 poze ale ecranului (micșorate deja în browser) și pagina din
 * care a venit. Răspunde cu un cod scurt de eroare, pe care pagina îl arată în limba omului.
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return Response.json({ error: "signIn" }, { status: 401 });
  // Contul de exemplu e al tuturor: de pe el nu se trimite, ca nimeni să nu vadă ce a scris altcineva.
  if (isDemo(me.email)) return Response.json({ error: "demo" }, { status: 403 });
  let form: FormData;
  try { form = await req.formData(); } catch { return Response.json({ error: "tooBig" }, { status: 413 }); }
  const checked = checkProblem({ kind: form.get("kind"), message: form.get("message") });
  if ("problem" in checked) return Response.json({ error: checked.problem }, { status: 400 });
  if ((await reportsToday(db, me.id)) >= PROBLEM_LIMITS.perDay) return Response.json({ error: "tooMany" }, { status: 429 });

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > PROBLEM_LIMITS.images) return Response.json({ error: "tooManyImages" }, { status: 400 });
  if (files.reduce((s, f) => s + f.size, 0) > PROBLEM_LIMITS.totalBytes) return Response.json({ error: "tooBig" }, { status: 413 });
  const pics: { bytes: Uint8Array; type: string }[] = [];
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const type = looksLikeImage(bytes);
    if (!type) return Response.json({ error: "imageType" }, { status: 415 });
    pics.push({ bytes, type });
  }
  if (pics.length && !storageConfigured()) return Response.json({ error: "storageOff" }, { status: 503 });

  const ctx = problemContext(form.get("page"));
  const treeId = await memberTree(db, me.id, ctx.treeId);
  const id = randomUUID();
  const images: ProblemImage[] = [];
  try {
    for (const p of pics) {
      const key = problemImageKey(id, p.type);
      await putObject(key, p.bytes, p.type);
      images.push({ key, type: p.type });
    }
  } catch (err) {
    console.error("problema: poze", err);
    await deleteObjects(images.map((i) => i.key));
    return Response.json({ error: "failed" }, { status: 503 });
  }
  const screen = String(form.get("screen") ?? "").slice(0, 40) || null;
  const browser = (req.headers.get("user-agent") ?? "").slice(0, 300) || null;
  await db.insert(problemReport).values({
    id, userId: me.id, treeId, personId: treeId ? ctx.personId : null, kind: checked.ok.kind, message: checked.ok.message,
    page: ctx.page, images, browser, screen, locale: await getLocale(),
  });
  // Emailul către noi e doar un semn în plus: problema e oricum în Admin → Probleme.
  await notifyNewProblem({ id, ...checked.ok, page: ctx.page, images }, { name: me.name, email: me.email }, await siteOrigin()).catch(() => false);
  revalidatePath("/admin/probleme");
  return Response.json({ ok: true });
}

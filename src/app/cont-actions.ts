"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { currentUser } from "@/lib/access";
import { deleteAccount, withdrawFaith } from "@/lib/account";
import { isDemo } from "@/lib/demo";
import { deleteObjects } from "@/lib/storage";
import { getT } from "@/i18n/server";

/**
 * Șterge contul celui intrat, după ce își scrie adresa de email ca să confirme. Contul de probă (cu parola publică) nu se
 * poate șterge. La sfârșit iese din cont și ajunge pe prima pagină, cu un mesaj.
 */
export async function deleteMyAccount(input: { confirm: string; scrub: boolean }): Promise<{ error?: string }> {
  const me = await currentUser();
  if (!me) return { error: (await getT("Errors"))("signIn") };
  const t = await getT("MyData");
  if (isDemo(me.email)) return { error: t("errors.demoDelete") };
  if ((input.confirm ?? "").trim().toLowerCase() !== me.email.toLowerCase()) return { error: t("errors.email") };
  const { fileKeys } = await deleteAccount(db, me.id, { scrub: !!input.scrub });
  await deleteObjects(fileKeys);
  // Sesiunea a plecat odată cu contul; ștergem și cookie-ul din browser.
  try { await auth.api.signOut({ headers: await headers() }); } catch { /* sesiunea nu mai există */ }
  // Și copia scurtă a sesiunii (ținută câteva minute în browser, ca paginile să se deschidă repede).
  const jar = await cookies();
  for (const c of jar.getAll()) if (c.name.includes("better-auth.session")) jar.delete(c.name);
  revalidatePath("/", "layout");
  redirect("/?cont=sters");
}

/** Retrage acordul pentru capitolul „Credința”: răspunsurile din acest capitol se șterg. */
export async function withdrawFaithConsent(): Promise<{ ok?: boolean; removed?: number; error?: string }> {
  const me = await currentUser();
  if (!me) return { error: (await getT("Errors"))("signIn") };
  const r = await withdrawFaith(db, me.id);
  await deleteObjects(r.fileKeys);
  revalidatePath("/", "layout");
  return { ok: true, removed: r.removed };
}

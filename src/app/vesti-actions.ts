"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { recordConsent } from "@/lib/consent";
import { checkUnsubscribe } from "@/lib/crestere";
import { isDemo } from "@/lib/demo";
import { getT } from "@/i18n/server";

/**
 * „Vrei sfaturi pe email?” (acordul `news`, src/lib/crestere.ts): „Da” pornește șirul de bun venit, „Nu” (sau oprirea din
 * „Datele mele”, ori dezabonarea din email) îl oprește. Contul de probă nu primește emailuri.
 */
export async function answerNews(granted: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me) return { error: (await getT("Errors"))("signIn") };
  if (isDemo(me.email)) return { error: (await getT("News"))("demo") };
  await recordConsent(db, me.id, "news", !!granted);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Dezabonarea din legătura din email: merge și fără cont deschis, cu semnătura din legătură. */
export async function unsubscribeNews(form: FormData): Promise<void> {
  const u = String(form.get("u") ?? ""), t = String(form.get("t") ?? "");
  const ok = !!u && !!t && checkUnsubscribe(u, t);
  if (ok) await recordConsent(db, u, "news", false).catch(() => undefined);
  redirect(ok ? "/dezabonare?gata=1" : "/dezabonare?gata=0");
}

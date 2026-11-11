"use server";
import { headers } from "next/headers";
import { checkContact, contactRateOk, deliverContact } from "@/lib/contact";
import { siteOrigin } from "@/lib/site";
import { getLocale } from "@/i18n/server";

export type ContactResult = { ok?: boolean; error?: "name" | "email" | "message" | "tooMany" | "failed" };

/**
 * Formularul „Trimite un mesaj” de pe /contact. Câmpul `website` e ascuns oamenilor: doar roboții îl completează, iar atunci
 * le spunem „trimis” fără să trimitem nimic. Adresa de email a lui Daniel nu ajunge niciodată în browser.
 */
export async function sendContactMessage(_: ContactResult | null, form: FormData): Promise<ContactResult> {
  if (String(form.get("website") ?? "").trim()) return { ok: true };
  const checked = checkContact({ name: form.get("name"), email: form.get("email"), message: form.get("message") });
  if ("problem" in checked) return { error: checked.problem };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  if (!contactRateOk(ip)) return { error: "tooMany" };
  const page = String(form.get("from") ?? "").slice(0, 200) || undefined;
  const ok = await deliverContact(checked.ok, { site: await siteOrigin(), locale: await getLocale(), page });
  return ok ? { ok: true } : { error: "failed" };
}

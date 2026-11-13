"use server";
import { headers } from "next/headers";
import { checkContact, contactRateOk, deliverContact } from "@/lib/contact";
import { emailSent } from "@/lib/email";
import { ackInbound, notifyInbound } from "@/lib/emailuri";
import { siteOrigin } from "@/lib/site";
import { getLocale } from "@/i18n/server";

export type ContactResult = { ok?: boolean; error?: "name" | "email" | "message" | "tooMany" | "failed" };

/**
 * Formularul „Trimite un mesaj” de pe /contact. Câmpul `website` e ascuns oamenilor: doar roboții îl completează, iar atunci
 * le spunem „trimis” fără să trimitem nimic. Adresa de email a lui Daniel nu ajunge niciodată în browser.
 * Mesajul pleacă prin Resend spre contact@carteaneamului.ro (Reply-To = omul), iar omul primește o confirmare scurtă. Dacă
 * Resend nu e pus încă sau nu merge, mesajul pleacă tot prin FormSubmit, ca până acum, ca să nu se piardă.
 */
export async function sendContactMessage(_: ContactResult | null, form: FormData): Promise<ContactResult> {
  if (String(form.get("website") ?? "").trim()) return { ok: true };
  const checked = checkContact({ name: form.get("name"), email: form.get("email"), message: form.get("message") });
  if ("problem" in checked) return { error: checked.problem };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  if (!contactRateOk(ip)) return { error: "tooMany" };
  const page = String(form.get("from") ?? "").slice(0, 200) || undefined;
  const locale = await getLocale();
  const viaResend = await notifyInbound({ kind: "contact", ...checked.ok, page, locale }).catch(() => ({ ok: false as const }));
  if (emailSent(viaResend)) {
    await ackInbound(checked.ok.email, locale).catch(() => null);
    return { ok: true };
  }
  const ok = await deliverContact(checked.ok, { site: await siteOrigin(), locale, page });
  return ok ? { ok: true } : { error: "failed" };
}

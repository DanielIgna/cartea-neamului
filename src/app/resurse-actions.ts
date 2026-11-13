"use server";
import { headers } from "next/headers";
import { db } from "@/db";
import { contactRateOk } from "@/lib/contact";
import { checkDnaRequest, saveDnaRequest, type DnaProblem } from "@/lib/resurse";
import { getLocale } from "@/i18n/server";
import { emailSent } from "@/lib/email";
import { ackInbound, notifyInbound } from "@/lib/emailuri";

export type DnaResult = { ok?: boolean; error?: DnaProblem | "tooMany" | "failed" };

/**
 * „Vreau un test ADN” de pe /resurse-genealogie: păstrează cererea (cu acordul și data lui), fără să trimită nimic la laboratoare.
 * Câmpul `website` e ascuns oamenilor: doar roboții îl completează, iar atunci le spunem „primit” fără să păstrăm nimic.
 * După ce e păstrată, ne vine o notificare pe email (Reply-To = omul) și omul primește o confirmare scurtă; dacă emailul nu
 * pleacă, cererea rămâne oricum în Admin → ADN.
 */
export async function sendDnaRequest(_: DnaResult | null, form: FormData): Promise<DnaResult> {
  if (String(form.get("website") ?? "").trim()) return { ok: true };
  const checked = checkDnaRequest(Object.fromEntries(form));
  if ("problem" in checked) return { error: checked.problem };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  if (!contactRateOk(`adn:${ip}`)) return { error: "tooMany" };
  try {
    const locale = await getLocale();
    await saveDnaRequest(db, checked.ok, locale);
    const sent = await notifyInbound({ kind: "adn", ...checked.ok, locale }).catch(() => ({ ok: false as const }));
    if (emailSent(sent)) await ackInbound(checked.ok.email, locale).catch(() => null);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { error: "failed" };
  }
}

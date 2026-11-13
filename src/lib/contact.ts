/**
 * Zona de contact (/contact): butonul de WhatsApp și formularul „Trimite un mesaj”.
 *
 * Daniel a cerut (11 noiembrie 2026) ca adresa de email să nu se vadă pe site: formularul trimite mesajul de pe server, prin
 * FormSubmit (gratuit, fără cont și fără cheie), spre adresa de mai jos, care rămâne doar în cod, nu și în pagină. Prima dată
 * FormSubmit trimite pe adresă un email „Activate Form”; după ce Daniel apasă o dată pe buton, mesajele vin direct.
 * Variabilele CONTACT_INBOX și CONTACT_WHATSAPP (puse pe Vercel) le înlocuiesc fără o nouă versiune.
 */
const INBOX_DEFAULT = "contact.carteaneamului@gmail.com";
/** Numărul de WhatsApp, cu prefixul țării și fără „+” sau „00”, cum îl cere wa.me. */
const WHATSAPP_DEFAULT = "40790541342";

/** Pagina de Facebook a site-ului (cerută de Daniel, 13 noiembrie 2026): în subsol, pe /contact și în datele Organization. */
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61596217751674";

export function contactInbox(): string {
  return process.env.CONTACT_INBOX?.trim() || INBOX_DEFAULT;
}

/** Legătura care deschide conversația de WhatsApp (în aplicație pe telefon, în WhatsApp Web pe calculator), cu un salut început. */
export function whatsappUrl(text?: string): string {
  const nr = (process.env.CONTACT_WHATSAPP?.trim() || WHATSAPP_DEFAULT).replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${nr}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const CONTACT_LIMITS = { name: 120, email: 200, message: 5000, minMessage: 5 } as const;

export type ContactInput = { name: string; email: string; message: string };
export type ContactProblem = "name" | "email" | "message";

/** Ce a scris omul, curățat; sau ce lipsește. Emailul e ca să-i putem răspunde, deci e cerut și trebuie să arate a adresă. */
export function checkContact(raw: Partial<Record<keyof ContactInput, unknown>>): { ok: ContactInput } | { problem: ContactProblem } {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = s(raw.name, CONTACT_LIMITS.name);
  const email = s(raw.email, CONTACT_LIMITS.email);
  const message = s(raw.message, CONTACT_LIMITS.message);
  if (!name) return { problem: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { problem: "email" };
  if (message.length < CONTACT_LIMITS.minMessage) return { problem: "message" };
  return { ok: { name, email, message } };
}

/** Cel mult 5 mesaje pe oră de la aceeași adresă de internet (ținute minte cât trăiește serverul; ajunge contra joacei). */
const sent = new Map<string, number[]>();
export function contactRateOk(key: string, now = Date.now(), max = 5, windowMs = 3_600_000): boolean {
  const recent = (sent.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { sent.set(key, recent); return false; }
  recent.push(now);
  sent.set(key, recent);
  if (sent.size > 5000) sent.clear();
  return true;
}

/** Trimite mesajul spre adresa de contact. `reply` pune adresa omului ca „Reply-To”, ca Daniel să-i răspundă direct din Gmail. */
export async function deliverContact(input: ContactInput, ctx: { site: string; locale: string; page?: string }): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(contactInbox())}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Origin: ctx.site, Referer: `${ctx.site}/contact` },
      body: JSON.stringify({
        _subject: `Cartea Neamului: mesaj de la ${input.name}`,
        _replyto: input.email,
        _template: "box",
        _captcha: "false",
        Nume: input.name,
        Email: input.email,
        Mesaj: input.message,
        Limba: ctx.locale,
        ...(ctx.page ? { Pagina: ctx.page } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
    return data?.success === true || data?.success === "true";
  } catch {
    return false;
  }
}

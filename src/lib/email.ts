/**
 * Emailurile trimise de site (Daniel, 13 noiembrie 2026): toate pleacă de aici, prin Resend.
 *
 * Cheia e RESEND_API_KEY, iar expeditorul EMAIL_FROM (vechile nume MAIL_FROM și REMINDER_FROM merg în continuare); fără
 * expeditor pus, pleacă de la „Cartea Neamului <contact@carteaneamului.ro>”. Fără cheie (pe calculator, la teste) emailul
 * e sărit fără greșeală: se scrie în jurnal doar că a fost sărit și se întoarce { skipped: true }.
 * Greșelile de la Resend se scriu în jurnal fără adresa, numele sau textul omului și nu opresc niciodată cererea lui.
 */
import { Resend } from "resend";

export const EMAIL_FROM_DEFAULT = "Cartea Neamului <contact@carteaneamului.ro>";

/** De la cine pleacă emailul. */
export const emailFrom = () =>
  process.env.EMAIL_FROM?.trim() || process.env.MAIL_FROM?.trim() || process.env.REMINDER_FROM?.trim() || EMAIL_FROM_DEFAULT;

/** E pusă cheia Resend? Fără ea nu pleacă niciun email. */
export const emailReady = () => !!process.env.RESEND_API_KEY?.trim();

/** Adresa site-ului pe care vin mesajele din formulare (CONTACT_DOMAIN_EMAIL o înlocuiește, ca în Admin → Email). */
export const siteInbox = () => process.env.CONTACT_DOMAIN_EMAIL?.trim() || "contact@carteaneamului.ro";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Aceeași cheie trimisă de două ori nu mai pleacă a doua oară (Resend o ține minte 24 de ore). */
  idempotencyKey?: string;
  /** Ce fel de email e („contact”, „plata”…): doar asta apare în jurnal, nu adresa sau textul. */
  tag?: string;
};

export type EmailResult = { ok: true; id: string | null } | { skipped: true } | { ok: false };

let client: { key: string; resend: Resend } | null = null;
function resendFor(key: string) {
  if (client?.key !== key) client = { key, resend: new Resend(key) };
  return client.resend;
}

export async function sendEmail(m: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const tag = m.tag ?? "email";
  if (!key) {
    console.info(`[email] ${tag}: sărit, RESEND_API_KEY lipsește`);
    return { skipped: true };
  }
  try {
    const { data, error } = await resendFor(key).emails.send(
      { from: emailFrom(), to: m.to, subject: m.subject, html: m.html, text: m.text, ...(m.replyTo ? { replyTo: m.replyTo } : {}) },
      m.idempotencyKey ? { idempotencyKey: m.idempotencyKey } : undefined,
    );
    if (error) {
      console.error(`[email] ${tag}: Resend a refuzat`, { name: error.name, statusCode: (error as { statusCode?: number | null }).statusCode ?? null });
      return { ok: false };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    console.error(`[email] ${tag}: nu s-a putut trimite`, { name: e instanceof Error ? e.name : "Error" });
    return { ok: false };
  }
}

/** A plecat cu adevărat? (sărit sau greșit înseamnă nu). */
export const emailSent = (r: EmailResult) => "ok" in r && r.ok;

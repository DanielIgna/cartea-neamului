/**
 * Adresa de email pe domeniul site-ului (Daniel, 13 noiembrie 2026): contact@carteaneamului.ro, gratuit.
 *
 * Cum e făcută: ImprovMX (plan gratuit) primește emailurile trimise la adresă și le dă mai departe în Gmail-ul site-ului; din
 * Gmail, „Trimite e-mailul ca” răspunde și scrie cu adresa de pe domeniu, prin serverul Gmail (parolă de aplicație). Înregistrările
 * se pun în Vercel → Domains → carteaneamului.ro (Vercel ține DNS-ul; la ROTLD sunt doar serverele de nume).
 * Emailurile trimise de site singur (aducerea aminte de plată) pleacă prin Resend, de pe subdomeniul „send”, ca să nu se încurce.
 *
 * Aici sunt doar verificările arătate în Admin → Email: citim înregistrările publice DNS, nu schimbăm nimic și nu folosim chei.
 */
import { resolveMx, resolveTxt } from "node:dns/promises";
import { contactInbox } from "./contact";

export const MAIL_DOMAIN = "carteaneamului.ro";

/** Adresa de pe domeniu, arătată în Admin (CONTACT_DOMAIN_EMAIL în Vercel o înlocuiește). */
export const domainEmail = () => process.env.CONTACT_DOMAIN_EMAIL?.trim() || `contact@${MAIL_DOMAIN}`;

/** Căsuța Gmail în care ajung emailurile (aceeași cu cea a formularului de contact). */
export const mailbox = () => contactInbox();

/** Legături directe în Gmail, deschise pe contul potrivit chiar dacă pe calculator sunt mai multe conturi. */
export function gmailLinks(account = mailbox()) {
  const base = `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(account)}`;
  return {
    inbox: `${base}#inbox`,
    sent: `${base}#sent`,
    /** Mesajele venite pe adresa de domeniu (ImprovMX le lasă adresa în „Către”). */
    toDomain: `${base}#search/${encodeURIComponent(`to:${domainEmail()}`)}`,
    compose: `${base}#inbox?compose=new`,
    sendAs: `${base}#settings/accounts`,
  };
}

export type Check = { key: string; label: string; ok: boolean; found: string; need: string };

export type DnsRecords = {
  mx: { exchange: string; priority: number }[];
  txt: string[];
  dmarc: string[];
  resendDkim: string[];
  sendMx: { exchange: string; priority: number }[];
};

const lower = (s: string) => s.toLowerCase().replace(/\.$/, "");

/** Din înregistrările găsite, ce e pus bine și ce lipsește. Pur, ca să se poată testa. */
export function evaluate(r: DnsRecords): Check[] {
  const mxHosts = r.mx.map((m) => lower(m.exchange));
  const improv = mxHosts.some((h) => h.endsWith("improvmx.com"));
  const spf = r.txt.filter((t) => /^v=spf1\b/i.test(t.trim()));
  const spfOne = spf.length === 1 ? spf[0].toLowerCase() : "";
  const dmarc = r.dmarc.find((t) => /^v=DMARC1\b/i.test(t.trim()));
  return [
    {
      key: "mx", label: "Primire (MX → ImprovMX)", ok: improv,
      found: mxHosts.length ? r.mx.map((m) => `${m.priority} ${lower(m.exchange)}`).join(", ") : "nimic",
      need: "MX 10 mx1.improvmx.com și MX 20 mx2.improvmx.com",
    },
    {
      key: "spf", label: "Trimitere fără spam (SPF)", ok: !!spfOne && spfOne.includes("improvmx.com") && spfOne.includes("_spf.google.com"),
      found: spf.length > 1 ? `${spf.length} înregistrări SPF (trebuie una singură)` : spf[0] ?? "nimic",
      need: "v=spf1 include:spf.improvmx.com include:_spf.google.com ~all",
    },
    {
      key: "dmarc", label: "DMARC", ok: !!dmarc,
      found: dmarc ?? "nimic", need: "_dmarc: v=DMARC1; p=none;",
    },
    {
      key: "resend", label: "Emailurile site-ului (Resend)", ok: r.resendDkim.some((t) => t.includes("p=")) && r.sendMx.length > 0,
      found: r.resendDkim.length ? "cheia DKIM e pusă" + (r.sendMx.length ? ", subdomeniul send e pus" : ", lipsește MX pe send") : "nimic",
      need: "înregistrările arătate de Resend (resend._domainkey și send)",
    },
  ];
}

const safe = async <T,>(p: Promise<T>, empty: T): Promise<T> => {
  try { return await p; } catch { return empty; }
};
const joined = (rows: string[][]) => rows.map((parts) => parts.join(""));

/** Citește înregistrările publice ale domeniului (cel mult câteva secunde; ce nu se găsește rămâne gol). */
export async function readDns(domain = MAIL_DOMAIN): Promise<DnsRecords> {
  const timeout = <T,>(p: Promise<T>, empty: T) => Promise.race([safe(p, empty), new Promise<T>((ok) => setTimeout(() => ok(empty), 4000))]);
  const [mx, txt, dmarc, resendDkim, sendMx] = await Promise.all([
    timeout(resolveMx(domain), []),
    timeout(resolveTxt(domain).then(joined), [] as string[]),
    timeout(resolveTxt(`_dmarc.${domain}`).then(joined), [] as string[]),
    timeout(resolveTxt(`resend._domainkey.${domain}`).then(joined), [] as string[]),
    timeout(resolveMx(`send.${domain}`), []),
  ]);
  return { mx, txt, dmarc, resendDkim, sendMx };
}

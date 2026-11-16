/**
 * De unde vine fiecare cont nou (Daniel, 16.11.2026): partea care merge și în browser (fără nimic de pe server).
 *
 * - Orice pagină primește `?src=…` (linkurile din Admin → Linkuri cu sursă) și etichetele standard utm_source / utm_medium /
 *   utm_campaign. Site-ul din care a venit omul (referrer-ul) se ia singur, și fără ele.
 * - DOAR dacă vizitatorul a ales „Accept” la cookie-urile de analiză (`cn-cookie-uri=analiza`), browserul ține 30 de zile prima
 *   sursă (`cn-sursa`, first-touch, nu se mai schimbă) și ultima (`cn-sursa-ultima`, last-touch). Fără acord nu se scrie nimic.
 * - La crearea contului (cu email sau cu Google), serverul citește cele două cookie-uri (src/lib/sursa.ts) și le pune pe cont,
 *   alături de răspunsul la întrebarea opțională „De unde ai aflat de noi?” (cookie scurt `cn-de-unde`, pus de formular).
 */

/** Cookie-ul anunțului: „analiza” = a acceptat cookie-urile de analiză; „necesare” sau vechiul „1” = doar cele necesare. */
export const CHOICE_COOKIE = "cn-cookie-uri";
export const CHOICE_ANALYTICS = "analiza";
export const CHOICE_NECESSARY = "necesare";
export const analyticsAllowed = (choice: string | null | undefined) => choice === CHOICE_ANALYTICS;
/** Trimis în pagină când omul își schimbă alegerea (anunțul sau pagina de confidențialitate), ca sursa să se scrie pe loc. */
export const CHOICE_EVENT = "cn-cookie-alegere";

export const FIRST_COOKIE = "cn-sursa";
export const LAST_COOKIE = "cn-sursa-ultima";
export const SOURCE_COOKIE_DAYS = 30;
/** Răspunsul din formular, ținut cel mult 30 de minute: cât să ajungă la contul nou și când e făcut cu Google. */
export const ANSWER_COOKIE = "cn-de-unde";

/** Variantele întrebării „De unde ai aflat de noi?” (textele, în cele 10 limbi, în src/i18n/messages/sursa/). */
export const ANSWERS = ["facebook-grup", "facebook-pagina", "google", "recomandare", "card-cadou", "altceva"] as const;
export type Answer = (typeof ANSWERS)[number];
export const isAnswer = (v: unknown): v is Answer => ANSWERS.includes(v as Answer);
export const ANSWER_LABEL: Record<Answer, string> = {
  "facebook-grup": "Facebook (grup)", "facebook-pagina": "Facebook (pagină)", google: "Google",
  recomandare: "Recomandare de la o rudă sau un prieten", "card-cadou": "Card cadou", altceva: "Altceva",
};

/** O atingere: de unde a venit omul într-o vizită. Câmpuri scurte, ca cookie-ul să rămână mic. */
export type Touch = {
  s?: string | null; // ?src=
  us?: string | null; // utm_source
  um?: string | null; // utm_medium
  uc?: string | null; // utm_campaign
  r?: string | null; // site-ul din care a venit (doar numele, fără adresă)
  p?: string | null; // pagina de intrare (fără parametri)
  t?: number; // secunde de la 1970
};

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

/** Eticheta dintr-un link de sursă: litere mici, cifre și liniuțe, cel mult 40 („FB Români New York” → „fb-romani-new-york”). */
export function slugOf(raw: string | null | undefined, max = 40): string | null {
  const s = (raw ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
  return s || null;
}

export function encodeTouch(t: Touch): string {
  const o: Touch = {};
  for (const [k, n] of [["s", 40], ["us", 40], ["um", 40], ["uc", 60], ["r", 60], ["p", 120]] as const) {
    const v = clip(t[k], n);
    if (v) o[k] = v;
  }
  o.t = Math.round(t.t ?? Date.now() / 1000);
  return encodeURIComponent(JSON.stringify(o));
}

export function decodeTouch(raw: string | null | undefined): Touch | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    return {
      s: clip(o.s, 40), us: clip(o.us, 40), um: clip(o.um, 40), uc: clip(o.uc, 60), r: clip(o.r, 60), p: clip(o.p, 120),
      t: typeof o.t === "number" && Number.isFinite(o.t) ? o.t : undefined,
    };
  } catch {
    return null;
  }
}

/** O atingere spune ceva (link cu sursă sau un site din afară)? Una „directă” nu înlocuiește ultima sursă. */
export const hasSignal = (t: Touch | null | undefined) => !!(t && (t.s || t.us || t.uc || t.r));

/** Site-ul din care a venit, fără „www.”; nimic dacă e chiar site-ul nostru. */
export function externalHost(ref: string | null | undefined, ownHost: string): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    const own = ownHost.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
    if (!h || h === own || h.endsWith("carteaneamului.ro")) return null;
    return h.slice(0, 60);
  } catch {
    return null;
  }
}

/** Ce vine din adresa unei pagini: ?src și etichetele utm. */
export function touchFromUrl(search: string, path: string, referrer: string | null, ownHost: string): Touch {
  const q = new URLSearchParams(search);
  return {
    s: slugOf(q.get("src")), us: clip(q.get("utm_source"), 40), um: clip(q.get("utm_medium"), 40), uc: clip(q.get("utm_campaign"), 60),
    r: externalHost(referrer, ownHost), p: path.slice(0, 120), t: Math.round(Date.now() / 1000),
  };
}

/** Citirea unui cookie din antetul „cookie” (sau din document.cookie). */
export function readCookie(header: string | null | undefined, name: string): string | null {
  for (const part of (header ?? "").split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

/** Răspunsul din formular: „altceva” cu textul scris de om (cel mult 120 de caractere). */
export type SignupAnswer = { a: Answer; o?: string | null };
export function encodeAnswer(a: SignupAnswer) {
  return encodeURIComponent(JSON.stringify({ a: a.a, ...(a.a === "altceva" && a.o?.trim() ? { o: a.o.trim().slice(0, 120) } : {}) }));
}
export function decodeAnswer(raw: string | null | undefined): SignupAnswer | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as { a?: unknown; o?: unknown };
    if (!isAnswer(o.a)) return null;
    return { a: o.a, o: o.a === "altceva" && typeof o.o === "string" ? o.o.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120) || null : null };
  } catch {
    return null;
  }
}

import { toNextJsHandler } from "better-auth/next-js";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/bootstrap";
import {
  DEVICE_COOKIE, clientIp, codeLock, cookieValue, deviceLabel, logSecurity, newDeviceId, normEmail, passwordLock, placeOf, rememberDevice,
  userIdByEmail,
} from "@/lib/securitate";

const h = toNextJsHandler(auth);

/** Pentru jurnalul de securitate: o greșeală la scris în jurnal nu oprește niciodată intrarea în cont. */
const quietly = (p: Promise<unknown>) => p.catch((e) => console.error("securitate", e));

const locked = (minutes: number) => Response.json(
  { code: "ACCOUNT_LOCKED", message: "Too many attempts", minutes },
  { status: 429, headers: { "Retry-After": String(minutes * 60) } },
);

function who(req: Request) {
  return { ip: clientIp(req.headers), device: deviceLabel(req.headers.get("user-agent")), place: placeOf(req.headers) };
}

/**
 * După o intrare reușită (parolă, pasul 2, Google, cont nou): o scriem în jurnal și ținem minte dispozitivul. Dacă e un dispozitiv
 * nou pentru cont, omul primește un email. Răspunsul primește cookie-ul care recunoaște dispozitivul, dacă nu-l avea.
 */
async function afterSignIn(req: Request, res: Response, extra?: "cod_rezerva"): Promise<Response> {
  const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!/session_token=/.test(cookies)) return res;
  const s = await auth.api.getSession({ headers: new Headers({ cookie: cookies }) }).catch(() => null);
  if (!s?.user) return res;
  const w = who(req);
  const had = cookieValue(req.headers.get("cookie"), DEVICE_COOKIE);
  const deviceId = had && /^[\w-]{10,64}$/.test(had) ? had : newDeviceId();
  try {
    await logSecurity(db, { kind: "intrare", userId: s.user.id, email: s.user.email, ...w });
    if (extra) await logSecurity(db, { kind: extra, userId: s.user.id, email: s.user.email, ...w });
    if (await rememberDevice(db, s.user.id, deviceId, w.device)) {
      await logSecurity(db, { kind: "dispozitiv_nou", userId: s.user.id, email: s.user.email, ...w });
      const { sendNewDeviceMail } = await import("@/lib/securitate-mail");
      waitUntil(sendNewDeviceMail(s.user.id, w.device, w.place, req.headers.get("cookie")).catch((e) => console.error("mail dispozitiv nou", e)));
    }
  } catch (e) {
    console.error("securitate", e);
  }
  if (had === deviceId) return res;
  const out = new Response(res.body, res);
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  out.headers.append("Set-Cookie", `${DEVICE_COOKIE}=${deviceId}; Path=/; Max-Age=${2 * 365 * 86400}; HttpOnly; SameSite=Lax${secure}`);
  return out;
}

export async function GET(req: Request) {
  await ensureSchema();
  const res = await h.GET(req);
  // Întoarcerea de la Google: dacă a intrat, o scriem în jurnal ca pe orice intrare.
  if (new URL(req.url).pathname.includes("/callback/")) return afterSignIn(req, res);
  return res;
}

export async function POST(req: Request) {
  await ensureSchema();
  const path = new URL(req.url).pathname;

  if (path.endsWith("/request-password-reset")) {
    // „Ai uitat parola?”: același răspuns, în cam același timp, fie că emailul are cont, fie că nu (better-auth adaugă
    // altfel un mesaj doar când contul lipsește). Erorile (email scris greșit, prea multe cereri) rămân cum sunt.
    const [res] = await Promise.all([h.POST(req), new Promise((r) => setTimeout(r, 600))]);
    return res.ok ? Response.json({ status: true }) : res;
  }

  if (path.endsWith("/sign-in/email")) {
    const body = (await req.clone().json().catch(() => ({}))) as { email?: unknown };
    const email = normEmail(body.email), w = who(req);
    // Prea multe parole greșite pe acest email (sau de la această adresă): oprim 15 minute, fără să mai verificăm parola.
    const wait = await passwordLock(db, email, w.ip).catch(() => 0);
    if (wait) return locked(wait);
    const res = await h.POST(req);
    if (res.ok) {
      const data = (await res.clone().json().catch(() => ({}))) as { twoFactorRedirect?: boolean };
      // Cu verificarea în 2 pași, intrarea se termină abia după cod.
      return data.twoFactorRedirect ? res : afterSignIn(req, res);
    }
    if (res.status === 401 && email) {
      await quietly((async () => {
        const userId = await userIdByEmail(db, email);
        await logSecurity(db, { kind: "parola_gresita", userId, email, ...w });
        if (await passwordLock(db, email, w.ip)) await logSecurity(db, { kind: "intrare_blocata", userId, email, ...w });
      })());
    }
    return res;
  }

  if (path.endsWith("/two-factor/verify-totp") || path.endsWith("/two-factor/verify-backup-code")) {
    const w = who(req);
    const wait = await codeLock(db, w.ip).catch(() => 0);
    if (wait) return locked(wait);
    // Pornirea verificării (omul e deja în cont) sau pasul 2 al intrării (are doar cookie-ul „two_factor”)?
    const signingIn = /two_factor=/.test(req.headers.get("cookie") ?? "");
    const before = signingIn ? null : await auth.api.getSession({ headers: req.headers }).catch(() => null);
    const res = await h.POST(req);
    if (!res.ok) {
      if (res.status !== 429) {
        await quietly((async () => {
          await logSecurity(db, { kind: "cod_gresit", userId: before?.user.id ?? null, email: before?.user.email ?? null, ...w });
          if (await codeLock(db, w.ip)) await logSecurity(db, { kind: "intrare_blocata", userId: before?.user.id ?? null, detail: "coduri", ...w });
        })());
      }
      return res;
    }
    if (signingIn) return afterSignIn(req, res, path.endsWith("/verify-backup-code") ? "cod_rezerva" : undefined);
    if (before && !before.user.twoFactorEnabled) await quietly(logSecurity(db, { kind: "2pasi_pornit", userId: before.user.id, email: before.user.email, ...w }));
    return res;
  }

  if (path.endsWith("/two-factor/disable")) {
    const before = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    const res = await h.POST(req);
    if (res.ok && before) {
      await quietly(logSecurity(db, { kind: "2pasi_oprit", userId: before.user.id, email: before.user.email, ...who(req) }));
      const { sendTwoStepOffMail } = await import("@/lib/securitate-mail");
      waitUntil(sendTwoStepOffMail(before.user.id, req.headers.get("cookie")).catch((e) => console.error("mail 2 pași oprit", e)));
    }
    return res;
  }

  if (path.endsWith("/sign-up/email")) {
    const res = await h.POST(req);
    return res.ok ? afterSignIn(req, res) : res;
  }

  return h.POST(req);
}

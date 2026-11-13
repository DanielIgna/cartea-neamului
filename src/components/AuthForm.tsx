"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";
import { MIN_AGE } from "@/lib/legal";
import { SIGNUP_PARTNER_COOKIE } from "@/lib/partners-shared";

/**
 * Bifa pentru beneficiile de la PropManage ține minte alegerea într-un cookie scurt (30 de minute), pe care îl citește crearea
 * contului pe server; așa merge și cu „Continuă cu Google”. Debifată, cookie-ul se șterge.
 */
function rememberPartner(on: boolean) {
  document.cookie = on ? `${SIGNUP_PARTNER_COOKIE}=propmanage; Path=/; Max-Age=1800; SameSite=Lax` : `${SIGNUP_PARTNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Eroarea întoarsă de server când intrarea e oprită pentru o vreme (prea multe greșeli); vezi src/app/api/auth/[...all]/route.ts. */
const lockedFor = (e: unknown) => {
  const x = e as { code?: string; minutes?: number; status?: number } | null;
  return x?.code === "ACCOUNT_LOCKED" ? Math.max(1, Number(x.minutes) || 15) : 0;
};

/** Căsuța „nu sunt robot” (Cloudflare Turnstile), doar dacă sunt puse cheile; altfel nu apare nimic. */
function Turnstile({ siteKey }: { siteKey: string }) {
  useEffect(() => {
    if (document.querySelector("script[data-turnstile]")) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true; s.defer = true; s.dataset.turnstile = "1";
    document.head.appendChild(s);
  }, []);
  return <div className="cf-turnstile" data-sitekey={siteKey} data-language="auto" />;
}

/**
 * Pasul 2 al intrării, doar pentru cine și-a pornit singur verificarea în 2 pași: codul din aplicație sau un cod de rezervă.
 * Poate cere ca telefonul sau calculatorul să fie ținut minte 30 de zile (atunci nu mai cere codul acolo).
 */
function SecondStep({ next, onBack }: { next: string; onBack: () => void }) {
  const t = useTranslations("TwoStep");
  const [backup, setBackup] = useState(false);
  const [trust, setTrust] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setPending(true);
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    const res = backup
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: trust })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: trust });
    setPending(false);
    if (res.error) {
      const wait = lockedFor(res.error);
      const msg = (res.error.message ?? "").toLowerCase();
      setError(wait ? t("locked", { minutes: wait }) : msg.includes("two factor cookie") ? t("expired") : t("wrongCode"));
      return;
    }
    router.push(next); router.refresh();
  }

  return (
    <form onSubmit={submit} method="post" className="form" key={backup ? "b" : "a"}>
      <h2 style={{ fontSize: 24 }}>{backup ? t("backupTitle") : t("title")}</h2>
      <p className="muted" style={{ margin: 0 }}>{backup ? t("backupText") : t("text")}</p>
      <label>{backup ? t("backupCode") : t("code")}
        <input name="code" required autoFocus autoComplete="one-time-code" inputMode={backup ? "text" : "numeric"} pattern={backup ? undefined : "[0-9 ]{6,7}"}
          maxLength={backup ? 24 : 7} style={{ fontSize: 22, letterSpacing: "0.2em" }} />
      </label>
      <label className="radio"><input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} /><span>{t("trust")}</span></label>
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? "…" : t("enter")}</button>
      <button type="button" className="btn" onClick={() => { setBackup(!backup); setError(""); }}>{backup ? t("useApp") : t("useBackup")}</button>
      {backup && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t("lostAll")}</p>}
      <button type="button" className="forgot-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={onBack}>{t("back")}</button>
    </form>
  );
}

export default function AuthForm({ next, startWithSignUp, google = false, oauthError, turnstileKey = "" }: { next: string; startWithSignUp: boolean; google?: boolean; oauthError?: string; turnstileKey?: string }) {
  const t = useTranslations("AuthForm");
  const ts = useTranslations("TwoStep");
  const [secondStep, setSecondStep] = useState(false);
  const tp = useTranslations("Partners");
  const [partner, setPartner] = useState(false);
  const [signUp, setSignUp] = useState(startWithSignUp);
  const [error, setError] = useState(oauthError ? t("googleFailed") : "");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setPending(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    const robot = String(f.get("cf-turnstile-response") ?? "");
    if (signUp && turnstileKey && !robot) { setPending(false); setError(ts("robot")); return; }
    rememberPartner(signUp && partner);
    const res = signUp
      ? await authClient.signUp.email({ email, password, name: String(f.get("name")) }, robot ? { headers: { "x-captcha-response": robot } } : undefined)
      : await authClient.signIn.email({ email, password });
    setPending(false);
    rememberPartner(false);
    if (res.error) {
      const code = res.error.code;
      const wait = lockedFor(res.error);
      setError(wait ? ts("locked", { minutes: wait })
        : code === "INVALID_EMAIL_OR_PASSWORD" ? t("wrongPassword")
        : code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ? t("exists")
        : code === "PASSWORD_TOO_SHORT" ? t("shortPassword")
        : code === "PASSWORD_TOO_LONG" ? t("longPassword")
        : code === "INVALID_EMAIL" ? t("badEmail")
        : res.error.status === 429 ? t("tooMany")
        : t("failed"));
      // Căsuța „nu sunt robot” merge o singură dată: o pregătim pentru încă o încercare.
      (window as { turnstile?: { reset: () => void } }).turnstile?.reset();
      return;
    }
    // Cine și-a pornit verificarea în 2 pași mai scrie codul de pe telefon.
    if ((res.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) { setSecondStep(true); return; }
    router.push(next); router.refresh();
  }

  async function withGoogle() {
    setError(""); setPending(true);
    rememberPartner(signUp && partner);
    const res = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: `/intrare?next=${encodeURIComponent(next)}&eroare=google` });
    if (res?.error) { setPending(false); setError(t("googleFailed")); }
  }

  if (secondStep) return <SecondStep next={next} onBack={() => { setSecondStep(false); setError(""); }} />;

  return (
    // method="post": dacă cineva apasă înainte să se încarce pagina, parola nu ajunge în bara de adrese.
    <form onSubmit={submit} method="post" className="form">
      <h2 style={{ fontSize: 24 }}>{signUp ? t("signUpTitle") : t("signInTitle")}</h2>
      {signUp && <p className="muted" style={{ margin: 0 }}>{t("signUpTrial")}</p>}
      {google && (
        <>
          <button type="button" className="btn google-btn" disabled={pending} onClick={withGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            {t("google")}
          </button>
          <div className="or-line"><span>{t("or")}</span></div>
        </>
      )}
      {signUp && <label>{t("name")}<input id="name" name="name" required autoComplete="name" /></label>}
      <label>{t("email")}<input id="email" name="email" type="email" required autoComplete="email" /></label>
      <label>{t("password")}<input id="password" name="password" type="password" required minLength={8} autoComplete={signUp ? "new-password" : "current-password"} /></label>
      {!signUp && <Link className="forgot-link" href="/intrare/parola-uitata">{t("forgotLink")}</Link>}
      {signUp && (
        // Separată de Termeni și nebifată de la sine: contul și arborele merg la fel și fără ea.
        <label className="radio partner-optin">
          <input type="checkbox" name="partner" checked={partner} onChange={(e) => setPartner(e.target.checked)} />
          <span>{tp("checkbox")}<small className="muted">{tp("checkboxHint")}</small></span>
        </label>
      )}
      {signUp && turnstileKey && <Turnstile siteKey={turnstileKey} />}
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? t("wait") : signUp ? t("create") : t("enter")}</button>
      {(signUp || google) && (
        <p className="auth-legal">
          {t.rich(signUp ? "legalSignUp" : "legalGoogle", {
            age: String(MIN_AGE),
            terms: (c) => <Link href="/termeni" target="_blank">{c}</Link>,
            privacy: (c) => <Link href="/confidentialitate" target="_blank">{c}</Link>,
          })}
        </p>
      )}
      <button type="button" className="btn" onClick={() => { setSignUp(!signUp); setError(""); }}>
        {signUp ? t("haveAccount") : t("wantAccount")}
      </button>
    </form>
  );
}

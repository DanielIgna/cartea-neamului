"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";
import { MIN_AGE } from "@/lib/legal";

export default function AuthForm({ next, startWithSignUp, google = false, oauthError }: { next: string; startWithSignUp: boolean; google?: boolean; oauthError?: string }) {
  const t = useTranslations("AuthForm");
  const [signUp, setSignUp] = useState(startWithSignUp);
  const [error, setError] = useState(oauthError ? t("googleFailed") : "");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setPending(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    const res = signUp
      ? await authClient.signUp.email({ email, password, name: String(f.get("name")) })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (res.error) {
      const code = res.error.code;
      setError(code === "INVALID_EMAIL_OR_PASSWORD" ? t("wrongPassword")
        : code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ? t("exists")
        : code === "PASSWORD_TOO_SHORT" ? t("shortPassword")
        : code === "PASSWORD_TOO_LONG" ? t("longPassword")
        : code === "INVALID_EMAIL" ? t("badEmail")
        : res.error.status === 429 ? t("tooMany")
        : t("failed"));
      return;
    }
    router.push(next); router.refresh();
  }

  async function withGoogle() {
    setError(""); setPending(true);
    const res = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: `/intrare?next=${encodeURIComponent(next)}&eroare=google` });
    if (res?.error) { setPending(false); setError(t("googleFailed")); }
  }

  return (
    // method="post": dacă cineva apasă înainte să se încarce pagina, parola nu ajunge în bara de adrese.
    <form onSubmit={submit} method="post" className="form">
      <h2 style={{ fontSize: 24 }}>{signUp ? t("signUpTitle") : t("signInTitle")}</h2>
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

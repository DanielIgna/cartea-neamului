"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";

/** „Ai uitat parola?”: omul își scrie emailul; răspunsul e același fie că are cont, fie că nu. */
export function ForgotPasswordForm() {
  const t = useTranslations("AuthForm");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setPending(true);
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    const res = await authClient.requestPasswordReset({ email, redirectTo: "/intrare/parola-noua" });
    setPending(false);
    if (res.error?.status === 429) return setError(t("tooMany"));
    if (res.error?.code === "INVALID_EMAIL" || res.error?.status === 400) return setError(t("badEmail"));
    setSent(true);
  }

  if (sent) {
    return (
      <div className="form">
        <h2 style={{ fontSize: 24 }}>{t("forgotTitle")}</h2>
        <p>{t("sentText")}</p>
        <Link className="btn" href="/intrare">{t("backToSignIn")}</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} method="post" className="form">
      <h2 style={{ fontSize: 24 }}>{t("forgotTitle")}</h2>
      <p className="muted">{t("forgotText")}</p>
      <label>{t("email")}<input id="email" name="email" type="email" required autoComplete="email" /></label>
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? t("wait") : t("sendLink")}</button>
      <Link className="btn" href="/intrare">{t("backToSignIn")}</Link>
    </form>
  );
}

/** Parola nouă, din legătura primită pe email (valabilă o oră, o singură dată). */
export function NewPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations("AuthForm");
  const [bad, setBad] = useState(!token);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const newPassword = String(f.get("password")), again = String(f.get("again"));
    if (newPassword !== again) return setError(t("mismatch"));
    setPending(true);
    const res = await authClient.resetPassword({ newPassword, token: token! });
    setPending(false);
    if (res.error) {
      const code = res.error.code;
      if (code === "INVALID_TOKEN") return setBad(true);
      return setError(code === "PASSWORD_TOO_SHORT" ? t("shortPassword") : code === "PASSWORD_TOO_LONG" ? t("longPassword")
        : res.error.status === 429 ? t("tooMany") : t("failed"));
    }
    setDone(true);
  }

  if (bad) {
    return (
      <div className="form">
        <h2 style={{ fontSize: 24 }}>{t("newTitle")}</h2>
        <p>{t("badLink")}</p>
        <Link className="btn primary" href="/intrare/parola-uitata">{t("askNew")}</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div className="form">
        <h2 style={{ fontSize: 24 }}>{t("newTitle")}</h2>
        <p>{t("savedText")}</p>
        <Link className="btn primary" href="/intrare">{t("enter")}</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} method="post" className="form">
      <h2 style={{ fontSize: 24 }}>{t("newTitle")}</h2>
      <label>{t("newPassword")}<input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
      <label>{t("repeatPassword")}<input id="again" name="again" type="password" required minLength={8} autoComplete="new-password" /></label>
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? t("wait") : t("savePassword")}</button>
    </form>
  );
}

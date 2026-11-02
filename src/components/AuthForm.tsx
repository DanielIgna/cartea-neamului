"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({ next, startWithSignUp }: { next: string; startWithSignUp: boolean }) {
  const [signUp, setSignUp] = useState(startWithSignUp);
  const [error, setError] = useState("");
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
      setError(res.error.code === "INVALID_EMAIL_OR_PASSWORD" ? "Emailul sau parola nu se potrivesc."
        : res.error.code === "USER_ALREADY_EXISTS" ? "Există deja un cont cu acest email. Intră în cont."
        : res.error.code === "PASSWORD_TOO_SHORT" ? "Parola trebuie să aibă cel puțin 8 caractere."
        : res.error.message ?? "Nu a mers. Încearcă din nou.");
      return;
    }
    router.push(next); router.refresh();
  }

  return (
    <form onSubmit={submit} className="form">
      <h2 style={{ fontSize: 24 }}>{signUp ? "Cont nou" : "Intră în cont"}</h2>
      {signUp && <label>Numele tău<input id="name" name="name" required autoComplete="name" /></label>}
      <label>Email<input id="email" name="email" type="email" required autoComplete="email" /></label>
      <label>Parolă<input id="password" name="password" type="password" required minLength={8} autoComplete={signUp ? "new-password" : "current-password"} /></label>
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? "Așteaptă…" : signUp ? "Creează contul" : "Intră"}</button>
      <button type="button" className="btn" onClick={() => { setSignUp(!signUp); setError(""); }}>
        {signUp ? "Am deja cont" : "Nu am cont, vreau unul gratuit"}
      </button>
    </form>
  );
}

"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** „Trimite emailul de confirmare” (pentru zilele din invitație); întoarce omul la „Invitațiile mele”. */
export default function VerifyEmailButton({ email, label, sent, failed }: { email: string; label: string; sent: string; failed: string }) {
  const [state, setState] = useState<"" | "busy" | "sent" | "failed">("");
  const send = async () => {
    setState("busy");
    const res = await authClient.sendVerificationEmail({ email, callbackURL: "/invitatii" }).catch(() => ({ error: true }));
    setState(res && "error" in res && res.error ? "failed" : "sent");
  };
  if (state === "sent") return <span className="muted" role="status">{sent}</span>;
  return (
    <>
      <button type="button" className="btn primary" disabled={state === "busy"} onClick={send}>{label}</button>
      {state === "failed" && <span className="err" role="status"> {failed}</span>}
    </>
  );
}

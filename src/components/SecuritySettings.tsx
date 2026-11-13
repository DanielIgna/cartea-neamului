"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth-client";

type Sess = { id: string; label: string; since: string; current: boolean };
type Mode = "idle" | "askStart" | "scan" | "codes" | "askStop" | "askCodes";

/** Cheia din legătura „otpauth://…”, scrisă în grupe de câte 4, pentru cine nu poate scana codul. */
const secretOf = (uri: string) => (new URL(uri).searchParams.get("secret") ?? "").replace(/(.{4})/g, "$1 ").trim();

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const t = useTranslations("Security");
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`Cartea Neamului\n\n${text}\n`], { type: "text/plain" }));
    a.download = "coduri-de-rezerva.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h3 style={{ margin: 0 }}>{t("backupTitle")}</h3>
      <p style={{ margin: 0 }}>{t("backupText")}</p>
      <pre style={{ fontSize: 18, lineHeight: 1.7, padding: 12, borderRadius: 8, background: "var(--soft, rgba(0,0,0,.05))", columns: 2, margin: 0 }}>{text}</pre>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={download}>{t("download")}</button>
        <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}>{copied ? t("copied") : t("copy")}</button>
        <button type="button" className="btn primary" onClick={onDone}>{t("done")}</button>
      </div>
    </div>
  );
}

/** Confirmarea adresei de email, la cerere: o legătură trimisă pe email (pentru proprietari e cerută). */
export function VerifyEmail({ email, verified, owner }: { email: string; verified: boolean; owner: boolean }) {
  const t = useTranslations("Security");
  const [state, setState] = useState<"" | "sent" | "error">("");
  const [pending, setPending] = useState(false);
  async function send() {
    setPending(true);
    const res = await authClient.sendVerificationEmail({ email, callbackURL: "/securitate" });
    setPending(false);
    setState(res.error ? "error" : "sent");
  }
  return (
    <div className="card">
      {owner && <><h3 style={{ marginTop: 0 }}>{t("ownerTitle")}</h3><p>{t("ownerText")}</p></>}
      <h3 style={{ marginTop: owner ? undefined : 0 }}>{t("verifyTitle")}</h3>
      {verified ? <p style={{ marginBottom: 0 }}>{t("verifyOk", { email })}</p> : (
        <>
          <p>{t("verifyText", { email })}</p>
          {state === "sent" ? <p style={{ marginBottom: 0 }}><b>{t("verifySent")}</b></p> : (
            <button type="button" className="btn primary" disabled={pending} onClick={send}>{pending ? "…" : t("verifySend")}</button>
          )}
          {state === "error" && <p className="err">{t("failed")}</p>}
        </>
      )}
    </div>
  );
}

export default function SecuritySettings({ enabled, hasPassword, sessions }: { enabled: boolean; hasPassword: boolean; sessions: Sess[] }) {
  const t = useTranslations("Security");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [uri, setUri] = useState("");
  const [qr, setQr] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!uri) return;
    QRCode.toDataURL(uri, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [uri]);

  const reset = () => { setMode("idle"); setError(""); setUri(""); setQr(""); };
  const fail = (e: { status?: number; message?: string } | null | undefined, code = false) =>
    setError(code ? t("wrongCode") : (e?.message ?? "").toLowerCase().includes("password") ? t("wrongPassword") : t("failed"));

  async function withPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setError(""); setPending(true);
    if (mode === "askStart") {
      const res = await authClient.twoFactor.enable({ password });
      setPending(false);
      if (res.error || !res.data) return fail(res.error);
      setUri(res.data.totpURI); setCodes(res.data.backupCodes); setMode("scan");
    } else if (mode === "askStop") {
      const res = await authClient.twoFactor.disable({ password });
      setPending(false);
      if (res.error) return fail(res.error);
      reset(); setNote(t("stopped")); router.refresh();
    } else if (mode === "askCodes") {
      const res = await authClient.twoFactor.generateBackupCodes({ password });
      setPending(false);
      if (res.error || !res.data) return fail(res.error);
      setCodes(res.data.backupCodes); setMode("codes");
    }
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    setError(""); setPending(true);
    const res = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (res.error) return fail(res.error, true);
    setMode("codes"); setNote(t("onNow"));
  }

  async function signOutOthers() {
    setPending(true);
    await authClient.revokeOtherSessions();
    setPending(false);
    setNote(t("signedOutOthers")); router.refresh();
  }

  const passwordForm = (
    <form onSubmit={withPassword} className="form" style={{ marginTop: 12 }}>
      <p className="muted" style={{ margin: 0 }}>{t("passwordWhy")}</p>
      <label>{t("password")}<input name="password" type="password" required autoComplete="current-password" autoFocus /></label>
      {error && <p className="err">{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={pending}>{pending ? "…" : t("continue")}</button>
        <button type="button" className="btn" onClick={reset}>{t("cancel")}</button>
      </div>
    </form>
  );

  return (
    <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("twoStepTitle")} · <span className={enabled ? "" : "muted"}>{enabled ? t("on") : t("off")}</span></h3>
        <p>{t("twoStepWhat")}</p>
        {note && <p><b>{note}</b></p>}
        {!hasPassword ? <p className="muted" style={{ marginBottom: 0 }}>{t("googleOnly")}</p> : (
          <>
            {mode === "idle" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {enabled
                  ? <><button type="button" className="btn" onClick={() => { setNote(""); setMode("askCodes"); }}>{t("newCodes")}</button>
                    <button type="button" className="btn" onClick={() => { setNote(""); setMode("askStop"); }}>{t("stop")}</button></>
                  : <button type="button" className="btn primary" onClick={() => { setNote(""); setMode("askStart"); }}>{t("start")}</button>}
              </div>
            )}
            {mode === "askCodes" && <p className="muted" style={{ margin: "12px 0 0" }}>{t("newCodesNote")}</p>}
            {(mode === "askStart" || mode === "askStop" || mode === "askCodes") && passwordForm}
            {mode === "scan" && (
              <form onSubmit={confirm} className="form" style={{ marginTop: 12 }}>
                <p style={{ margin: 0 }}>{t("step1")}</p>
                <p style={{ margin: 0 }}>{t("step2")}</p>
                {qr && <img src={qr} alt="" width={220} height={220} style={{ background: "#fff", padding: 8, borderRadius: 8, alignSelf: "flex-start" }} />}
                <p className="muted" style={{ margin: 0 }}>{t("manual")} <code style={{ wordBreak: "break-all" }}>{secretOf(uri)}</code></p>
                <label>{t("step3")}
                  <input name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} style={{ fontSize: 22, letterSpacing: "0.2em", maxWidth: 200 }} />
                </label>
                {error && <p className="err">{error}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn primary" disabled={pending}>{pending ? "…" : t("confirm")}</button>
                  <button type="button" className="btn" onClick={reset}>{t("cancel")}</button>
                </div>
              </form>
            )}
            {mode === "codes" && <BackupCodes codes={codes} onDone={() => { reset(); router.refresh(); }} />}
            {enabled && mode === "idle" && <p className="muted" style={{ margin: "12px 0 0", fontSize: 14 }}>{t("googleNote")}</p>}
          </>
        )}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("devicesTitle")}</h3>
        <p>{t("devicesText")}</p>
        <ul style={{ paddingLeft: 18 }}>
          {sessions.map((s) => <li key={s.id}>{s.label} · {s.since}{s.current ? <b> ({t("thisDevice")})</b> : null}</li>)}
        </ul>
        {sessions.length > 1 && <button type="button" className="btn" disabled={pending} onClick={signOutOthers}>{t("signOutOthers")}</button>}
      </div>
    </>
  );
}

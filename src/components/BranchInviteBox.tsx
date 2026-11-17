"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import InvitePanel from "@/components/InvitePanel";

/**
 * Îndemnul vizibil de după 5 persoane: „Invită-l pe [nume] să completeze ramura lui”, cu linkul de invitație legat de fișa
 * rudei (WhatsApp, email, copiază). „Mai târziu” îl ascunde pe acest telefon 7 zile.
 */
export default function BranchInviteBox({ treeId, personId, name, sex, count, writers }: { treeId: string; personId: string; name: string; sex: "M" | "F" | "U"; count: number; writers: boolean }) {
  const t = useTranslations("BranchInvite");
  const key = `cn-ramura-${treeId}`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try { setHidden(Number(localStorage.getItem(key) ?? 0) > Date.now()); } catch { setHidden(false); }
  }, [key]);
  if (hidden) return null;
  const later = () => {
    try { localStorage.setItem(key, String(Date.now() + 7 * 86_400_000)); } catch { /* fără stocare: se ascunde doar acum */ }
    setHidden(true);
  };
  return (
    <aside className="card branch-invite" aria-label={sex === "F" ? t("titleF", { name }) : t("titleM", { name })}>
      <h2>{sex === "F" ? t("titleF", { name }) : t("titleM", { name })}</h2>
      <p className="muted">{t("text", { name, count: String(count) })}</p>
      {!writers && <p className="muted" style={{ fontSize: 14 }}>{t("viewOnly", { name })}</p>}
      <InvitePanel treeId={treeId} personId={personId} personName={name} campaign="ramura" defaultRole={writers ? "contributor" : "viewer"} />
      <button type="button" className="btn branch-later" onClick={later}>{t("later")}</button>
    </aside>
  );
}

"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { deleteMyAccount, withdrawFaithConsent } from "@/app/cont-actions";
import { answerUsage } from "@/app/folosire-actions";
import { setPartnerBenefits } from "@/app/parteneri-actions";
import type { DeletionPlan } from "@/lib/account";

/**
 * Retragerea acordului pentru capitolul „Credința”, cu o confirmare în pagină. Rămâne în pagină și după retragere
 * (`granted` devine fals), ca omul să vadă mesajul.
 */
export function FaithWithdraw({ answers, granted }: { answers: number; granted: boolean }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("MyData.faith");
  const tr = useTranslations("MyData.remove");
  if (msg) return <p className="notice" role="status">{msg}</p>;
  if (!granted) return null;
  if (!ask) return <button className="btn" onClick={() => setAsk(true)}>{t("withdraw")}</button>;
  return (
    <div className="confirm">
      {answers === 1 ? <>{t("warnOne")} </> : answers > 1 ? <>{t("warnMany", { count: answers })} </> : null}
      {t("again")}
      <div className="actions">
        <button className="btn danger" disabled={pending} onClick={() => start(async () => {
          const r = await withdrawFaithConsent();
          if (r.error) return setMsg(r.error);
          setMsg(r.removed ? t("doneRemoved", { count: r.removed }) : t("done"));
          router.refresh();
        })}>{pending ? t("pending") : t("confirm")}</button>
        <button className="btn" disabled={pending} onClick={() => setAsk(false)}>{tr("cancel")}</button>
      </div>
    </div>
  );
}

/** Măsurarea timpului petrecut în site: pornită sau oprită de om; oprirea șterge tot ce s-a adunat. */
export function UsageToggle({ granted, demo }: { granted: boolean; demo: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("MyData.usage");
  if (demo) return <p className="muted">{t("demo")}</p>;
  return (
    <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
      <button className="btn" disabled={pending} onClick={() => start(async () => {
        const r = await answerUsage(!granted);
        if (r.error) return setMsg(r.error);
        setMsg(granted ? t("stopped") : t("started"));
        router.refresh();
      })}>{pending ? t("pending") : granted ? t("stop") : t("start")}</button>
      {msg && <span role="status" className="muted">{msg}</span>}
    </div>
  );
}

/**
 * Comutatorul „Beneficii de la parteneri” (PropManage): un clic pornește, un clic oprește. Oprit, adresa iese pe loc din lista
 * partenerului. Contul de probă nu-și poate da acordul.
 */
export function PartnerToggle({ granted, demo }: { granted: boolean; demo: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("MyData.partner");
  if (demo) return <p className="muted">{t("demo")}</p>;
  return (
    <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
      <button type="button" role="switch" aria-checked={granted} className={`switch${granted ? " on" : ""}`} disabled={pending}
        onClick={() => start(async () => {
          const r = await setPartnerBenefits(!granted);
          if (r.error) return setMsg(r.error);
          setMsg(granted ? t("withdrawn") : t("given"));
          router.refresh();
        })}>
        <span className="switch-knob" aria-hidden />
        <span>{t("switch")}</span>
      </button>
      {msg && <span role="status" className="muted">{msg}</span>}
    </div>
  );
}

/**
 * Ștergerea contului: întâi arată ce pleacă și ce rămâne (arbore cu arbore), apoi cere adresa de email ca semn că omul știe
 * ce face. Butonul se aprinde doar când adresa se potrivește.
 */
export function AccountDelete({ plan, email, demo }: { plan: DeletionPlan; email: string; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [scrub, setScrub] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ok = typed.trim().toLowerCase() === email.toLowerCase();
  const t = useTranslations("MyData.remove");
  const b = (c: ReactNode) => <b>{c}</b>;
  if (demo) return <p className="muted">{t("demo")}</p>;
  if (!open) return <button className="btn danger" onClick={() => setOpen(true)}>{t("open")}</button>;
  const gone = plan.owned.filter((t) => !t.heir), passed = plan.owned.filter((t) => t.heir);
  // Fișele din arborii care se șterg cu totul pleacă și ele; rămân doar cele din arborii familiei.
  const kept = plan.claimed.filter((c) => !gone.some((t) => t.id === c.treeId));
  return (
    <div className="my-delete">
      <p><b>{t("goneTitle")}</b></p>
      <ul>
        <li>{t("account")}</li>
        {plan.memories > 0 && <li>{t("memories", { count: plan.memories, faith: plan.faith })}</li>}
        {plan.replies > 0 && <li>{t("replies", { count: plan.replies })}</li>}
        {plan.messages > 0 && <li>{t("messages", { count: plan.messages })}</li>}
        <li>{t("rest")}</li>
        {gone.map((x) => (
          <li key={x.id}>{t.rich("treeGone", { name: x.name, count: x.people, b })}</li>
        ))}
      </ul>
      {(passed.length > 0 || plan.member.length > 0) && (
        <>
          <p><b>{t("keptTitle")}</b></p>
          <ul>
            {passed.map((x) => <li key={x.id}>{t.rich("treePassed", { name: x.name, heir: x.heir!.name, role: x.heir!.role, b })}</li>)}
            {plan.member.map((x) => <li key={x.id}>{t("treeLeft", { name: x.name })}</li>)}
            {kept.map((c) => <li key={c.personId}>{t("card", { name: c.treeName })}</li>)}
            <li>{t("added")}</li>
          </ul>
        </>
      )}
      {kept.some((c) => c.living) && (
        <label className="radio my-scrub">
          <input type="checkbox" checked={scrub} onChange={(e) => setScrub(e.target.checked)} />
          <span>{t("scrub")}</span>
        </label>
      )}
      <label className="form my-confirm">
        <span>{t.rich("confirmLabel", { email, b })}</span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} type="email" autoComplete="off" spellCheck={false} inputMode="email" aria-label={t("emailAria")} />
      </label>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions">
        <button className="btn danger" disabled={!ok || pending} onClick={() => start(async () => {
          setErr(null);
          const r = await deleteMyAccount({ confirm: typed, scrub });
          if (r?.error) setErr(r.error);
        })}>{pending ? t("pending") : t("confirm")}</button>
        <button className="btn" disabled={pending} onClick={() => { setOpen(false); setTyped(""); setErr(null); }}>{t("cancel")}</button>
      </div>
    </div>
  );
}

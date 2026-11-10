"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount, withdrawFaithConsent } from "@/app/cont-actions";
import { answerUsage } from "@/app/folosire-actions";
import { setPartnerBenefits } from "@/app/parteneri-actions";
import type { DeletionPlan } from "@/lib/account";
import { de, persoane } from "@/lib/ro-words";

const ROLE: Record<string, string> = { owner: "proprietar", editor: "editor", contributor: "contributor", viewer: "vizitator" };
const many = (n: number, one: string, more: string) => (n === 1 ? one : `${de(n)} ${more}`);

/**
 * Retragerea acordului pentru capitolul „Credința”, cu o confirmare în pagină. Rămâne în pagină și după retragere
 * (`granted` devine fals), ca omul să vadă mesajul.
 */
export function FaithWithdraw({ answers, granted }: { answers: number; granted: boolean }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  if (msg) return <p className="notice" role="status">{msg}</p>;
  if (!granted) return null;
  if (!ask) return <button className="btn" onClick={() => setAsk(true)}>Retrage acordul</button>;
  return (
    <div className="confirm">
      {answers === 1 ? <>Se șterge și răspunsul tău din capitolul „Credința”, cu tot ce e pus la el. </>
        : answers > 1 ? <>Se șterg și cele {de(answers)} răspunsuri ale tale din capitolul „Credința”, cu tot ce e pus la ele. </> : null}
      Acordul îl poți da din nou oricând, când mai scrii în acest capitol.
      <div className="actions">
        <button className="btn danger" disabled={pending} onClick={() => start(async () => {
          const r = await withdrawFaithConsent();
          if (r.error) return setMsg(r.error);
          setMsg(r.removed ? `Am retras acordul și am șters ${many(r.removed, "răspunsul", "răspunsuri")} din capitolul „Credința”.` : "Am retras acordul.");
          router.refresh();
        })}>{pending ? "Se retrage…" : "Da, retrag acordul"}</button>
        <button className="btn" disabled={pending} onClick={() => setAsk(false)}>Renunță</button>
      </div>
    </div>
  );
}

/** Măsurarea timpului petrecut în site: pornită sau oprită de om; oprirea șterge tot ce s-a adunat. */
export function UsageToggle({ granted, demo }: { granted: boolean; demo: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  if (demo) return <p className="muted">Contul de probă nu se măsoară.</p>;
  return (
    <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
      <button className="btn" disabled={pending} onClick={() => start(async () => {
        const r = await answerUsage(!granted);
        if (r.error) return setMsg(r.error);
        setMsg(granted ? "Am oprit măsurarea și am șters tot ce se adunase." : "Am pornit măsurarea. Mulțumim!");
        router.refresh();
      })}>{pending ? "Se schimbă…" : granted ? "Oprește și șterge ce s-a adunat" : "Pornește măsurarea"}</button>
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
  if (demo) return <p className="muted">Contul de probă e folosit de mai mulți oameni, așa că nu primește beneficii de la parteneri.</p>;
  return (
    <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
      <button type="button" role="switch" aria-checked={granted} className={`switch${granted ? " on" : ""}`} disabled={pending}
        onClick={() => start(async () => {
          const r = await setPartnerBenefits(!granted);
          if (r.error) return setMsg(r.error);
          setMsg(granted ? "Am retras acordul. Adresa ta nu mai ajunge la PropManage." : "Gata, ți-ai dat acordul. Mulțumim!");
          router.refresh();
        })}>
        <span className="switch-knob" aria-hidden />
        <span>Beneficii de la parteneri</span>
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
  if (demo) return <p className="muted">Contul de probă e folosit de mai mulți oameni, așa că nu se poate șterge.</p>;
  if (!open) return <button className="btn danger" onClick={() => setOpen(true)}>Vreau să-mi șterg contul</button>;
  const gone = plan.owned.filter((t) => !t.heir), passed = plan.owned.filter((t) => t.heir);
  // Fișele din arborii care se șterg cu totul pleacă și ele; rămân doar cele din arborii familiei.
  const kept = plan.claimed.filter((c) => !gone.some((t) => t.id === c.treeId));
  return (
    <div className="my-delete">
      <p><b>Se șterg pentru totdeauna:</b></p>
      <ul>
        <li>contul tău, cu emailul și parola;</li>
        {plan.memories > 0 && <li>{many(plan.memories, "amintirea din lada ta", "amintiri din lada ta")}, cu glasul și pozele puse la ele{plan.faith ? `, inclusiv ${plan.faith === 1 ? "răspunsul" : `cele ${de(plan.faith)} răspunsuri`} despre credință` : ""};</li>}
        {plan.replies > 0 && <li>{many(plan.replies, "rândul scris", "rânduri scrise")} de tine la „Și eu îmi amintesc”;</li>}
        {plan.messages > 0 && <li>{many(plan.messages, "mesajul", "mesaje")} din „Mesaje”, și pentru cei cu care ai vorbit;</li>}
        <li>întrebările tale încă fără răspuns, casele bătrânești scrise de tine, cererile și acordurile tale (și cel pentru parteneri);</li>
        {gone.map((t) => (
          <li key={t.id}>arborele <b>„{t.name}”</b>, care n-are alți membri, cu {persoane(t.people)} și cu pozele și actele lor. Dacă vrei să rămână, invită înainte pe cineva în el sau descarcă-l ca GEDCOM, din pagina lui.</li>
        ))}
      </ul>
      {(passed.length > 0 || plan.member.length > 0) && (
        <>
          <p><b>Rămân ale familiei:</b></p>
          <ul>
            {passed.map((t) => <li key={t.id}>arborele <b>„{t.name}”</b>, care trece la {t.heir!.name}{t.heir!.role !== "owner" ? ` (acum ${ROLE[t.heir!.role]})` : ""}, cu tot ce e în el;</li>)}
            {plan.member.map((t) => <li key={t.id}>arborele „{t.name}”, din care ieși;</li>)}
            {kept.map((c) => <li key={c.personId}>fișa ta din „{c.treeName}”, fără legătura cu contul;</li>)}
            <li>persoanele, pozele și actele pe care le-ai pus în acești arbori.</li>
          </ul>
        </>
      )}
      {kept.some((c) => c.living) && (
        <label className="radio my-scrub">
          <input type="checkbox" checked={scrub} onChange={(e) => setScrub(e.target.checked)} />
          <span>Golește și fișa mea din arbori de datele mele: data și locul nașterii, unde locuiesc, ocupația, biografia și poza de profil.
            Rămân numele și legăturile de rudenie, ca arborele familiei să nu se rupă.</span>
        </label>
      )}
      <label className="form my-confirm">
        <span>Ca să confirmi, scrie adresa ta de email, <b>{email}</b>:</span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} type="email" autoComplete="off" spellCheck={false} inputMode="email" aria-label="Adresa ta de email" />
      </label>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions">
        <button className="btn danger" disabled={!ok || pending} onClick={() => start(async () => {
          setErr(null);
          const r = await deleteMyAccount({ confirm: typed, scrub });
          if (r?.error) setErr(r.error);
        })}>{pending ? "Se șterge…" : "Șterge contul pentru totdeauna"}</button>
        <button className="btn" disabled={pending} onClick={() => { setOpen(false); setTyped(""); setErr(null); }}>Renunță</button>
      </div>
    </div>
  );
}
